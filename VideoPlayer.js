import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({
  src,
  poster,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
  startTime = 0,
  controls = true,
  className = '',
}) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // Clean up any existing HLS instance
    if (hlsInstance) {
      hlsInstance.destroy();
      setHlsInstance(null);
    }

    // If source is empty or null, do nothing
    if (!src) {
      setError('No video source provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check if the browser has native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;

      // Set the current time after metadata is loaded
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = startTime;
        setIsLoading(false);
      });

      video.addEventListener('error', () => {
        setError('Error loading video');
        setIsLoading(false);
      });
    } else if (Hls.isSupported()) {
      // Use HLS.js for other browsers
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60 MB
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1, // Auto start level selection
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = startTime;
        if (autoPlay) {
          video.play().catch(error => {
            console.warn('Auto-play was prevented:', error);
          });
        }
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error:', data);
              hls.startLoad(); // Try to recover
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error:', data);
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              // Cannot recover from other errors
              hls.destroy();
              setError(`Fatal video error: ${data.details}`);
              break;
          }
        }
      });

      setHlsInstance(hls);
    } else {
      // HLS is not supported in this browser and it's not Safari
      setError('HLS playback is not supported in this browser');
      setIsLoading(false);
    }

    // Clean up function
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [src, autoPlay, startTime, hlsInstance]);

  // Set up time update handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  return (
    <div className={`video-player-container relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="loader">Loading...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="error-message text-white bg-red-600 p-4 rounded shadow">
            {error}
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        controls={controls}
        playsInline
        preload="metadata"
      />
    </div>
  );
};

export default VideoPlayer;
