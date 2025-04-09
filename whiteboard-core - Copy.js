// Add after other methods in the WhiteboardManager class

  /**
   * Add an image to the canvas
   * @param {String} url - Image URL
   * @param {Object} options - Image placement options
   */
  addImage(url, options = {}) {
    if (!this.canvas) return;

    fabric.Image.fromURL(url, (img) => {
      const id = options.id || `img_${Date.now()}`;

      // Set options
      img.set({
        id: id,
        left: options.left || 50,
        top: options.top || 50,
        originX: 'center',
        originY: 'center',
        ...options
      });

      // Scale down large images to fit the canvas
      const maxWidth = this.canvas.width * 0.8;
      const maxHeight = this.canvas.height * 0.8;

      if (img.width > maxWidth || img.height > maxHeight) {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        img.scale(scale);
      }

      // Add image to canvas
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();

      // If not loading from existing data, emit event
      if (this.isTransmitting && !options._fromRemote) {
        this.socket.emit('whiteboard:object:add', {
          webinarId: this.webinarId,
          whiteboardId: this.currentWhiteboardId,
          objectId: id,
          objectData: img.toJSON(['id'])
        });
      }
    }, { crossOrigin: 'anonymous' });
  }

  /**
   * Handle image upload from server
   * @param {Object} data - Image data
   */
  handleImageUploaded(data) {
    if (data.whiteboardId !== this.currentWhiteboardId) return;

    // Add image to canvas
    this.addImage(data.imageUrl, {
      _fromRemote: true,
      id: `img_${Date.now()}`
    });
  }

  setupSocketListeners() {
    // Other socket listeners...

    // Listen for image uploads
    this.socket.on('whiteboard:image:uploaded', (data) => {
      this.handleImageUploaded(data);
    });
  }

/**
 * Record a whiteboard action
 * @param {String} action - Action type (add, modify, remove, clear, full)
 * @param {String} objectId - ID of the object being modified (optional)
 * @param {Object} canvasData - Canvas data for the action (optional)
 */
recordAction(action, objectId = null, canvasData = null) {
  // Check if we should record this action
  const shouldRecord = this.getWhiteboardData()?.recording?.isRecording || false;

  if (!shouldRecord) return;

  // Prepare frame data
  const frameData = {
    action,
    userId: this.userId,
    objectId
  };

  // Add canvas data if provided
  if (canvasData) {
    frameData.canvasData = typeof canvasData === 'string'
      ? canvasData
      : JSON.stringify(canvasData);
  }

  // Emit recording frame
  this.socket.emit('whiteboard:recording:frame', {
    webinarId: this.webinarId,
    whiteboardId: this.currentWhiteboardId,
    frameData
  });
}

// Modify canvas add handler
handleCanvasObjectAdded(e) {
  const obj = e.target;

  // Skip if it's an internal add
  if (obj._fromInternal) return;

  // Skip if it's a remote add
  if (obj._fromRemote) return;

  // Add unique ID if not already set
  if (!obj.id) {
    obj.id = `${obj.type}_${Date.now()}`;
  }

  // Transmit to other users if enabled
  if (this.isTransmitting) {
    this.socket.emit('whiteboard:object:add', {
      webinarId: this.webinarId,
      whiteboardId: this.currentWhiteboardId,
      objectId: obj.id,
      objectData: obj.toJSON(['id'])
    });

    // Record action if recording
    this.recordAction('add', obj.id, obj.toJSON(['id']));
  }
}

// Modify canvas modify handler
handleCanvasObjectModified(e) {
  const obj = e.target;

  // Skip if it's a remote modification
  if (obj._modifiedFromRemote) {
    obj._modifiedFromRemote = false;
    return;
  }

  // Transmit to other users if enabled
  if (this.isTransmitting) {
    this.socket.emit('whiteboard:object:modify', {
      webinarId: this.webinarId,
      whiteboardId: this.currentWhiteboardId,
      objectId: obj.id,
      objectData: obj.toJSON(['id'])
    });

    // Record action if recording
    this.recordAction('modify', obj.id, obj.toJSON(['id']));
  }
}

// Modify canvas remove handler
handleCanvasObjectRemoved(e) {
  const obj = e.target;

  // Skip if it's a remote removal
  if (obj._removedFromRemote) return;

  // Transmit to other users if enabled
  if (this.isTransmitting) {
    this.socket.emit('whiteboard:object:remove', {
      webinarId: this.webinarId,
      whiteboardId: this.currentWhiteboardId,
      objectId: obj.id
    });

    // Record action if recording
    this.recordAction('remove', obj.id);
  }
}

// Modify clear whiteboard method
clearWhiteboard() {
  // Clear canvas
  this.canvas.clear();

  // Transmit to other users if enabled
  if (this.isTransmitting) {
    this.socket.emit('whiteboard:clear', {
      webinarId: this.webinarId,
      whiteboardId: this.currentWhiteboardId
    });

    // Record action if recording
    this.recordAction('clear');
  }

  // Update whiteboard data
  this.updateWhiteboardData();
}
