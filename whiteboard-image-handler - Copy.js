/**
 * Handles image operations for the whiteboard
 */
class WhiteboardImageHandler {
  constructor(whiteboardManager) {
    this.whiteboardManager = whiteboardManager;
    this.initialize();
  }

  /**
   * Initialize the image handler
   */
  initialize() {
    this.createFileInput();
    this.setupEventListeners();
  }

  /**
   * Create the file input element
   */
  createFileInput() {
    // Create new file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'whiteboard-image-upload';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    document.body.appendChild(fileInput);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add event listener for file input change
    document.getElementById('whiteboard-image-upload')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.uploadImage(e.target.files[0]);
      }
    });
  }

  /**
   * Upload image to server
   * @param {File} file - Image file to upload
   */
  uploadImage(file) {
    if (!this.whiteboardManager.currentWhiteboardId) {
      alert('Please select a whiteboard first');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    // Upload image to server
    fetch(`/api/webinars/${this.whiteboardManager.webinarId}/whiteboards/${this.whiteboardManager.currentWhiteboardId}/images`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(data => console.log('Image uploaded:', data))
    .catch(error => console.error('Error uploading image:', error));
  }
}
