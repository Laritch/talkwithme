/**
 * Attachment Viewer Module
 *
 * This module provides functionality for:
 * - Rich preview of various file types in messages
 * - Lightbox for images and videos
 * - File information display
 * - Download options
 */

class AttachmentViewer {
  constructor(socket) {
    this.socket = socket;
    this.lightbox = null;
    this.currentAttachment = null;

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the attachment viewer
   */
  init() {
    // Create lightbox container
    this.createLightbox();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create the lightbox container for full-size media viewing
   */
  createLightbox() {
    // Check if lightbox already exists
    if (document.getElementById('attachment-lightbox')) return;

    // Create lightbox element
    const lightbox = document.createElement('div');
    lightbox.id = 'attachment-lightbox';
    lightbox.className = 'attachment-lightbox';

    lightbox.innerHTML = `
      <div class="lightbox-content"></div>
      <div class="lightbox-controls">
        <button class="lightbox-btn download-btn" title="Download">
          <i class="fas fa-download"></i>
        </button>
        <button class="lightbox-btn close-btn" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="lightbox-caption"></div>
    `;

    // Add to document
    document.body.appendChild(lightbox);

    // Store reference
    this.lightbox = lightbox;
  }

  /**
   * Set up event listeners for the attachment viewer
   */
  setupEventListeners() {
    // Use event delegation for attachment interactions
    document.addEventListener('click', (event) => {
      // Handle image click to open lightbox
      if (event.target.closest('.attachment-image')) {
        const imageContainer = event.target.closest('.attachment-image');
        const img = imageContainer.querySelector('img');

        if (img) {
          this.openLightbox('image', {
            src: img.src,
            alt: img.alt || 'Image attachment',
            fileName: imageContainer.dataset.fileName || 'image'
          });
        }
      }

      // Handle video click to open lightbox
      else if (event.target.closest('.attachment-video')) {
        const videoContainer = event.target.closest('.attachment-video');
        const video = videoContainer.querySelector('video');

        if (video) {
          this.openLightbox('video', {
            src: video.src,
            poster: video.poster,
            fileName: videoContainer.dataset.fileName || 'video'
          });
        }
      }

      // Handle file attachment click to download
      else if (event.target.closest('.attachment-file')) {
        const fileElement = event.target.closest('.attachment-file');
        const downloadBtn = event.target.closest('.attachment-download-btn');

        // If clicked on download button, download the file
        if (downloadBtn) {
          const fileUrl = fileElement.dataset.fileUrl;
          if (fileUrl) {
            this.downloadFile(fileUrl, fileElement.dataset.fileName);
          }
        }
        // Otherwise just open the file
        else {
          const fileUrl = fileElement.dataset.fileUrl;
          if (fileUrl) {
            window.open(fileUrl, '_blank');
          }
        }
      }

      // Handle lightbox close button
      else if (event.target.closest('.lightbox-btn.close-btn')) {
        this.closeLightbox();
      }

      // Handle lightbox download button
      else if (event.target.closest('.lightbox-btn.download-btn')) {
        if (this.currentAttachment) {
          this.downloadFile(
            this.currentAttachment.src,
            this.currentAttachment.fileName
          );
        }
      }

      // Also close lightbox when clicking outside content
      else if (event.target === this.lightbox) {
        this.closeLightbox();
      }
    });

    // Close lightbox with escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.lightbox && this.lightbox.classList.contains('active')) {
        this.closeLightbox();
      }
    });
  }

  /**
   * Open the lightbox with specific content
   * @param {string} type - The type of content ('image' or 'video')
   * @param {Object} data - The content data (src, fileName, etc.)
   */
  openLightbox(type, data) {
    if (!this.lightbox) return;

    // Store current attachment info
    this.currentAttachment = data;

    // Get content container
    const content = this.lightbox.querySelector('.lightbox-content');
    if (!content) return;

    // Clear previous content
    content.innerHTML = '';

    // Add appropriate content based on type
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = data.src;
      img.alt = data.alt || 'Attachment';

      content.appendChild(img);
    }
    else if (type === 'video') {
      const video = document.createElement('video');
      video.src = data.src;
      video.controls = true;
      video.autoplay = true;
      if (data.poster) video.poster = data.poster;

      content.appendChild(video);
    }

    // Update caption
    const caption = this.lightbox.querySelector('.lightbox-caption');
    if (caption) {
      caption.textContent = data.fileName || '';
    }

    // Show lightbox
    this.lightbox.classList.add('active');
  }

  /**
   * Close the lightbox
   */
  closeLightbox() {
    if (!this.lightbox) return;

    // Hide lightbox
    this.lightbox.classList.remove('active');

    // Clear content after animation
    setTimeout(() => {
      const content = this.lightbox.querySelector('.lightbox-content');
      if (content) content.innerHTML = '';
      this.currentAttachment = null;
    }, 300);
  }

  /**
   * Download a file
   * @param {string} url - The file URL
   * @param {string} fileName - The file name
   */
  downloadFile(url, fileName) {
    // Create an invisible anchor to trigger download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);

    // Trigger click and remove element
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }

  /**
   * Create an attachment element for a message
   * @param {Object} attachment - The attachment data
   * @returns {HTMLElement} - The attachment element
   */
  createAttachmentElement(attachment) {
    if (!attachment || !attachment.fileUrl) return null;

    const container = document.createElement('div');
    container.className = 'attachment-container';

    // Get file extension
    const fileExtension = this.getFileExtension(attachment.fileName);
    const fileType = this.getFileType(fileExtension);

    // Create appropriate element based on file type
    if (fileType === 'image') {
      container.innerHTML = `
        <div class="attachment-image" data-file-url="${attachment.fileUrl}" data-file-name="${attachment.fileName}">
          <img src="${attachment.fileUrl}" alt="${attachment.fileName}">
          <div class="zoom-icon">
            <i class="fas fa-search-plus"></i>
          </div>
        </div>
      `;
    }
    else if (fileType === 'video') {
      container.innerHTML = `
        <div class="attachment-video" data-file-url="${attachment.fileUrl}" data-file-name="${attachment.fileName}">
          <video src="${attachment.fileUrl}" preload="metadata"></video>
          <div class="play-icon">
            <i class="fas fa-play"></i>
          </div>
        </div>
      `;
    }
    else {
      // Format file size
      const fileSize = this.formatFileSize(attachment.fileSize);

      // Get icon class based on file type
      const iconClass = this.getFileIconClass(fileType);

      container.innerHTML = `
        <div class="attachment-file" data-file-url="${attachment.fileUrl}" data-file-name="${attachment.fileName}">
          <div class="attachment-file-icon ${fileType}">
            <i class="${iconClass}"></i>
          </div>
          <div class="attachment-file-info">
            <div class="attachment-file-name">${attachment.fileName}</div>
            <div class="attachment-file-meta">
              <span class="attachment-file-type">${fileExtension.toUpperCase()}</span>
              <span class="attachment-file-size">${fileSize}</span>
            </div>
          </div>
          <button class="attachment-download-btn" title="Download">
            <i class="fas fa-download"></i>
          </button>
        </div>
      `;
    }

    return container;
  }

  /**
   * Get file extension from filename
   * @param {string} fileName - The file name
   * @returns {string} - The file extension
   */
  getFileExtension(fileName) {
    if (!fileName) return '';

    const parts = fileName.split('.');
    if (parts.length === 1) return '';

    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Get file type category based on extension
   * @param {string} extension - The file extension
   * @returns {string} - The file type category
   */
  getFileType(extension) {
    if (!extension) return 'generic';

    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const docTypes = ['doc', 'docx', 'rtf', 'txt', 'odt', 'pages'];
    const pdfTypes = ['pdf'];
    const spreadsheetTypes = ['xls', 'xlsx', 'csv', 'ods', 'numbers'];
    const archiveTypes = ['zip', 'rar', 'tar', 'gz', '7z'];
    const codeTypes = ['js', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'json', 'xml'];

    if (imageTypes.includes(extension)) return 'image';
    if (videoTypes.includes(extension)) return 'video';
    if (docTypes.includes(extension)) return 'doc';
    if (pdfTypes.includes(extension)) return 'pdf';
    if (spreadsheetTypes.includes(extension)) return 'excel';
    if (archiveTypes.includes(extension)) return 'archive';
    if (codeTypes.includes(extension)) return 'code';

    return 'generic';
  }

  /**
   * Get FontAwesome icon class for file type
   * @param {string} fileType - The file type
   * @returns {string} - The icon class
   */
  getFileIconClass(fileType) {
    switch (fileType) {
      case 'pdf': return 'fas fa-file-pdf';
      case 'doc': return 'fas fa-file-word';
      case 'excel': return 'fas fa-file-excel';
      case 'archive': return 'fas fa-file-archive';
      case 'code': return 'fas fa-file-code';
      case 'image': return 'fas fa-file-image';
      case 'video': return 'fas fa-file-video';
      default: return 'fas fa-file';
    }
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - The file size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === undefined || bytes === null) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = parseInt(bytes, 10) || 0;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Enhance the createMessageElement function with attachment preview
   * @param {Function} originalCreateMessageElement - The original function
   * @returns {Function} - Enhanced function with attachment preview
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Check if message has an attachment
      if (message.fileUrl || (message.attachment && message.attachment.fileUrl)) {
        const attachment = message.attachment || {
          fileUrl: message.fileUrl,
          fileName: message.fileName || 'attachment',
          fileSize: message.fileSize,
          fileType: message.fileType
        };

        // Create attachment element
        const attachmentElement = this.createAttachmentElement(attachment);

        if (attachmentElement) {
          // Add attachment to message content
          const contentEl = messageElement.querySelector('.message-content');
          if (contentEl) {
            contentEl.appendChild(attachmentElement);
          }
        }
      }

      return messageElement;
    };
  }
}
