import React, { useEffect, useState } from 'react';

const OfflineDetector: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    setIsOffline(!navigator.onLine);

    // Add event listeners
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-notification">
      <div className="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
      <p>You are currently offline. Some features may be limited.</p>

      <style jsx>{`
        .offline-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #2c3e50;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-width: 320px;
          animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .offline-icon {
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default OfflineDetector;
