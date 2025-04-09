/**
 * Webinar Video Streaming Module
 * Implements WebRTC-based video streaming for webinars
 */

class WebinarVideoManager {
  constructor(options = {}) {
    // Configuration
    this.config = {
      socketServer: options.socketServer || '/webinars',
      iceServers: options.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      ...options
    };

    // State management
    this.state = {
      webinarId: null,
      userId: null,
      username: null,
      isHost: false,
      localStream: null,
      screenStream: null,
      localVideoEnabled: true,
      localAudioEnabled: true,
      isScreenSharing: false,
      isRecording: false,
      mediaRecorder: null,
      recordedChunks: [],
      peers: new Map(), // Map of peer connections
      remoteStreams: new Map(), // Map of remote streams
    };

    // DOM elements
    this.elements = {
      localVideo: null,
      remoteVideosContainer: null,
      controlsContainer: null,
      screenShareContainer: null,
    };

    // Socket connection
    this.socket = null;

    // Simple-peer dependencies
    this.SimplePeer = window.SimplePeer;
    if (!this.SimplePeer) {
      console.error('SimplePeer library not found. Make sure to include it in your HTML.');
    }

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.joinWebinar = this.joinWebinar.bind(this);
    this.leaveWebinar = this.leaveWebinar.bind(this);
    this.startLocalStream = this.startLocalStream.bind(this);
    this.stopLocalStream = this.stopLocalStream.bind(this);
    this.toggleVideo = this.toggleVideo.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
    this.startScreenShare = this.startScreenShare.bind(this);
    this.stopScreenShare = this.stopScreenShare.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.createPeerConnection = this.createPeerConnection.bind(this);
    this.handleNewPeer = this.handleNewPeer.bind(this);
    this.handlePeerDisconnect = this.handlePeerDisconnect.bind(this);
    this.renderControls = this.renderControls.bind(this);
    this.renderStream = this.renderStream.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Initialize the video manager with required DOM elements
   * @param {Object} elements - DOM elements for video display
   */
  initialize(elements) {
    this.elements = {
      ...this.elements,
      ...elements
    };

    // Load the simple-peer library if not already loaded
    if (!window.SimplePeer) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js';
      script.async = true;
      script.onload = () => {
        this.SimplePeer = window.SimplePeer;
        console.log('SimplePeer library loaded');
      };
      document.head.appendChild(script);
    }

    // Render initial UI elements
    this.renderControls();

    return this;
  }

  /**
   * Join a webinar session and initialize WebRTC connections
   * @param {Object} params - Webinar joining parameters
   */
  async joinWebinar({ webinarId, userId, username, isHost, socket }) {
    try {
      this.state.webinarId = webinarId;
      this.state.userId = userId;
      this.state.username = username;
      this.state.isHost = isHost;
      this.socket = socket;

      // Register socket event listeners
      this.registerSocketEvents();

      // Initialize local media stream
      await this.startLocalStream();

      // Notify server about joining
      this.socket.emit('join-webinar-video', {
        webinarId,
        userId,
        username,
        isHost
      });

      console.log(`Joined webinar ${webinarId} as ${isHost ? 'host' : 'attendee'}`);
      return true;
    } catch (error) {
      console.error('Error joining webinar video:', error);
      return false;
    }
  }

  /**
   * Register all required socket events for WebRTC signaling
   */
  registerSocketEvents() {
    // New peer joined the webinar
    this.socket.on('new-peer', this.handleNewPeer);

    // Peer left the webinar
    this.socket.on('peer-disconnect', this.handlePeerDisconnect);

    // Received a signal from a peer
    this.socket.on('signal', async (data) => {
      const { peerId, signal } = data;

      // If we already have this peer, signal it
      if (this.state.peers.has(peerId)) {
        try {
          const peer = this.state.peers.get(peerId);
          peer.signal(signal);
        } catch (error) {
          console.error('Error signaling to peer:', error);
        }
      } else {
        // If we don't have this peer yet, create a new connection
        // This handles the case when we receive a signal before the 'new-peer' event
        await this.createPeerConnection(peerId, false);
        const peer = this.state.peers.get(peerId);
        if (peer) {
          peer.signal(signal);
        }
      }
    });

    // Screen sharing started by someone
    this.socket.on('screen-sharing-started', ({ userId, username }) => {
      console.log(`${username} started screen sharing`);
      // UI notification could be added here
    });

    // Screen sharing stopped by someone
    this.socket.on('screen-sharing-stopped', ({ userId, username }) => {
      console.log(`${username} stopped screen sharing`);
      // UI notification could be added here
    });
  }

  /**
   * Initialize local media stream
   */
  async startLocalStream() {
    try {
      // Get user media with video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.state.localStream = stream;

      // Display local stream in local video element
      if (this.elements.localVideo) {
        this.elements.localVideo.srcObject = stream;
        this.elements.localVideo.muted = true; // Mute local video to prevent feedback
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);

      // Try to get only audio if video fails
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });

        this.state.localStream = audioOnlyStream;
        this.state.localVideoEnabled = false;

        if (this.elements.localVideo) {
          this.elements.localVideo.srcObject = audioOnlyStream;
          this.elements.localVideo.muted = true;
        }

        return audioOnlyStream;
      } catch (audioError) {
        console.error('Error accessing audio:', audioError);
        throw new Error('Could not access media devices');
      }
    }
  }

  /**
   * Handle a new peer joining the webinar
   * @param {Object} data - Peer information
   */
  async handleNewPeer(data) {
    const { peerId, userId, username, isHost } = data;

    console.log(`New peer joined: ${username} (${peerId})`);

    // Create a new peer connection (initiator: true)
    await this.createPeerConnection(peerId, true, { userId, username, isHost });
  }

  /**
   * Create a WebRTC peer connection
   * @param {string} peerId - The peer's unique identifier
   * @param {boolean} isInitiator - Whether this peer is the initiator
   * @param {Object} metadata - Additional metadata about the peer
   */
  async createPeerConnection(peerId, isInitiator, metadata = {}) {
    try {
      // Create a new SimplePeer instance
      const peer = new this.SimplePeer({
        initiator: isInitiator,
        stream: this.state.localStream,
        trickle: true,
        config: {
          iceServers: this.config.iceServers
        }
      });

      // Store peer connection
      this.state.peers.set(peerId, peer);

      // Handle peer events
      peer.on('signal', (signal) => {
        // Send the signal to the remote peer via socket
        this.socket.emit('signal', {
          signal,
          peerId,
          from: this.state.userId
        });
      });

      peer.on('stream', (stream) => {
        // Store the remote stream
        this.state.remoteStreams.set(peerId, stream);

        // Render the remote stream
        this.renderStream(peerId, stream, metadata);
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        this.handlePeerDisconnect({ peerId });
      });

      peer.on('close', () => {
        this.handlePeerDisconnect({ peerId });
      });

      return peer;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      return null;
    }
  }

  /**
   * Handle a peer disconnecting from the webinar
   * @param {Object} data - Disconnection information
   */
  handlePeerDisconnect(data) {
    const { peerId } = data;

    // Close and remove peer connection
    if (this.state.peers.has(peerId)) {
      const peer = this.state.peers.get(peerId);
      peer.destroy();
      this.state.peers.delete(peerId);
    }

    // Remove remote stream
    this.state.remoteStreams.delete(peerId);

    // Remove video element
    const videoElement = document.getElementById(`remote-video-${peerId}`);
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement.parentNode.remove();
    }

    console.log(`Peer disconnected: ${peerId}`);
  }

  /**
   * Toggle local video on/off
   */
  toggleVideo() {
    if (this.state.localStream) {
      const videoTracks = this.state.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });

      this.state.localVideoEnabled = videoTracks.length > 0 ? videoTracks[0].enabled : false;

      // Notify UI of state change
      const videoToggleBtn = document.getElementById('video-toggle');
      if (videoToggleBtn) {
        videoToggleBtn.innerHTML = this.state.localVideoEnabled
          ? '<i class="fas fa-video"></i>'
          : '<i class="fas fa-video-slash"></i>';
      }
    }
  }

  /**
   * Toggle local audio on/off
   */
  toggleAudio() {
    if (this.state.localStream) {
      const audioTracks = this.state.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });

      this.state.localAudioEnabled = audioTracks.length > 0 ? audioTracks[0].enabled : false;

      // Notify UI of state change
      const audioToggleBtn = document.getElementById('audio-toggle');
      if (audioToggleBtn) {
        audioToggleBtn.innerHTML = this.state.localAudioEnabled
          ? '<i class="fas fa-microphone"></i>'
          : '<i class="fas fa-microphone-slash"></i>';
      }
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    try {
      if (this.state.isScreenSharing) return;

      // Get screen sharing stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      this.state.screenStream = screenStream;
      this.state.isScreenSharing = true;

      // Display screen sharing stream
      if (this.elements.screenShareContainer) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = screenStream;
        videoElement.autoplay = true;
        videoElement.id = 'screen-share-video';
        videoElement.className = 'screen-share-video';

        // Clear any existing content
        this.elements.screenShareContainer.innerHTML = '';
        this.elements.screenShareContainer.appendChild(videoElement);
        this.elements.screenShareContainer.style.display = 'block';
      }

      // Replace video track for all peers
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Replace the video track in all peer connections
      for (const [peerId, peer] of this.state.peers.entries()) {
        const sender = peer.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      }

      // Notify other users that screen sharing has started
      this.socket.emit('screen-sharing-started', {
        webinarId: this.state.webinarId,
        userId: this.state.userId,
        username: this.state.username
      });

      // Update UI
      const screenShareBtn = document.getElementById('screen-share');
      if (screenShareBtn) {
        screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> Stop Sharing';
      }

      return true;
    } catch (error) {
      console.error('Error starting screen share:', error);
      return false;
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare() {
    if (!this.state.isScreenSharing || !this.state.screenStream) return;

    // Stop all tracks in the screen sharing stream
    this.state.screenStream.getTracks().forEach(track => track.stop());

    // Reset state
    this.state.isScreenSharing = false;
    this.state.screenStream = null;

    // Restore video track from local stream for all peers
    if (this.state.localStream) {
      const videoTrack = this.state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        for (const [peerId, peer] of this.state.peers.entries()) {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
      }
    }

    // Hide screen sharing container
    if (this.elements.screenShareContainer) {
      this.elements.screenShareContainer.innerHTML = '';
      this.elements.screenShareContainer.style.display = 'none';
    }

    // Notify other users that screen sharing has stopped
    this.socket.emit('screen-sharing-stopped', {
      webinarId: this.state.webinarId,
      userId: this.state.userId,
      username: this.state.username
    });

    // Update UI
    const screenShareBtn = document.getElementById('screen-share');
    if (screenShareBtn) {
      screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> Share Screen';
    }
  }

  /**
   * Start recording the webinar
   */
  startRecording() {
    if (this.state.isRecording) return;

    try {
      // Create a combined stream of all videos
      const streams = [];

      // Add local stream
      if (this.state.localStream) {
        streams.push(this.state.localStream);
      }

      // Add remote streams
      for (const stream of this.state.remoteStreams.values()) {
        streams.push(stream);
      }

      // If screen sharing is active, prioritize it
      if (this.state.screenStream) {
        streams.unshift(this.state.screenStream);
      }

      if (streams.length === 0) {
        console.error('No streams available to record');
        return false;
      }

      // Create a canvas to combine streams (simple implementation)
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      // Function to draw streams on canvas
      const drawStreams = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (streams.length === 1) {
          // Single stream - fill the canvas
          const videoElement = document.createElement('video');
          videoElement.srcObject = streams[0];
          videoElement.muted = true;
          videoElement.play();
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else {
          // Multiple streams - grid layout
          const cols = Math.ceil(Math.sqrt(streams.length));
          const rows = Math.ceil(streams.length / cols);
          const width = canvas.width / cols;
          const height = canvas.height / rows;

          streams.forEach((stream, i) => {
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.muted = true;
            videoElement.play();

            const col = i % cols;
            const row = Math.floor(i / cols);

            ctx.drawImage(
              videoElement,
              col * width,
              row * height,
              width,
              height
            );
          });
        }

        if (this.state.isRecording) {
          requestAnimationFrame(drawStreams);
        }
      };

      // Start drawing
      drawStreams();

      // Get canvas stream
      const canvasStream = canvas.captureStream(30);

      // Add audio tracks from all streams
      streams.forEach(stream => {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      });

      // Create media recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      this.state.mediaRecorder = new MediaRecorder(canvasStream, options);
      this.state.recordedChunks = [];

      // Handle data available event
      this.state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.state.recordedChunks.push(event.data);
        }
      };

      // Handle recording stopped
      this.state.mediaRecorder.onstop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(this.state.recordedChunks, { type: 'video/webm' });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `webinar-${this.state.webinarId}-${Date.now()}.webm`;

        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        this.state.isRecording = false;
        this.state.recordedChunks = [];

        // Update UI
        const recordBtn = document.getElementById('record-toggle');
        if (recordBtn) {
          recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Start Recording';
          recordBtn.classList.remove('btn-danger');
          recordBtn.classList.add('btn-success');
        }
      };

      // Start recording
      this.state.mediaRecorder.start(1000);
      this.state.isRecording = true;

      // Update UI
      const recordBtn = document.getElementById('record-toggle');
      if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Recording';
        recordBtn.classList.remove('btn-success');
        recordBtn.classList.add('btn-danger');
      }

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.state.isRecording = false;
      return false;
    }
  }

  /**
   * Stop recording the webinar
   */
  stopRecording() {
    if (!this.state.isRecording || !this.state.mediaRecorder) {
      return false;
    }

    try {
      this.state.mediaRecorder.stop();
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }

  /**
   * Render a remote video stream
   * @param {string} peerId - The peer's ID
   * @param {MediaStream} stream - The media stream to render
   * @param {Object} metadata - Additional information about the peer
   */
  renderStream(peerId, stream, metadata = {}) {
    if (!this.elements.remoteVideosContainer) return;

    // Create container for the remote video
    const videoContainer = document.createElement('div');
    videoContainer.className = 'remote-video-container';
    videoContainer.id = `container-${peerId}`;

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.id = `remote-video-${peerId}`;
    videoElement.className = 'remote-video';
    videoElement.autoplay = true;
    videoElement.playsInline = true;

    // Create name label
    const nameLabel = document.createElement('div');
    nameLabel.className = 'video-name-label';
    nameLabel.textContent = metadata.username || `Peer ${peerId.substring(0, 5)}`;

    // Add host badge if applicable
    if (metadata.isHost) {
      const hostBadge = document.createElement('span');
      hostBadge.className = 'host-badge';
      hostBadge.textContent = 'HOST';
      nameLabel.appendChild(hostBadge);
    }

    // Add elements to the container
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(nameLabel);

    // Add to the remote videos container
    this.elements.remoteVideosContainer.appendChild(videoContainer);
  }

  /**
   * Render video controls
   */
  renderControls() {
    if (!this.elements.controlsContainer) return;

    const controlsHtml = `
      <div class="video-controls">
        <button id="audio-toggle" class="btn btn-sm btn-primary" title="Toggle Microphone">
          <i class="fas fa-microphone"></i>
        </button>
        <button id="video-toggle" class="btn btn-sm btn-primary" title="Toggle Camera">
          <i class="fas fa-video"></i>
        </button>
        <button id="screen-share" class="btn btn-sm btn-info" title="Share Screen">
          <i class="fas fa-desktop"></i> Share Screen
        </button>
        <button id="record-toggle" class="btn btn-sm btn-success" title="Record Webinar">
          <i class="fas fa-record-vinyl"></i> Start Recording
        </button>
        <button id="leave-webinar-btn" class="btn btn-sm btn-danger" title="Leave">
          <i class="fas fa-phone-slash"></i> Leave
        </button>
      </div>
    `;

    this.elements.controlsContainer.innerHTML = controlsHtml;

    // Add event listeners
    document.getElementById('audio-toggle').addEventListener('click', this.toggleAudio);
    document.getElementById('video-toggle').addEventListener('click', this.toggleVideo);
    document.getElementById('screen-share').addEventListener('click', () => {
      if (this.state.isScreenSharing) {
        this.stopScreenShare();
      } else {
        this.startScreenShare();
      }
    });
    document.getElementById('record-toggle').addEventListener('click', () => {
      if (this.state.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });
    document.getElementById('leave-webinar-btn').addEventListener('click', this.leaveWebinar);
  }

  /**
   * Leave the webinar and clean up resources
   */
  leaveWebinar() {
    // Notify server
    if (this.socket) {
      this.socket.emit('leave-webinar-video', {
        webinarId: this.state.webinarId,
        userId: this.state.userId
      });
    }

    this.cleanup();

    // Redirect or show UI for webinar ended
    if (this.config.onLeaveWebinar) {
      this.config.onLeaveWebinar();
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop recording if active
    if (this.state.isRecording) {
      this.stopRecording();
    }

    // Stop screen sharing if active
    if (this.state.isScreenSharing) {
      this.stopScreenShare();
    }

    // Stop local stream
    this.stopLocalStream();

    // Close all peer connections
    for (const [peerId, peer] of this.state.peers.entries()) {
      peer.destroy();
    }

    // Clear state
    this.state.peers.clear();
    this.state.remoteStreams.clear();

    // Clear UI
    if (this.elements.remoteVideosContainer) {
      this.elements.remoteVideosContainer.innerHTML = '';
    }

    if (this.elements.localVideo) {
      this.elements.localVideo.srcObject = null;
    }

    console.log('Left webinar and cleaned up resources');
  }

  /**
   * Stop the local media stream
   */
  stopLocalStream() {
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach(track => track.stop());
      this.state.localStream = null;
    }
  }
}

// Export for CommonJS / ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebinarVideoManager;
} else {
  window.WebinarVideoManager = WebinarVideoManager;
}
