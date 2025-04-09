import React, { useState } from 'react';
import {
  ChatMessage,
  ChatExportOptions,
  exportChatTranscript,
} from '@/lib/export/pdfExportService';

interface ChatExportButtonProps {
  messages: ChatMessage[];
  chatTitle?: string;
  variant?: 'button' | 'icon' | 'link';
  className?: string;
  iconOnly?: boolean;
  customOptions?: Partial<ChatExportOptions>;
}

const ChatExportButton: React.FC<ChatExportButtonProps> = ({
  messages,
  chatTitle = 'Chat Transcript',
  variant = 'button',
  className = '',
  iconOnly = false,
  customOptions = {},
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [options, setOptions] = useState<ChatExportOptions>({
    title: chatTitle,
    includeTimestamps: true,
    includeAttachments: true,
    includeUserInfo: true,
    dateFormat: 'MMM DD, YYYY HH:mm',
    orientation: 'portrait',
    pageSize: 'a4',
    theme: 'light',
    ...customOptions,
  });

  const handleExport = async (action: 'download' | 'open' = 'download') => {
    if (messages.length === 0) {
      alert('No messages to export');
      return;
    }

    setLoading(true);
    try {
      await exportChatTranscript(messages, options, action);
    } catch (error) {
      console.error('Error exporting chat:', error);
      alert('Failed to export chat transcript. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleOptionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setOptions({
      ...options,
      [name]: newValue,
    });
  };

  // Render the button based on the variant
  const renderButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <button
            className={`export-icon-button ${className}`}
            onClick={toggleOptions}
            disabled={loading || messages.length === 0}
            aria-label="Export chat"
            title="Export chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {!iconOnly && <span>Export</span>}
          </button>
        );
      case 'link':
        return (
          <a
            href="#"
            className={`export-link ${className}`}
            onClick={(e) => {
              e.preventDefault();
              toggleOptions();
            }}
            aria-disabled={loading || messages.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="export-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {!iconOnly && <span>Export Chat</span>}
          </a>
        );
      case 'button':
      default:
        return (
          <button
            className={`export-button ${className}`}
            onClick={toggleOptions}
            disabled={loading || messages.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="export-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {!iconOnly && <span>Export Chat</span>}
          </button>
        );
    }
  };

  return (
    <div className="chat-export-container">
      {renderButton()}

      {showOptions && (
        <div className="export-options-modal">
          <div className="modal-backdrop" onClick={toggleOptions}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Export Chat Transcript</h3>
              <button
                className="close-button"
                onClick={toggleOptions}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={options.title || ''}
                  onChange={handleOptionChange}
                  placeholder="Chat Transcript"
                />
              </div>

              <div className="option-group">
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="includeTimestamps"
                      checked={options.includeTimestamps}
                      onChange={handleOptionChange}
                    />
                    Include timestamps
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="includeAttachments"
                      checked={options.includeAttachments}
                      onChange={handleOptionChange}
                    />
                    Include attachments
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="includeUserInfo"
                      checked={options.includeUserInfo}
                      onChange={handleOptionChange}
                    />
                    Include user info
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="orientation">Page Orientation</label>
                <select
                  id="orientation"
                  name="orientation"
                  value={options.orientation}
                  onChange={handleOptionChange}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  name="theme"
                  value={options.theme}
                  onChange={handleOptionChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={toggleOptions}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="preview-button"
                onClick={() => handleExport('open')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Preview'}
              </button>
              <button
                className="download-button"
                onClick={() => handleExport('download')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-export-container {
          position: relative;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color: #edf2f7;
          color: #4a5568;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-button:hover:not(:disabled) {
          background-color: #e2e8f0;
        }

        .export-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .export-icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          background-color: transparent;
          color: #4a5568;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-icon-button:hover:not(:disabled) {
          background-color: #edf2f7;
        }

        .export-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #3182ce;
          text-decoration: none;
          transition: color 0.2s;
        }

        .export-link:hover:not([aria-disabled="true"]) {
          color: #2c5282;
          text-decoration: underline;
        }

        .export-link[aria-disabled="true"] {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .export-icon {
          flex-shrink: 0;
        }

        .export-options-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          position: relative;
          width: 100%;
          max-width: 500px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          z-index: 1;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
        }

        .close-button {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #a0aec0;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #2d3748;
        }

        .option-group {
          margin-bottom: 16px;
        }

        .checkbox-group {
          margin-bottom: 8px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .modal-footer {
          padding: 16px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-button {
          padding: 8px 16px;
          background-color: white;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cancel-button:hover:not(:disabled) {
          background-color: #f7fafc;
        }

        .preview-button {
          padding: 8px 16px;
          background-color: #edf2f7;
          color: #4a5568;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .preview-button:hover:not(:disabled) {
          background-color: #e2e8f0;
        }

        .download-button {
          padding: 8px 16px;
          background-color: #2c3e50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .download-button:hover:not(:disabled) {
          background-color: #1a202c;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatExportButton;
