'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface BrutalVideoPlayerProps {
  videoUrl: string;
  color?: string;
  aspectRatioClass?: string;
}

export default function BrutalVideoPlayer({ videoUrl, color = '#F5F500', aspectRatioClass = 'aspect-video' }: BrutalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current && containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full border-[3px] border-black bg-white flex flex-col relative group"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={`w-full relative bg-black flex items-center justify-center cursor-pointer ${aspectRatioClass}`} 
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 border-[4px] border-black bg-white flex items-center justify-center rounded-full transition-transform group-hover:scale-110"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-2" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="w-full bg-white border-t-[3px] border-black p-3 sm:p-4 flex flex-col gap-3 relative z-10 select-none">
        {/* Progress Bar */}
        <div 
          className="w-full h-5 border-[2px] border-black bg-off-white cursor-pointer relative shadow-[inset_0px_2px_4px_rgba(0,0,0,0.1)]"
          onClick={handleSeek}
        >
          <div 
            className="h-full border-r-[2px] border-black relative transition-all duration-75 ease-linear"
            style={{ width: `${progress}%`, backgroundColor: color }}
          >
            {/* Scrubber thumb */}
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-7 bg-white border-[2px] border-black" />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={togglePlay}
              className="hover:text-hot-pink hover:scale-110 transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" />}
            </button>
            
            <button 
              onClick={toggleMute}
              className="hover:text-electric-blue hover:scale-110 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX className="w-6 h-6 sm:w-7 sm:h-7" /> : <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />}
            </button>
            
            <span className="font-mono text-sm sm:text-base font-bold tracking-tight">
              {formatTime(currentTime)} <span className="opacity-40 mx-1">/</span> {formatTime(duration)}
            </span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="hover:scale-110 hover:text-acid-yellow transition-all active:scale-95"
            style={{ WebkitTextStroke: '1px black' }}
          >
            <Maximize className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
