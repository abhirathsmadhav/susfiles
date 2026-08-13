'use client';

import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ImageCropper from './ImageCropper';

import { FolderUp, Music, X, Maximize, Square, Monitor, MonitorPlay, Smartphone } from 'lucide-react';

import { compressVideo, compressAudio, MAX_UPLOAD_BYTES, MAX_HARD_LIMIT_BYTES } from '@/lib/compress-media';

/**
 * Smart lossless-first image compression:
 * 1. Tries PNG (truly lossless) first — smaller than original for many images
 * 2. Falls back to WebP starting at quality=1.0 (max), stepping down by 0.01
 *    per pass — minimum quality reduction to reach target size.
 */
async function compressImageToUnder50MB(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // --- Pass 1: Try PNG (truly lossless, no quality loss at all) ---
      canvas.toBlob((pngResult) => {
        if (pngResult && pngResult.size < MAX_UPLOAD_BYTES) {
          resolve(pngResult); // Perfect: lossless and under 50 MB
          return;
        }

        // --- Pass 2: WebP at maximum quality, stepping down by 0.01 only if needed ---
        // quality=1.0 is the highest WebP quality (perceptually lossless for photos)
        const tryWebP = (quality: number) => {
          canvas.toBlob(
            (result) => {
              if (!result) {
                reject(new Error('Canvas compression failed.'));
                return;
              }
              if (result.size < MAX_UPLOAD_BYTES) {
                resolve(result);
              } else if (quality <= 0.5) {
                // Even at 50% quality we're still over 50 MB — extremely unlikely
                // Resolve anyway with the best we can do
                resolve(result);
              } else {
                // Reduce by smallest meaningful step (0.01)
                tryWebP(parseFloat((quality - 0.01).toFixed(2)));
              }
            },
            'image/webp',
            quality
          );
        };

        tryWebP(1.0); // Start at absolute maximum quality
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression.'));
    };

    img.src = objectUrl;
  });
}

interface UploadZoneProps {
  onUpload: (url: string, aspectRatio?: 'original' | '1:1' | '4:3' | '16:9' | '9:16') => void;
  currentUrl?: string;
  acceptAudio?: boolean;
}

export default function UploadZone({ onUpload, currentUrl, acceptAudio = true }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('UPLOADING...');
  const [preview, setPreview] = useState<string>(currentUrl ?? '');
  const [fileType, setFileType] = useState<'image' | 'audio' | 'video'>(
    currentUrl?.match(/\.(mp4|webm|mov)$/i) ? 'video' :
    currentUrl?.match(/\.(mp3|wav|ogg)$/i) || currentUrl?.includes('catbox') || currentUrl?.includes('alt=media') && currentUrl?.includes('audio') ? 'audio' : 'image'
  );
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  // Video Aspect Ratio Selection State
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [videoRatio, setVideoRatio] = useState<'original' | '1:1' | '4:3' | '16:9' | '9:16'>('original');

  const performUpload = async (fileToUpload: File | Blob, type: 'image' | 'audio' | 'video', selectedRatio?: 'original' | '1:1' | '4:3' | '16:9' | '9:16') => {
    setFileType(type);
    setUploading(true);
    setProgress(0);

    try {
      // Auth check — still uses Firebase Auth
      const { auth } = await import('@/lib/firebase');
      if (!auth.currentUser) {
        throw new Error('You must be logged in to upload files.');
      }

      // --- Hard limit: reject anything above 150 MB immediately ---
      if (fileToUpload.size > MAX_HARD_LIMIT_BYTES) {
        throw new Error(
          `File is ${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB — the maximum allowed size is 150 MB. Please use a smaller file.`
        );
      }

      // --- Auto-compress files between 50 MB and 150 MB ---
      let finalFile: File | Blob = fileToUpload;

      if (fileToUpload.size > MAX_UPLOAD_BYTES) {
        if (type === 'image') {
          toast.loading('Image too large — optimizing... ⚙️', { id: 'compress' });
          finalFile = await compressImageToUnder50MB(fileToUpload);
          toast.dismiss('compress');
          toast.success(`Optimized: ${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB → ${(finalFile.size / 1024 / 1024).toFixed(1)} MB ✅`);
        } else if (type === 'video') {
          // Load FFmpeg engine first (one-time ~30 MB download, cached by browser)
          setUploadLabel('LOADING ENGINE...');
          setProgress(0);
          finalFile = await compressVideo(fileToUpload, (p) => {
            setUploadLabel('COMPRESSING...');
            setProgress(p);
          });
          setProgress(0);
          toast.success(`Video compressed: ${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB → ${(finalFile.size / 1024 / 1024).toFixed(1)} MB ✅`);
        } else if (type === 'audio') {
          setUploadLabel('LOADING ENGINE...');
          setProgress(0);
          finalFile = await compressAudio(fileToUpload, (p) => {
            setUploadLabel('COMPRESSING...');
            setProgress(p);
          });
          setProgress(0);
          toast.success(`Audio compressed: ${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB → ${(finalFile.size / 1024 / 1024).toFixed(1)} MB ✅`);
        }
      }
      setUploadLabel('UPLOADING...');
      // -------------------------------------------

      // --- Get Cloudinary signed upload credentials from our server ---
      const sigRes = await fetch('/api/upload');
      if (!sigRes.ok) throw new Error('Failed to get upload credentials.');
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      // --- Build FormData for Cloudinary ---
      const fileExt = type === 'image' ? 'webp' : type === 'video' ? 'mp4' : 'mp3';
      const fileObj =
        finalFile instanceof File
          ? finalFile
          : new File([finalFile], `upload.${fileExt}`, {
              type: finalFile.type || 'application/octet-stream',
            });

      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      // --- Upload directly to Cloudinary via XHR (real progress %) ---
      const resourceType = type === 'image' ? 'image' : 'video'; // Cloudinary uses 'video' for audio too
      const finalUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url as string);
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err?.error?.message || 'Upload failed.'));
            } catch {
              reject(new Error('Upload failed.'));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));

        xhr.open(
          'POST',
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
        );
        xhr.send(formData);
      });

      setPreview(finalUrl);
      onUpload(finalUrl, selectedRatio);
      toast.success(`${type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Image'} uploaded securely! 🔥`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed. Try again.');
      setPreview('');
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadLabel('UPLOADING...');
        setProgress(0);
      }, 600);
    }
  };


  const handleFile = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isAudio && !isVideo) {
        toast.error('Only images, audio, or video files allowed!');
        return;
      }
      
      if ((isAudio || isVideo) && !acceptAudio) {
        toast.error('Media not allowed here!');
        return;
      }

      // If it's an image, open cropper instead of uploading immediately
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => setCropImageSrc(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }

      // If it's a video, open ratio selector
      if (isVideo) {
        setPendingVideo(file);
        return;
      }

      setPreview('AUDIO_UPLOADING');
      await performUpload(file, 'audio');
    },
    [acceptAudio]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 cursor-pointer border-[3px] transition-all ${
          dragging
            ? 'border-solid border-hot-pink bg-pink-50'
            : 'border-dashed border-black bg-white hover:bg-acid-yellow/10'
        }`}
        style={{ boxShadow: dragging ? '6px 6px 0px #FF2D78' : '4px 4px 0px #000' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAudio ? "image/*,audio/*,video/*" : "image/*"}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="text-center">
            <div className="font-brutal text-lg mb-2">{uploadLabel}</div>
            <div className="w-48 h-3 border-[2px] border-black bg-white overflow-hidden">
              <div
                className="h-full bg-acid-yellow transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-mono text-xs mt-1">
              {uploadLabel === 'LOADING ENGINE...' ? 'one-time download ~30 MB' : `${progress}%`}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-2">
              <FolderUp className="w-10 h-10 text-black" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-brutal text-base uppercase tracking-wide">
                {dragging ? '🔥 DROP IT!' : 'DROP YOUR CHAOS HERE'}
              </p>
              <p className="text-xs opacity-60 mt-1 font-mono">
                or click to pick a file · JPG, PNG, WEBP {acceptAudio && ', MP3, MP4'}
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: '#FF2D78' }}>
                Max 150 MB · Auto-compressed if over 50 MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && !uploading && preview !== 'AUDIO_UPLOADING' && (
        <div className="relative border-[3px] border-black overflow-hidden bg-white" style={{ boxShadow: '4px 4px 0px #000' }}>
          {fileType === 'video' ? (
            <video src={preview} controls className="w-full aspect-square object-cover bg-black" />
          ) : fileType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full max-h-48 object-contain bg-black" />
          ) : (
            <div className="p-6 flex flex-col items-center justify-center font-mono">
              <Music className="w-10 h-10 mb-2" strokeWidth={1.5} />
              <p className="text-sm truncate px-2">{preview}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setPreview(''); onUpload(''); }}
            className="absolute top-2 right-2 w-7 h-7 bg-hot-pink border-[2px] border-black text-white font-brutal text-xs flex items-center justify-center"
            aria-label="Remove media"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={async (croppedBlob) => {
            setCropImageSrc(null);
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(croppedBlob);
            await performUpload(croppedBlob, 'image');
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {/* Video Aspect Ratio Modal */}
      {pendingVideo && (
        <div className="modal-overlay z-[200]">
          <div className="panel-brutal bg-white w-full max-w-sm animate-slide-up text-center">
            <h2 className="font-brutal text-2xl mb-4">SELECT CROP RATIO</h2>
            <p className="font-mono text-xs opacity-60 mb-6">Choose how the video should be framed on the wall.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'original', label: 'ORIGINAL', icon: <Maximize className="w-6 h-6" /> },
                { id: '1:1', label: 'SQUARE (1:1)', icon: <Square className="w-6 h-6" /> },
                { id: '4:3', label: 'RETRO (4:3)', icon: <Monitor className="w-6 h-6" /> },
                { id: '16:9', label: 'WIDE (16:9)', icon: <MonitorPlay className="w-6 h-6" /> },
                { id: '9:16', label: 'PORTRAIT (9:16)', icon: <Smartphone className="w-6 h-6" /> },
              ].map(ratio => (
                <button
                  key={ratio.id}
                  onClick={() => setVideoRatio(ratio.id as any)}
                  className={`btn-brutal text-xs py-2 flex flex-col items-center gap-2 ${videoRatio === ratio.id ? 'bg-black text-acid-yellow' : 'bg-white hover:bg-gray-100'}`}
                >
                  <span className="flex items-center justify-center h-8">{ratio.icon}</span>
                  {ratio.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setPendingVideo(null)}
                className="btn-brutal flex-1 bg-white hover:bg-black hover:text-white"
              >
                CANCEL
              </button>
              <button 
                onClick={async () => {
                  const file = pendingVideo;
                  const ratio = videoRatio;
                  setPendingVideo(null);
                  
                  // Local preview
                  const reader = new FileReader();
                  reader.onload = (e) => setPreview(e.target?.result as string);
                  reader.readAsDataURL(file);
                  
                  await performUpload(file, 'video', ratio);
                }}
                className="btn-brutal flex-1 bg-hot-pink text-white hover:bg-black hover:text-hot-pink"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
