// Add after other controller methods

/**
 * Request export of a recording
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.requestRecordingExport = async (req, res) => {
  try {
    const { webinarId, whiteboardId, recordingId } = req.params;
    const { format } = req.body;

    // Validate format
    if (!['json', 'video', 'png-sequence'].includes(format)) {
      return res.status(400).json({ message: 'Invalid export format. Valid formats are: json, video, png-sequence' });
    }

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Get whiteboard
    let whiteboard;
    try {
      whiteboard = webinar.getWhiteboard(whiteboardId);
    } catch (error) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }

    // Request export
    let exportRequest;
    try {
      exportRequest = await webinar.requestRecordingExport(whiteboardId, recordingId, format, req.user._id);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Trigger background export process
    // This will be handled by a separate process in a real implementation
    // For now, we'll just simulate the export process with a timeout
    setTimeout(async () => {
      try {
        // Simulate processing
        await webinar.updateExportStatus(whiteboardId, recordingId, exportRequest._id, {
          status: 'processing'
        });

        // After a delay, mark as complete
        setTimeout(async () => {
          try {
            let exportUrl = '';

            // Generate appropriate URL based on format
            switch (format) {
              case 'json':
                exportUrl = `/api/webinars/${webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/download?format=json`;
                break;
              case 'video':
                exportUrl = `/api/webinars/${webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/download?format=mp4`;
                break;
              case 'png-sequence':
                exportUrl = `/api/webinars/${webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/download?format=zip`;
                break;
            }

            // Update export status
            await webinar.updateExportStatus(whiteboardId, recordingId, exportRequest._id, {
              status: 'completed',
              url: exportUrl
            });

            // Notify user
            req.io.to(`user:${req.user._id}`).emit('recording:export:completed', {
              webinarId,
              whiteboardId,
              recordingId,
              exportId: exportRequest._id,
              format,
              url: exportUrl
            });
          } catch (error) {
            console.error('Error completing export:', error);
          }
        }, 10000); // Complete after 10 seconds (just for demonstration)
      } catch (error) {
        console.error('Error processing export:', error);
      }
    }, 2000); // Start processing after 2 seconds

    return res.status(200).json({
      success: true,
      message: 'Export requested successfully',
      exportId: exportRequest._id
    });
  } catch (error) {
    console.error('Error requesting export:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Get recording exports
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getRecordingExports = async (req, res) => {
  try {
    const { webinarId, whiteboardId, recordingId } = req.params;

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Get whiteboard
    let whiteboard;
    try {
      whiteboard = webinar.getWhiteboard(whiteboardId);
    } catch (error) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }

    // Find recording
    const recording = whiteboard.recordings.id(recordingId);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check for exports
    const exports = recording.exports || [];

    return res.status(200).json({
      exports
    });
  } catch (error) {
    console.error('Error getting exports:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Add annotation to recording
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.addRecordingAnnotation = async (req, res) => {
  try {
    const { webinarId, whiteboardId, recordingId } = req.params;
    const { timestamp, text } = req.body;

    if (!timestamp || !text) {
      return res.status(400).json({ message: 'Timestamp and text are required' });
    }

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Get whiteboard
    let whiteboard;
    try {
      whiteboard = webinar.getWhiteboard(whiteboardId);
    } catch (error) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }

    // Add annotation
    let recording;
    try {
      recording = await webinar.addRecordingAnnotation(whiteboardId, recordingId, {
        timestamp,
        text,
        author: req.user._id
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Emit to all webinar participants
    req.io.to(`webinar:${webinarId}`).emit('recording:annotation:added', {
      webinarId,
      whiteboardId,
      recordingId,
      annotation: recording.annotations[recording.annotations.length - 1]
    });

    return res.status(200).json({
      success: true,
      message: 'Annotation added successfully',
      annotation: recording.annotations[recording.annotations.length - 1]
    });
  } catch (error) {
    console.error('Error adding annotation:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Get recording annotations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getRecordingAnnotations = async (req, res) => {
  try {
    const { webinarId, whiteboardId, recordingId } = req.params;

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Get whiteboard
    let whiteboard;
    try {
      whiteboard = webinar.getWhiteboard(whiteboardId);
    } catch (error) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }

    // Find recording
    const recording = whiteboard.recordings.id(recordingId);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Get annotations
    const annotations = recording.annotations || [];

    return res.status(200).json({
      annotations
    });
  } catch (error) {
    console.error('Error getting annotations:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Update recording metadata (title, category, tags)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateRecordingMetadata = async (req, res) => {
  try {
    const { webinarId, whiteboardId, recordingId } = req.params;
    const { title, category, tags } = req.body;

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Get whiteboard
    let whiteboard;
    try {
      whiteboard = webinar.getWhiteboard(whiteboardId);
    } catch (error) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }

    // Find recording
    const recording = whiteboard.recordings.id(recordingId);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user is authorized to update
    const isOwnerOrHostOrPresenter =
      recording.createdBy.equals(req.user._id) ||
      webinar.host.equals(req.user._id) ||
      webinar.presenters.some(presenter => presenter.user.equals(req.user._id));

    if (!isOwnerOrHostOrPresenter) {
      return res.status(403).json({ message: 'Not authorized to update this recording' });
    }

    // Update metadata
    const metadataUpdate = {};
    if (title) metadataUpdate.title = title;
    if (category) metadataUpdate.category = category;
    if (tags) metadataUpdate.tags = tags;

    const updatedRecording = await webinar.updateRecordingMetadata(whiteboardId, recordingId, metadataUpdate);

    // Emit to all webinar participants
    req.io.to(`webinar:${webinarId}`).emit('recording:metadata:updated', {
      webinarId,
      whiteboardId,
      recordingId,
      metadata: {
        title: updatedRecording.title,
        category: updatedRecording.category,
        tags: updatedRecording.tags
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Recording metadata updated successfully',
      recording: {
        _id: updatedRecording._id,
        title: updatedRecording.title,
        category: updatedRecording.category,
        tags: updatedRecording.tags
      }
    });
  } catch (error) {
    console.error('Error updating recording metadata:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Search recordings by tags or category
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.searchRecordings = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const { tag, category, query } = req.query;

    // Find webinar
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }

    // Check if user is participant
    const isParticipant = webinar.host.equals(req.user._id) ||
      webinar.presenters.some(presenter => presenter.user.equals(req.user._id)) ||
      webinar.attendees.some(attendee => attendee.user.equals(req.user._id));

    if (!isParticipant) {
      return res.status(403).json({ message: 'Only webinar participants can search recordings' });
    }

    // Collect all recordings from all whiteboards
    let allRecordings = [];
    webinar.whiteboards.forEach(whiteboard => {
      if (whiteboard.recordings && whiteboard.recordings.length > 0) {
        // Add whiteboard ID to each recording for reference
        const recordingsWithWhiteboardId = whiteboard.recordings.map(recording => {
          const rec = recording.toObject();
          rec.whiteboardId = whiteboard._id;
          rec.whiteboardName = whiteboard.name;
          return rec;
        });
        allRecordings = allRecordings.concat(recordingsWithWhiteboardId);
      }
    });

    // Filter by search criteria
    let filteredRecordings = [...allRecordings];

    if (tag) {
      filteredRecordings = filteredRecordings.filter(recording =>
        recording.tags && recording.tags.includes(tag)
      );
    }

    if (category) {
      filteredRecordings = filteredRecordings.filter(recording =>
        recording.category === category
      );
    }

    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      filteredRecordings = filteredRecordings.filter(recording => {
        const title = recording.title ? recording.title.toLowerCase() : '';
        return searchTerms.some(term => title.includes(term));
      });
    }

    // Sort by date (newest first)
    filteredRecordings.sort((a, b) =>
      new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
    );

    // Exclude frame data to reduce response size
    const recordingsWithoutFrames = filteredRecordings.map(recording => {
      const { frames, ...recordingWithoutFrames } = recording;
      return {
        ...recordingWithoutFrames,
        frameCount: frames ? frames.length : 0
      };
    });

    return res.status(200).json({
      recordings: recordingsWithoutFrames
    });
  } catch (error) {
    console.error('Error searching recordings:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
