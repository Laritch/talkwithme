// Add after other routes

// Whiteboard routes
const upload = require('../middleware/uploadMiddleware');
router.post('/:webinarId/whiteboards/:whiteboardId/images', auth, upload.single('image'), webinarController.uploadWhiteboardImage);
router.post('/:webinarId/whiteboards', auth, webinarController.createWhiteboard);
router.get('/:webinarId/whiteboards', auth, webinarController.getWhiteboards);
router.get('/:webinarId/whiteboards/:whiteboardId', auth, webinarController.getWhiteboard);
router.put('/:webinarId/whiteboards/:whiteboardId', auth, webinarController.updateWhiteboard);
router.post('/:webinarId/whiteboards/:whiteboardId/objects', auth, webinarController.addWhiteboardObject);
router.put('/:webinarId/whiteboards/:whiteboardId/objects/:objectId', auth, webinarController.modifyWhiteboardObject);
router.delete('/:webinarId/whiteboards/:whiteboardId/objects/:objectId', auth, webinarController.removeWhiteboardObject);
router.delete('/:webinarId/whiteboards/:whiteboardId/clear', auth, webinarController.clearWhiteboard);
router.put('/:webinarId/whiteboards/:whiteboardId/presentation-mode', auth, webinarController.togglePresentationMode);

// Whiteboard recording routes
router.get('/:webinarId/whiteboards/:whiteboardId/recordings', auth, webinarController.getRecordings);
router.get('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId', auth, webinarController.getRecording);
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/start', auth, webinarController.startRecording);
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/stop', auth, webinarController.stopRecording);
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/frame', auth, webinarController.addRecordingFrame);
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/share', auth, webinarController.shareRecording);
router.get('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/export', auth, webinarController.exportRecording);
router.delete('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId', auth, webinarController.deleteRecording);

// Add new routes for enhanced recording features
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/request-export', auth, webinarController.requestRecordingExport);
router.get('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/exports', auth, webinarController.getRecordingExports);
router.post('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/annotations', auth, webinarController.addRecordingAnnotation);
router.get('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/annotations', auth, webinarController.getRecordingAnnotations);
router.put('/:webinarId/whiteboards/:whiteboardId/recordings/:recordingId/metadata', auth, webinarController.updateRecordingMetadata);
router.get('/:webinarId/recordings/search', auth, webinarController.searchRecordings);
