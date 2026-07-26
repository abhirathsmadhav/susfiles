'use client';

import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ImageCropper from './ImageCropper';
import { uploadImage } from '@/lib/imgbb';

interface UploadZoneProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  acceptAudio?: boolean;
}

export default function UploadZone({ onUpload, currentUrl, acceptAudio = true }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl ?? '');
  const [fileType, setFileType] = useState<'image' | 'audio' | 'video'>(
    currentUrl?.match(/\.(mp4|webm|mov)$/i) ? 'video' :
    currentUrl?.match(/\.(mp3|wav|ogg)$/i) || currentUrl?.includes('catbox') || currentUrl?.includes('alt=media') && currentUrl?.includes('audio') ? 'audio' : 'image'
  );
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const performUpload = async (fileToUpload: File | Blob, type: 'image' | 'audio' | 'video') => {
    setFileType(type);
    setUploading(true);
    setProgress(30);

    try {
      const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 200);
      let finalUrl = '';

      if (type === 'image') {
        const fileObj = fileToUpload instanceof File ? fileToUpload : new File([fileToUpload], 'cropped.jpg', { type: 'image/jpeg' });
        const { url } = await uploadImage(fileObj);
        finalUrl = url;
      } else {
        const fileObj = fileToUpload instanceof File ? fileToUpload : new File([fileToUpload], `file.${type === 'video' ? 'mp4' : 'mp3'}`, { type: fileToUpload.type || 'application/octet-stream' });
        const fd = new FormData();
        fd.append('file', fileObj);
        
        // Upload directly to kappa.lol bypassing Vercel limits
        const res = await fetch('https://kappa.lol/api/upload', { 
          method: 'POST', 
          body: fd,
          // kappa.lol supports CORS
        });
        
        if (!res.ok) throw new Error('Media upload failed');
        const data = await res.json();
        finalUrl = data.link;
      }

      clearInterval(progressInterval);
      setProgress(100);
      setPreview(finalUrl);
      onUpload(finalUrl);
      toast.success(`${type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Image'} uploaded! 🔥`);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Try again.');
      setPreview('');
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
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

      // Local preview for video/audio
      if (isVideo) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview('AUDIO_UPLOADING');
      }

      await performUpload(file, isVideo ? 'video' : 'audio');
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
            <div className="font-brutal text-lg mb-2">UPLOADING...</div>
            <div className="w-48 h-3 border-[2px] border-black bg-white overflow-hidden">
              <div
                className="h-full bg-acid-yellow transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-mono text-xs mt-1">{progress}%</div>
          </div>
        ) : (
          <>
            <div className="text-4xl">📂</div>
            <div className="text-center">
              <p className="font-brutal text-base uppercase tracking-wide">
                {dragging ? '🔥 DROP IT!' : 'DROP YOUR CHAOS HERE'}
              </p>
              <p className="text-xs opacity-60 mt-1 font-mono">
                or click to pick a file · JPG, PNG, WEBP {acceptAudio && ', MP3, MP4'}
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
            <div className="p-6 text-center font-mono">
              <div className="text-3xl mb-2">🎵</div>
              <p className="text-sm truncate px-2">{preview}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setPreview(''); onUpload(''); }}
            className="absolute top-2 right-2 w-7 h-7 bg-hot-pink border-[2px] border-black text-white font-brutal text-xs flex items-center justify-center"
            aria-label="Remove media"
          >
            ✕
          </button>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={(croppedBlob) => {
            setCropImageSrc(null);
            performUpload(croppedBlob, 'image');
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
