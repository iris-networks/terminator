import { useState, useEffect } from 'react';
import { PlaybackState } from '../types';

export const usePlayback = (totalFrames: number) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  // Auto playback functionality
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalFrames]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToPreviousFrame = () => {
    setCurrentFrame(prev => Math.max(0, prev - 1));
  };

  const goToNextFrame = () => {
    setCurrentFrame(prev => Math.min(totalFrames - 1, prev + 1));
  };

  const goToFirstFrame = () => {
    setCurrentFrame(0);
  };

  const goToLastFrame = () => {
    setCurrentFrame(totalFrames - 1);
  };

  const setFrameDirectly = (frame: number) => {
    setCurrentFrame(Math.max(0, Math.min(totalFrames - 1, frame)));
  };

  return {
    currentFrame,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlayback,
    goToPreviousFrame,
    goToNextFrame,
    goToFirstFrame,
    goToLastFrame,
    setFrameDirectly,
    setCurrentFrame
  };
};