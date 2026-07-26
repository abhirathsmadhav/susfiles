'use client';

import { useRef, useState } from 'react';

interface CassettePlayerProps {
  audioUrl: string;
  title?: string;
  color?: string;
}

export default function CassettePlayer({ audioUrl, title, color = '#F5F500' }: CassettePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div 
      className="w-full bg-[#E5E5E5] border-b-[2px] border-black p-3 relative flex flex-col items-center select-none"
      onClick={(e) => e.stopPropagation()} 
    >
      {/* Outer shell */}
      <div className="w-full border-[2px] border-black bg-[#F4F4F4] rounded-md p-2 relative shadow-[inset_0px_0px_10px_rgba(0,0,0,0.1)]">
        
        {/* Label Area */}
        <div 
          className="w-full border-[2px] border-black text-center py-1.5 mb-3 relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {/* Label lines */}
          <div className="absolute top-1.5 left-2 right-2 border-t border-black/20" />
          <div className="absolute top-3.5 left-2 right-2 border-t border-black/20" />
          <div className="absolute top-5.5 left-2 right-2 border-t border-black/20" />
          
          <p className="font-mono text-[10px] font-bold uppercase truncate px-2 relative z-10 mix-blend-multiply opacity-80" style={{ fontFamily: '"Space Mono", monospace' }}>
            {title || 'CLASSIFIED WIRETAP'}
          </p>
        </div>

        {/* Cassette Window & Reels */}
        <div className="flex justify-center items-center gap-4 sm:gap-6 bg-[#222] border-[2px] border-black rounded p-2 sm:p-3 relative overflow-hidden shadow-[inset_0px_2px_5px_rgba(0,0,0,0.5)]">
          
          {/* Left Reel */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[2px] border-[#888] flex items-center justify-center relative bg-[#111]">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] border-dashed border-[#AAA] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full absolute" />
          </div>

          {/* Tape Progress Window */}
          <div className="flex-1 max-w-[60px] sm:max-w-[80px] h-4 sm:h-5 border-[2px] border-[#555] bg-[#444] relative flex items-center px-1 overflow-hidden">
            {/* The "tape" moving */}
            <div 
              className="h-full bg-black absolute left-0"
              style={{ width: `${100 - (progress * 0.8)}%`, transition: 'width 0.2s linear' }}
            />
            <div 
              className="h-full bg-black absolute right-0"
              style={{ width: `${20 + (progress * 0.8)}%`, transition: 'width 0.2s linear' }}
            />
            {/* Center head */}
            <div className="w-1.5 h-full bg-[#888] absolute left-1/2 -translate-x-1/2 z-10 shadow-sm" />
          </div>

          {/* Right Reel */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[2px] border-[#888] flex items-center justify-center relative bg-[#111]">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] border-dashed border-[#AAA] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full absolute" />
          </div>

        </div>

        {/* Screws */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full border border-black/30 bg-black/10" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border border-black/30 bg-black/10" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full border border-black/30 bg-black/10" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-black/30 bg-black/10" />
      </div>

      {/* Cassette Bottom Lip & Controls */}
      <div className="mt-3 flex gap-2 sm:gap-3 w-full justify-center">
        <button
          onClick={togglePlay}
          className={`flex-1 max-w-[80px] py-1.5 sm:py-2 bg-[#D4D4D4] border-[2px] border-black text-black font-brutal text-xs sm:text-sm uppercase hover:bg-black hover:text-white transition-all ${isPlaying ? 'translate-y-1 shadow-none' : 'shadow-[2px_2px_0px_#000]'}`}
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={() => { 
            if(audioRef.current) { 
              audioRef.current.pause(); 
              audioRef.current.currentTime = 0; 
            } 
            handleEnded(); 
          }}
          className="flex-1 max-w-[80px] py-1.5 sm:py-2 bg-[#D4D4D4] border-[2px] border-black text-black font-brutal text-xs sm:text-sm uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          STOP
        </button>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
