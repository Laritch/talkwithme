/**
 * WhiteboardRecordingManager
 * Manages the recording of whiteboard sessions
 */
class WhiteboardRecordingManager {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.socket = options.socket;
    this.isHost = options.isHost || false;
    this.isPresenter = options.isPresenter || false;
    this.userId = options.userId;

    this.recording = false;
    this.currentRecordingId = null;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.recordings = [];

    // Initialize supporting systems
    this.exporter = null;
    this.annotationManager = null;
    this.metadataManager = null;

    this.initialize();
  }

  /**
   * Initialize the recording manager
   */
  initialize() {
    this.createControls();
    this.setupEventListeners();
    this.setupSocketListeners();
    this.loadRecordings();

    // Initialize supporting systems
    this.initializeExporter();
    this.initializeAnnotationManager();
    this.initializeMetadataManager();
  }

  /**
   * Initialize exporter for recording exports
   */
  initializeExporter() {
    this.exporter = new WhiteboardRecordingExporter({
      whiteboardManager: this.whiteboardManager,
      webinarId: this.webinarId,
      socket: this.socket,
      isHost: this.isHost,
      isPresenter: this.isPresenter
    });
  }

  /**
   * Initialize annotation manager
   */
  initializeAnnotationManager() {
    this.annotationManager = new WhiteboardRecordingAnnotations({
      whiteboardManager: this.whiteboardManager,
      webinarId: this.webinarId,
      userId: this.userId,
      socket: this.socket
    });

    // Make available globally for onclick events
    window.whiteboardAnnotationManager = this.annotationManager;
  }

  /**
   * Initialize metadata manager
   */
  initializeMetadataManager() {
    this.metadataManager = new WhiteboardRecordingMetadata({
      whiteboardManager: this.whiteboardManager,
      webinarId: this.webinarId,
      socket: this.socket,
      isHost: this.isHost,
      isPresenter: this.isPresenter
    });
  }

  /**
   * Play a recording
   * @param {String} recordingId - ID of recording to play
   */
  playRecording(recordingId) {
    if (!recordingId) return;

    // Fetch recording data
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${this.whiteboardManager.currentWhiteboardId}/recordings/${recordingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.recording) {
        // Create player if it doesn't exist
        if (!this.player) {
          this.player = new WhiteboardRecordingPlayer({
            whiteboardManager: this.whiteboardManager,
            onPlaybackStart: this.onPlaybackStart.bind(this),
            onPlaybackStop: this.onPlaybackStop.bind(this),
            onPlaybackUpdate: this.onPlaybackUpdate.bind(this)
          });
        }

        // Set up the playback detail view
        this.showPlaybackDetailView(data.recording, recordingId);

        // Start playback
        this.player.loadRecording(data.recording);
        this.player.startPlayback();

        // Show playback controls
        document.getElementById('playback-controls').style.display = 'flex';

        // Connect annotation manager to player
        this.annotationManager.setPlayer(
          this.player,
          this.whiteboardManager.currentWhiteboardId,
          recordingId
        );
      } else {
        this.showNotification('Failed to load recording', data.message || 'Unknown error', 'error');
      }
    })
    .catch(error => {
      console.error('Error loading recording:', error);
      this.showNotification('Failed to load recording', 'Please try again.', 'error');
    });
  }

  /**
   * Show detailed playback view with annotations, exports and metadata
   * @param {Object} recording - Recording data
   * @param {String} recordingId - Recording ID
   */
  showPlaybackDetailView(recording, recordingId) {
    // Create or get detail view container
    let detailContainer = document.getElementById('recording-detail-container');
    if (!detailContainer) {
      detailContainer = document.createElement('div');
      detailContainer.id = 'recording-detail-container';
      detailContainer.className = 'recording-detail-container';

      // Add after recordings list
      const recordingsList = document.querySelector('.whiteboard-recordings-list');
      if (recordingsList && recordingsList.parentNode) {
        recordingsList.parentNode.insertBefore(detailContainer, recordingsList.nextSibling);
      } else {
        // Fallback to add to whiteboard container
        document.getElementById('whiteboard-container').appendChild(detailContainer);
      }
    }

    // Clear any previous content
    detailContainer.innerHTML = '';

    // Create tabs for different sections
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'recording-detail-tabs';
    tabsContainer.innerHTML = `
      <button class="recording-tab active" data-tab="info">Info</button>
      <button class="recording-tab" data-tab="annotations">Annotations</button>
      <button class="recording-tab" data-tab="export">Export</button>
    `;

    // Create content sections
    const contentContainer = document.createElement('div');
    contentContainer.className = 'recording-detail-content';

    // Info section (metadata)
    const infoSection = document.createElement('div');
    infoSection.className = 'recording-detail-section active';
    infoSection.dataset.section = 'info';

    // Annotations section
    const annotationsSection = document.createElement('div');
    annotationsSection.className = 'recording-detail-section';
    annotationsSection.dataset.section = 'annotations';

    // Export section
    const exportSection = document.createElement('div');
    exportSection.className = 'recording-detail-section';
    exportSection.dataset.section = 'export';

    // Add sections to content container
    contentContainer.appendChild(infoSection);
    contentContainer.appendChild(annotationsSection);
    contentContainer.appendChild(exportSection);

    // Add tab and content containers to detail container
    detailContainer.appendChild(tabsContainer);
    detailContainer.appendChild(contentContainer);

    // Set up tab switching
    tabsContainer.querySelectorAll('.recording-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Deactivate all tabs and sections
        tabsContainer.querySelectorAll('.recording-tab').forEach(t => t.classList.remove('active'));
        contentContainer.querySelectorAll('.recording-detail-section').forEach(s => s.classList.remove('active'));

        // Activate clicked tab and corresponding section
        tab.classList.add('active');
        const section = contentContainer.querySelector(`.recording-detail-section[data-section="${tab.dataset.tab}"]`);
        if (section) {
          section.classList.add('active');
        }
      });
    });

    // Initialize content for each section

    // 1. Info/Metadata section
    this.metadataManager.createMetadataUI(infoSection, recording, this.whiteboardManager.currentWhiteboardId);

    // 2. Annotations section
    this.annotationManager.createAnnotationsUI(annotationsSection);

    // 3. Export section
    this.exporter.createExportsUI(exportSection, this.whiteboardManager.currentWhiteboardId, recordingId);

    // Show detail container
    detailContainer.style.display = 'block';
  }

  /**
   * Show notification toast
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {String} type - Notification type (success, error, info, warning)
   */
  showNotification(title, message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
      <div style="font-weight: bold;">${title}</div>
      <div>${message}</div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Show notification (after a small delay to allow CSS transition)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after timeout
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // ... other existing methods ...
}

/**
 * WhiteboardRecordingPlayer
 * Handles playback of whiteboard recording
 */
class WhiteboardRecordingPlayer {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.onPlaybackStart = options.onPlaybackStart || (() => {});
    this.onPlaybackStop = options.onPlaybackStop || (() => {});
    this.onPlaybackUpdate = options.onPlaybackUpdate || (() => {});

    this.recording = null;
    this.frames = [];
    this.currentFrameIndex = 0;
    this.playing = false;
    this.playbackStartTime = 0;
    this.playbackTimer = null;
    this.playbackSpeed = 1.0;
    this.duration = 0;

    // Save original canvas state for restoring after playback
    this.originalCanvasData = null;
  }

  /**
   * Load a recording for playback
   * @param {Object} recording - Recording data
   */
  loadRecording(recording) {
    this.recording = recording;
    this.frames = recording.frames || [];
    this.currentFrameIndex = 0;
    this.duration = recording.stoppedAt
      ? new Date(recording.stoppedAt) - new Date(recording.startedAt)
      : this.frames.length > 0
        ? new Date(this.frames[this.frames.length - 1].timestamp) - new Date(this.frames[0].timestamp)
        : 0;

    // Save current canvas state
    if (this.whiteboardManager.canvas) {
      this.originalCanvasData = this.whiteboardManager.canvas.toJSON(['id']);
    }

    console.log(`Loaded recording with ${this.frames.length} frames, duration: ${this.duration}ms`);
  }

  /**
   * Start playback
   */
  startPlayback() {
    if (!this.recording || this.frames.length === 0) {
      console.error('No recording loaded');
      return;
    }

    if (this.playing) return;

    // Reset canvas
    this.whiteboardManager.canvas.clear();

    // Start from first frame which has full canvas data
    const firstFrame = this.frames.find(frame => frame.action === 'full');
    if (firstFrame && firstFrame.canvasData) {
      this.whiteboardManager.canvas.loadFromJSON(firstFrame.canvasData, () => {
        this.whiteboardManager.canvas.renderAll();
      });
    }

    this.playing = true;
    this.playbackStartTime = Date.now();
    this.currentFrameIndex = 0;

    // Notify callback
    this.onPlaybackStart(this.duration);

    // Start playback timer
    this.startPlaybackTimer();
  }

  /**
   * Stop playback
   */
  stopPlayback() {
    if (!this.playing) return;

    this.playing = false;

    // Stop timer
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Restore original canvas state if available
    if (this.originalCanvasData) {
      this.whiteboardManager.canvas.loadFromJSON(this.originalCanvasData, () => {
        this.whiteboardManager.canvas.renderAll();
      });
    }

    // Notify callback
    this.onPlaybackStop();
  }

  /**
   * Toggle playback (play/pause)
   */
  togglePlayback() {
    if (this.playing) {
      this.pausePlayback();
    } else {
      this.resumePlayback();
    }
  }

  /**
   * Pause playback
   */
  pausePlayback() {
    if (!this.playing) return;

    this.playing = false;

    // Stop timer
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Update button
    const playButton = document.getElementById('playback-play');
    if (playButton) {
      playButton.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  /**
   * Resume playback
   */
  resumePlayback() {
    if (this.playing) return;

    this.playing = true;

    // Adjust start time to maintain position
    const currentPosition = parseFloat(document.getElementById('playback-progress').value);
    this.playbackStartTime = Date.now() - (currentPosition / this.playbackSpeed);

    // Start timer
    this.startPlaybackTimer();

    // Update button
    const playButton = document.getElementById('playback-play');
    if (playButton) {
      playButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
  }

  /**
   * Start the playback timer
   */
  startPlaybackTimer() {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
    }

    // Use requestAnimationFrame for smoother playback
    const animate = () => {
      if (!this.playing) return;

      // Calculate elapsed time with playback speed
      const elapsed = (Date.now() - this.playbackStartTime) * this.playbackSpeed;

      // Update frames up to current time
      this.updateFramesToTime(elapsed);

      // Update progress
      this.onPlaybackUpdate(Math.min(elapsed, this.duration), this.duration);

      // Stop if we've reached the end
      if (elapsed >= this.duration) {
        this.stopPlayback();
        return;
      }

      // Continue animation
      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Update frames to match a specific time
   * @param {Number} targetTime - Target time in ms
   */
  updateFramesToTime(targetTime) {
    if (!this.frames.length) return;

    // Find frames that should be played up to target time
    const startTime = new Date(this.frames[0].timestamp).getTime();

    while (this.currentFrameIndex < this.frames.length) {
      const frame = this.frames[this.currentFrameIndex];
      const frameTime = new Date(frame.timestamp).getTime() - startTime;

      // If frame is beyond current time, stop
      if (frameTime > targetTime) break;

      // Apply frame
      this.applyFrame(frame);

      // Move to next frame
      this.currentFrameIndex++;
    }
  }

  /**
   * Apply a frame to the canvas
   * @param {Object} frame - Frame data
   */
  applyFrame(frame) {
    if (!frame || !this.whiteboardManager.canvas) return;

    // Handle different frame actions
    switch (frame.action) {
      case 'full':
        // Full canvas update
        if (frame.canvasData) {
          this.whiteboardManager.canvas.loadFromJSON(frame.canvasData, () => {
            this.whiteboardManager.canvas.renderAll();
          });
        }
        break;

      case 'add':
        // Add object
        if (frame.objectData) {
          fabric.util.enlivenObjects([frame.objectData], (objects) => {
            if (objects.length > 0) {
              this.whiteboardManager.canvas.add(objects[0]);
              this.whiteboardManager.canvas.renderAll();
            }
          });
        }
        break;

      case 'modify':
        // Modify object
        if (frame.objectId && frame.objectData) {
          const object = this.findObjectById(frame.objectId);
          if (object) {
            object.set(frame.objectData);
            object.setCoords();
            this.whiteboardManager.canvas.renderAll();
          }
        }
        break;

      case 'remove':
        // Remove object
        if (frame.objectId) {
          const object = this.findObjectById(frame.objectId);
          if (object) {
            this.whiteboardManager.canvas.remove(object);
            this.whiteboardManager.canvas.renderAll();
          }
        }
        break;

      case 'clear':
        // Clear canvas
        this.whiteboardManager.canvas.clear();
        break;
    }
  }

  /**
   * Find an object on the canvas by ID
   * @param {String} objectId - Object ID to find
   * @returns {Object} - Found object or null
   */
  findObjectById(objectId) {
    if (!this.whiteboardManager.canvas) return null;

    return this.whiteboardManager.canvas.getObjects().find(obj => obj.id === objectId);
  }

  /**
   * Seek to a specific position in the recording
   * @param {Number} position - Position in ms
   */
  seekTo(position) {
    if (!this.recording || !this.frames.length) return;

    // Clamp position to valid range
    const clampedPosition = Math.max(0, Math.min(position, this.duration));

    // Reset playback
    this.currentFrameIndex = 0;

    // Reset canvas
    this.whiteboardManager.canvas.clear();

    // Apply first frame with full canvas data
    const firstFrame = this.frames.find(frame => frame.action === 'full');
    if (firstFrame && firstFrame.canvasData) {
      this.whiteboardManager.canvas.loadFromJSON(firstFrame.canvasData, () => {
        this.whiteboardManager.canvas.renderAll();
      });
    }

    // Update frames to position
    this.updateFramesToTime(clampedPosition);

    // If playing, adjust start time to maintain position
    if (this.playing) {
      this.playbackStartTime = Date.now() - (clampedPosition / this.playbackSpeed);
    }

    // Update progress
    this.onPlaybackUpdate(clampedPosition, this.duration);
  }

  /**
   * Set playback speed
   * @param {Number} speed - Playback speed multiplier
   */
  setPlaybackSpeed(speed) {
    if (speed <= 0) return;

    const currentPosition = this.playing
      ? (Date.now() - this.playbackStartTime) * this.playbackSpeed
      : parseFloat(document.getElementById('playback-progress').value);

    this.playbackSpeed = speed;

    // Adjust start time to maintain position with new speed
    if (this.playing) {
      this.playbackStartTime = Date.now() - (currentPosition / this.playbackSpeed);
    }
  }
}
