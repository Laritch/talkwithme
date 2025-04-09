import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useDispatch } from 'react-redux';
import { setVideoPlayer, updateUserProgress } from '../../store/slices/coursesSlice';

const VideoPlayer = ({
  src,
  courseId,
  lessonId,
  poster,
  autoPlay = false,
  onProgress,
  onComplete,
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dispatch = useDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize HLS.js player
  useEffect(() => {
    let hls;
    const video = videoRef.current;

    if (!video || !src) return;

    // Store video player reference in Redux
    dispatch(setVideoPlayer(video));

    // Clean up if we had a previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // Check for HLS support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    } else if (Hls.isSupported()) {
      // HLS.js for other browsers
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        enableWorker: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(e => console.error('Error autoplay:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, destroying HLS instance', data);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, dispatch, autoPlay]);

  // Event handlers for the video element
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Calculate progress percentage
      const progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;

      // Update progress in Redux
      if (courseId && lessonId) {
        dispatch(updateUserProgress({
          courseId,
          lessonId,
          progress,
          currentTime: video.currentTime,
        }));
      }

      // Call progress callback if provided
      if (onProgress) {
        onProgress(progress, video.currentTime);
      }

      // Check if video is complete
      if (progress > 95 && onComplete) {
        onComplete(courseId, lessonId);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Remove event listeners on cleanup
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [courseId, lessonId, dispatch, onProgress, onComplete]);

  // Format time display (mm:ss or hh:mm:ss)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Playback control functions
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(e => console.error('Error playing video:', e));
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const seekPosition = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
    video.currentTime = seekPosition;
  };

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  return (
    <div className="video-player-container relative">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        controls
        playsInline
      />

      {/* Custom Controls (optional, can be shown when native controls are hidden) */}
      <div className="custom-controls hidden">
        <div className="progress-bar" onClick={handleSeek}>
          <div
            className="progress-filled"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="controls-bottom">
          <button onClick={togglePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="playback-rate">
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
