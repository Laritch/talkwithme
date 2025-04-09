const mongoose = require('mongoose');

// Whiteboard Schema
const whiteboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  width: {
    type: Number,
    default: 1280
  },
  height: {
    type: Number,
    default: 720
  },
  background: {
    type: String,
    default: '#ffffff'
  },
  canvasData: {
    type: String,
    default: '{"objects":[],"background":"#ffffff"}'
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  presentationMode: {
    type: Boolean,
    default: false
  },
  editors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    canEdit: {
      type: Boolean,
      default: false
    }
  }],
  history: [{
    action: {
      type: String,
      enum: ['add', 'modify', 'remove', 'clear']
    },
    objectId: String,
    objectData: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Enhanced recording schema with multiple recordings support
  recordings: [{
    title: {
      type: String,
      default: 'Untitled Recording'
    },
    isRecording: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    stoppedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // New fields for sharing
    isShared: {
      type: Boolean,
      default: false
    },
    password: String,
    expiresAt: Date,
    lastSharedAt: Date,
    lastSharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // New fields for categories and tags
    category: {
      type: String,
      enum: ['presentation', 'brainstorming', 'tutorial', 'meeting', 'other'],
      default: 'other'
    },
    tags: [String],
    // New fields for annotations
    annotations: [{
      timestamp: {
        type: Number, // Milliseconds from start
        required: true
      },
      text: {
        type: String,
        required: true
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // New field for export status
    exports: [{
      format: {
        type: String,
        enum: ['json', 'video', 'png-sequence'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      url: String,
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date,
      error: String
    }],
    // Recording frames
    frames: [{
      timestamp: {
        type: Date,
        required: true
      },
      canvasData: {
        type: String,
        required: true
      },
      action: {
        type: String,
        enum: ['add', 'modify', 'remove', 'clear', 'full'],
        required: true
      },
      objectId: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }]
});

// Webinar Schema
const webinarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledStart: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  actualStart: Date,
  actualEnd: Date,
  presenters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  }],
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    joinedAt: Date,
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  whiteboards: [whiteboardSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Get a whiteboard by ID
 * @param {String} whiteboardId - Whiteboard ID
 * @returns {Object} - Whiteboard document
 */
webinarSchema.methods.getWhiteboard = function(whiteboardId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }
  return whiteboard;
};

/**
 * Create a whiteboard
 * @param {Object} whiteboardData - Whiteboard data
 * @returns {Object} - Created whiteboard
 */
webinarSchema.methods.createWhiteboard = async function(whiteboardData) {
  this.whiteboards.push(whiteboardData);
  await this.save();
  return this.whiteboards[this.whiteboards.length - 1];
};

/**
 * Toggle presentation mode for a whiteboard
 * @param {String} whiteboardId - Whiteboard ID
 * @param {Boolean} enableMode - Whether to enable presentation mode
 * @param {String} userId - User ID making the request
 * @returns {Object} - Updated whiteboard
 */
webinarSchema.methods.togglePresentationMode = async function(whiteboardId, enableMode, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Only host or presenter can toggle presentation mode
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can toggle presentation mode');
  }

  whiteboard.presentationMode = enableMode;
  whiteboard.lastModified = new Date();

  await this.save();
  return whiteboard;
};

/**
 * Check if user has edit permission for a whiteboard
 * @param {Object} whiteboard - Whiteboard object
 * @param {String} userId - User ID
 * @returns {Boolean} - Whether user has edit permission
 * @throws {Error} - If user doesn't have permission
 */
webinarSchema.methods.checkWhiteboardEditPermission = function(whiteboard, userId) {
  // If whiteboard is in presentation mode, only host or presenters can edit
  if (whiteboard.presentationMode) {
    const isHostOrPresenter = this.host.equals(userId) ||
      this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

    if (!isHostOrPresenter) {
      throw new Error('Whiteboard is in presentation mode. Only hosts and presenters can edit.');
    }

    return true;
  }

  // Normal permission check
  const isEditor = whiteboard.editors.some(
    editor => editor.user && editor.user.toString() === userId && editor.canEdit
  );

  const isCreator = whiteboard.createdBy && whiteboard.createdBy.toString() === userId;

  if (!isEditor && !isCreator) {
    throw new Error('Not authorized to edit this whiteboard');
  }

  return true;
};

/**
 * Start recording a whiteboard session
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} userId - User ID starting the recording
 * @returns {Object} - Created recording
 */
webinarSchema.methods.startWhiteboardRecording = async function(whiteboardId, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Check if user is host or presenter
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can start recording');
  }

  // Check if there's already an active recording
  const activeRecording = whiteboard.recordings && whiteboard.recordings.find(rec => rec.isRecording);
  if (activeRecording) {
    throw new Error('A recording is already in progress');
  }

  // Create new recording
  const newRecording = {
    title: `Recording ${whiteboard.recordings ? whiteboard.recordings.length + 1 : 1}`,
    isRecording: true,
    startedAt: new Date(),
    createdBy: userId,
    frames: []
  };

  // Add initial frame with full canvas data
  newRecording.frames.push({
    timestamp: new Date(),
    canvasData: whiteboard.canvasData,
    action: 'full',
    userId: userId
  });

  // Add to recordings array
  if (!whiteboard.recordings) {
    whiteboard.recordings = [];
  }
  whiteboard.recordings.push(newRecording);

  await this.save();
  return whiteboard.recordings[whiteboard.recordings.length - 1];
};

/**
 * Stop recording a whiteboard session
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} userId - User ID stopping the recording
 * @returns {Object} - Updated recording
 */
webinarSchema.methods.stopWhiteboardRecording = async function(whiteboardId, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Check if user is host or presenter
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can stop recording');
  }

  // Find active recording
  const recordingIndex = whiteboard.recordings.findIndex(rec => rec.isRecording);
  if (recordingIndex === -1) {
    throw new Error('No active recording found');
  }

  // Update recording state
  whiteboard.recordings[recordingIndex].isRecording = false;
  whiteboard.recordings[recordingIndex].stoppedAt = new Date();

  await this.save();
  return whiteboard.recordings[recordingIndex];
};

/**
 * Add frame to whiteboard recording
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} recordingId - Recording ID
 * @param {Object} frameData - Frame data to add
 * @returns {Object} - Updated recording
 */
webinarSchema.methods.addWhiteboardRecordingFrame = async function(whiteboardId, recordingId, frameData) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Find recording
  const recording = whiteboard.recordings.id(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  // Check if recording is active
  if (!recording.isRecording) {
    return recording; // Silently ignore if not recording
  }

  // Add frame
  recording.frames.push({
    timestamp: new Date(),
    canvasData: frameData.canvasData || whiteboard.canvasData,
    action: frameData.action,
    objectId: frameData.objectId,
    userId: frameData.userId
  });

  // Limit frames to prevent excessive storage use (optional)
  if (recording.frames.length > 10000) {
    recording.frames = recording.frames.slice(-10000);
  }

  await this.save();
  return recording;
};

/**
 * Add annotation to a recording
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} recordingId - Recording ID
 * @param {Object} annotationData - Annotation data
 * @returns {Object} - Updated recording
 */
webinarSchema.methods.addRecordingAnnotation = async function(whiteboardId, recordingId, annotationData) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Find recording
  const recording = whiteboard.recordings.id(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  // Add annotation
  if (!recording.annotations) {
    recording.annotations = [];
  }

  recording.annotations.push({
    timestamp: annotationData.timestamp, // milliseconds from start of recording
    text: annotationData.text,
    author: annotationData.author,
    createdAt: new Date()
  });

  await this.save();
  return recording;
};

/**
 * Update recording metadata (tags, category, etc.)
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} recordingId - Recording ID
 * @param {Object} metadataUpdate - Metadata to update
 * @returns {Object} - Updated recording
 */
webinarSchema.methods.updateRecordingMetadata = async function(whiteboardId, recordingId, metadataUpdate) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Find recording
  const recording = whiteboard.recordings.id(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  // Update metadata
  if (metadataUpdate.title) recording.title = metadataUpdate.title;
  if (metadataUpdate.category) recording.category = metadataUpdate.category;
  if (metadataUpdate.tags) recording.tags = metadataUpdate.tags;

  await this.save();
  return recording;
};

/**
 * Request a recording export in specified format
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} recordingId - Recording ID
 * @param {String} format - Export format ('json', 'video', 'png-sequence')
 * @param {String} userId - User ID requesting the export
 * @returns {Object} - Export request
 */
webinarSchema.methods.requestRecordingExport = async function(whiteboardId, recordingId, format, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Find recording
  const recording = whiteboard.recordings.id(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  // Check if recording is complete
  if (recording.isRecording) {
    throw new Error('Cannot export an in-progress recording');
  }

  // Initialize exports array if not exists
  if (!recording.exports) {
    recording.exports = [];
  }

  // Create export request
  const exportRequest = {
    format,
    status: 'pending',
    requestedBy: userId,
    requestedAt: new Date()
  };

  recording.exports.push(exportRequest);

  await this.save();
  return recording.exports[recording.exports.length - 1];
};

/**
 * Update export status
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} recordingId - Recording ID
 * @param {String} exportId - Export ID
 * @param {Object} updateData - Data to update (status, url, error)
 * @returns {Object} - Updated export
 */
webinarSchema.methods.updateExportStatus = async function(whiteboardId, recordingId, exportId, updateData) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Find recording
  const recording = whiteboard.recordings.id(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  // Find export request
  const exportIndex = recording.exports.findIndex(exp => exp._id.toString() === exportId);
  if (exportIndex === -1) {
    throw new Error('Export request not found');
  }

  // Update export request
  if (updateData.status) recording.exports[exportIndex].status = updateData.status;
  if (updateData.url) recording.exports[exportIndex].url = updateData.url;
  if (updateData.error) recording.exports[exportIndex].error = updateData.error;
  if (updateData.status === 'completed') recording.exports[exportIndex].completedAt = new Date();

  await this.save();
  return recording.exports[exportIndex];
};

const Webinar = mongoose.model('Webinar', webinarSchema);

module.exports = Webinar;
