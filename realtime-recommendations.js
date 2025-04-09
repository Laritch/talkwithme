/**
 * Real-time Recommendations Client
 * Handles WebSocket connections for receiving real-time recommendation updates
 */

class RealtimeRecommendations {
  constructor(options = {}) {
    this.options = {
      socketUrl: options.socketUrl || window.location.origin,
      expertId: options.expertId || null,
      autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
      mockMode: options.mockMode !== undefined ? options.mockMode : true
    };

    this.socket = null;
    this.isConnected = false;
    this.recommendations = [];
    this.handlers = {
      'new': [],
      'applied': [],
      'dismissed': [],
      'stats': [],
      'connect': [],
      'disconnect': []
    };

    // Auto-connect if enabled
    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.socket) return;

    try {
      if (!this.options.mockMode) {
        // In a real implementation, use actual Socket.IO connection
        if (typeof io !== 'undefined') {
          this.socket = io(this.options.socketUrl);
          this.setupRealSocketHandlers();
        } else {
          console.error('Socket.IO client not found. Make sure to include the Socket.IO client script.');
          this.setupMockSocket();
        }
      } else {
        this.setupMockSocket();
      }

      console.log('RealtimeRecommendations connected');
      this.isConnected = true;
      this.triggerHandlers('connect');

    } catch (error) {
      console.error('Failed to connect to recommendations service:', error);
      // Fall back to mock mode if connection fails
      this.setupMockSocket();
    }
  }

  /**
   * Set up handlers for real Socket.IO connection
   */
  setupRealSocketHandlers() {
    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;

      // Authenticate with expert ID if available
      if (this.options.expertId) {
        this.socket.emit('authenticate', {
          userType: 'expert',
          userId: this.options.expertId
        });

        // Subscribe to expert's recommendation channel
        this.socket.emit('subscribe', `recommendations:${this.options.expertId}`);
      }

      this.triggerHandlers('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.triggerHandlers('disconnect');
    });

    // Handle recommendation events
    this.socket.on('recommendation:new', (recommendation) => {
      console.log('New recommendation received:', recommendation);
      this.recommendations.unshift(recommendation);
      this.triggerHandlers('new', recommendation);
    });

    this.socket.on('expert:stats:update', (stats) => {
      console.log('Expert stats updated:', stats);
      this.triggerHandlers('stats', stats);
    });

    // Handle confirmation events
    this.socket.on('recommendation:applied:confirmed', (data) => {
      console.log('Recommendation application confirmed:', data);
    });

    this.socket.on('recommendation:dismissed:confirmed', (data) => {
      console.log('Recommendation dismissal confirmed:', data);
    });
  }

  /**
   * Set up mock socket for offline testing
   */
  setupMockSocket() {
    // Create a mock socket object
    this.socket = {
      emit: (event, data) => {
        console.log(`Mock socket emitted ${event}:`, data);

        // Mock response for apply/dismiss events
        if (event === 'recommendation:applied') {
          setTimeout(() => {
            this.handleMockEvent('recommendation:applied:confirmed', {
              recommendationId: data.recommendationId,
              status: 'success'
            });
          }, 500);
        } else if (event === 'recommendation:dismissed') {
          setTimeout(() => {
            this.handleMockEvent('recommendation:dismissed:confirmed', {
              recommendationId: data.recommendationId,
              status: 'success'
            });
          }, 500);
        }
      }
    };

    console.log('Using mock socket for recommendations');

    // Generate some initial mock recommendations
    this.generateMockRecommendations();

    // Set up interval for mock recommendations if expert ID is provided
    if (this.options.expertId) {
      setInterval(() => {
        this.generateMockRecommendation();
      }, 60000); // Generate a new recommendation every minute
    }
  }

  /**
   * Handle mock events for the mock socket
   */
  handleMockEvent(event, data) {
    switch(event) {
      case 'recommendation:new':
        console.log('Mock new recommendation:', data);
        this.recommendations.unshift(data);
        this.triggerHandlers('new', data);
        break;

      case 'expert:stats:update':
        console.log('Mock stats update:', data);
        this.triggerHandlers('stats', data);
        break;

      case 'recommendation:applied:confirmed':
      case 'recommendation:dismissed:confirmed':
        console.log(`Mock ${event}:`, data);
        break;
    }
  }

  /**
   * Generate initial mock recommendations
   */
  generateMockRecommendations() {
    const types = ['pricing', 'duration', 'strategy'];
    const initialCount = Math.floor(Math.random() * 3) + 1; // 1-3 initial recommendations

    for (let i = 0; i < initialCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const mockRec = this.createMockRecommendation(type);

      // Add to recommendations list
      this.recommendations.push(mockRec);

      // Trigger handlers with a delay to simulate real-time arrivals
      setTimeout(() => {
        this.triggerHandlers('new', mockRec);
      }, i * 1000);
    }
  }

  /**
   * Generate a new mock recommendation
   */
  generateMockRecommendation() {
    const types = ['pricing', 'duration', 'strategy'];
    const type = types[Math.floor(Math.random() * types.length)];
    const mockRec = this.createMockRecommendation(type);

    // Trigger mock event
    this.handleMockEvent('recommendation:new', mockRec);

    return mockRec;
  }

  /**
   * Create a mock recommendation of a specific type
   */
  createMockRecommendation(type) {
    const now = new Date();
    const id = `mock-${type}-${now.getTime()}`;

    let recommendation = {
      id,
      type,
      timestamp: now.toISOString(),
      isNew: true
    };

    switch(type) {
      case 'pricing':
        recommendation = {
          ...recommendation,
          title: 'Optimize consultation price',
          currentPrice: 90,
          recommendedPrice: 105,
          confidence: 0.87,
          impact: {
            revenue: 840,
            bookings: -2
          },
          reasoning: [
            'Your rating is above category average',
            'High booking rate indicates strong demand',
            'Similar experts charge higher rates'
          ]
        };
        break;

      case 'duration':
        recommendation = {
          ...recommendation,
          title: 'Add 45-minute consultation option',
          duration: 45,
          recommendedPrice: 75,
          confidence: 0.92,
          impact: {
            bookings: 15,
            revenue: 1125
          },
          reasoning: [
            'Fills gap between your 30 and 60 minute options',
            '45-minute consultations are popular in your category',
            'Clients often find 30 minutes too short but 60 minutes too long'
          ]
        };
        break;

      case 'strategy':
        recommendation = {
          ...recommendation,
          title: 'Implement client follow-up protocol',
          action: 'Send follow-up message with resources 3 days after consultation',
          confidence: 0.79,
          impact: {
            retentionIncrease: 22
          },
          reasoning: [
            'Your retention rate is below category average',
            'Follow-ups increase perceived consultation value',
            'Top performing experts have structured follow-up processes'
          ]
        };
        break;
    }

    return recommendation;
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket && !this.options.mockMode) {
      this.socket.disconnect();
    }

    this.socket = null;
    this.isConnected = false;
    this.triggerHandlers('disconnect');
  }

  /**
   * Get all current recommendations
   */
  getRecommendations() {
    return [...this.recommendations];
  }

  /**
   * Apply a recommendation
   */
  applyRecommendation(recommendationId) {
    if (!this.socket) return false;

    // Find the recommendation
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return false;

    // Mark as applied locally
    recommendation.applied = true;
    recommendation.appliedAt = new Date().toISOString();

    // Emit event to server
    this.socket.emit('recommendation:applied', {
      recommendationId,
      expertId: this.options.expertId,
      result: 'success'
    });

    // Trigger handlers
    this.triggerHandlers('applied', recommendation);

    return true;
  }

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation(recommendationId, reason = '') {
    if (!this.socket) return false;

    // Find the recommendation
    const index = this.recommendations.findIndex(r => r.id === recommendationId);
    if (index === -1) return false;

    const recommendation = this.recommendations[index];

    // Remove from local list
    this.recommendations.splice(index, 1);

    // Emit event to server
    this.socket.emit('recommendation:dismissed', {
      recommendationId,
      expertId: this.options.expertId,
      reason
    });

    // Trigger handlers
    this.triggerHandlers('dismissed', { ...recommendation, reason });

    return true;
  }

  /**
   * Add an event handler
   */
  on(event, handler) {
    if (!this.handlers[event]) {
      console.warn(`Unknown event type: ${event}`);
      return;
    }

    this.handlers[event].push(handler);
    return () => this.off(event, handler); // Return unsubscribe function
  }

  /**
   * Remove an event handler
   */
  off(event, handler) {
    if (!this.handlers[event]) return;

    const index = this.handlers[event].indexOf(handler);
    if (index !== -1) {
      this.handlers[event].splice(index, 1);
    }
  }

  /**
   * Trigger all handlers for an event
   */
  triggerHandlers(event, data) {
    if (!this.handlers[event]) return;

    this.handlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }
}

// Create global instance if expertId is available
document.addEventListener('DOMContentLoaded', () => {
  // Look for expert ID in data attribute or localStorage
  const expertIdEl = document.querySelector('[data-expert-id]');
  const expertId = expertIdEl ? expertIdEl.dataset.expertId : localStorage.getItem('expertId');

  if (expertId) {
    window.realtimeRecommendations = new RealtimeRecommendations({
      expertId,
      mockMode: true // Use mock mode for demo purposes
    });

    console.log(`Initialized real-time recommendations for expert ${expertId}`);
  } else {
    console.log('No expert ID found, real-time recommendations not initialized');
  }
});
