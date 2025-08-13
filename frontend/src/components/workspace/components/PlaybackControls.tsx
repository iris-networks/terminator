import React from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PlaybackControlsProps {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlayback: () => void;
  onPreviousFrame: () => void;
  onNextFrame: () => void;
  onFirstFrame: () => void;
  onLastFrame: () => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentFrame,
  totalFrames,
  isPlaying,
  playbackSpeed,
  onTogglePlayback,
  onPreviousFrame,
  onNextFrame,
  onFirstFrame,
  onLastFrame,
  onSpeedChange
}) => {
  if (totalFrames <= 1) return null;

  return (
    <motion.div
      className="flex items-center justify-center gap-4 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* First Frame */}
      <button
        onClick={onFirstFrame}
        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={currentFrame === 0}
      >
        <FiSkipBack size={18} />
      </button>

      {/* Previous Frame */}
      <button
        onClick={onPreviousFrame}
        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={currentFrame === 0}
      >
        <FiChevronLeft size={18} />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlayback}
        className="p-3 rounded-xl bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
      </button>

      {/* Next Frame */}
      <button
        onClick={onNextFrame}
        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={currentFrame >= totalFrames - 1}
      >
        <FiChevronRight size={18} />
      </button>

      {/* Last Frame */}
      <button
        onClick={onLastFrame}
        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={currentFrame >= totalFrames - 1}
      >
        <FiSkipForward size={18} />
      </button>

      {/* Frame Counter */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
        {currentFrame + 1} / {totalFrames}
      </div>

      {/* Speed Control */}
      <select
        value={playbackSpeed}
        onChange={(e) => onSpeedChange(parseInt(e.target.value))}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value={500}>2x</option>
        <option value={1000}>1x</option>
        <option value={2000}>0.5x</option>
        <option value={3000}>0.33x</option>
      </select>
    </motion.div>
  );
};