'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import toast from 'react-hot-toast';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      } else {
        toast.error('Failed to crop image');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const ratios = [
    { label: 'FREE', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '16:9', value: 16 / 9 },
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border-[4px] border-black flex flex-col h-[85vh] animate-slide-up" style={{ boxShadow: '8px 8px 0px #F5F500' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-acid-yellow">
          <h2 className="font-brutal text-2xl">✂️ CROP IMAGE</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center border-[2px] border-black bg-black text-white hover:bg-hot-pink transition-colors font-brutal">
            ✕
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-gray-900 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            classes={{ containerClassName: 'cropper-container' }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t-[3px] border-black bg-white flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="font-brutal text-sm">ZOOM</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-brutal text-sm">ASPECT RATIO</label>
            <div className="flex gap-2 flex-wrap">
              {ratios.map(r => (
                <button
                  key={r.label}
                  onClick={() => setAspect(r.value)}
                  className={`btn-brutal-sm ${aspect === r.value ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn-brutal bg-lime-green w-full py-3 text-xl mt-2"
          >
            {isProcessing ? 'PROCESSING...' : 'CONFIRM CROP'}
          </button>
        </div>

      </div>
    </div>
  );
}
