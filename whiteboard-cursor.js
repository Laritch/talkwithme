// Whiteboard Cursor Tracking for Presentation Mode
class WhiteboardCursorTracker {
  constructor(options = {}) {
    this.containerId = options.containerId || 'whiteboard-container';
    this.canvasId = options.canvasId || 'whiteboard-canvas';
    this.webinarId = options.webinarId;
    this.socket = options.socket;
    this.isHost = options.isHost || false;
    this.isPresenter = options.isPresenter || false;
    this.throttleInterval = options.throttleInterval || 50; // ms
    
    this.cursorElement = null;
    this.presenterCursor = null;
    this.lastEmitTime = 0;
    
    this.initialize();
  }
  
  /**
   * Initialize cursor tracking
   */
  initialize() {
    // Create presenter cursor element if not host/presenter
    if (!this.isHost && !this.isPresenter) {
      this.createPresenterCursor();
    }
    
    this.setupEventListeners();
    this.setupSocketListeners();
  }
  
  /**
   * Create the presenter's cursor element
   */
  createPresenterCursor() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Check if cursor already exists
    if (container.querySelector('.presenter-cursor')) return;
    
    this.presenterCursor = document.createElement('div');
    this.presenterCursor.className = 'presenter-cursor';
    this.presenterCursor.style.display = 'none';
    container.appendChild(this.presenterCursor);
  }
  
  /**
   * Set up mouse event listeners
   */
  setupEventListeners() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    // Only track host/presenter mouse movements
    if (this.isHost || this.isPresenter) {
      canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }
  
  /**
   * Set up socket listeners
   */
  setupSocketListeners() {
    if (!this.socket) return;
    
    // Listen for cursor movements
    this.socket.on('whiteboard:cursor:move', (data) => {
      if (data.webinarId !== this.webinarId) return;
      
      // Don't show presenter cursor to host/presenter
      if (this.isHost || this.isPresenter) return;
      
      // Update presenter cursor position
      if (this.presenterCursor) {
        this.presenterCursor.style.display = 'block';
        this.presenterCursor.style.left = `${data.x}px`;
        this.presenterCursor.style.top = `${data.y}px`;
      }
    });
    
    // Listen for cursor out events
    this.socket.on('whiteboard:cursor:out', (data) => {
      if (data.webinarId !== this.webinarId) return;
      
      // Hide presenter cursor
      if (this.presenterCursor) {
        this.presenterCursor.style.display = 'none';
      }
    });
    
    // Listen for presentation mode changes
    this.socket.on('whiteboard:presentation-mode-changed', (data) => {
      if (data.webinarId !== this.webinarId) return;
      
      if (data.presentationMode) {
        // Create presenter cursor if it doesn't exist
        if (!this.isHost && !this.isPresenter && !this.presenterCursor) {
          this.createPresenterCursor();
        }
      } else {
        // Hide presenter cursor when not in presentation mode
        if (this.presenterCursor) {
          this.presenterCursor.style.display = 'none';
        }
      }
    });
  }
  
  /**
   * Handle mouse movement on canvas
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    if (!this.socket) return;
    
    // Throttle emission rate
    const now = Date.now();
    if (now - this.lastEmitTime < this.throttleInterval) return;
    this.lastEmitTime = now;
    
    // Calculate cursor position relative to container
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Emit cursor position
    this.socket.emit('whiteboard:cursor:move', {
      webinarId: this.webinarId,
      x,
      y
    });
  }
  
  /**
   * Handle mouse out event
   */
  handleMouseOut() {
    if (!this.socket) return;
    
    this.socket.emit('whiteboard:cursor:out', {
      webinarId: this.webinarId
    });
  }
}
