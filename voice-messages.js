/**
 * Voice Messages Module
 *
 * This module provides functionality for:
 * - Recording voice messages
 * - Sending recorded audio
 * - Playing received voice messages
 * - Visualizing audio playback with waveforms
 */

class VoiceMessageHandler {
  constructor(socket) {
    this.socket = socket;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.maxRecordingLength = 300000; // 5 minutes max
    this.audioVisualizer = null;
    this.activePlaybacks = new Map(); // Keep track of currently playing audio

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the voice message module
   */
  init() {
    // Add record buttons to private and group chat
    this.addRecordButtons();

    // Set up event delegation for audio playback
    document.addEventListener('click', (e) => {
      // Handle play button clicks for voice messages
      if (e.target.closest('.voice-message-play')) {
        const playButton = e.target.closest('.voice-message-play');
        const audioElement = playButton.parentElement.querySelector('audio');
        const waveform = playButton.parentElement.querySelector('.voice-message-waveform');

        if (audioElement) {
          this.toggleAudioPlayback(audioElement, playButton, waveform);
        }
      }
    });
  }

  /**
   * Add voice recording buttons to chat interfaces
   */
  addRecordButtons() {
    // Add to private chat
    const privateChatInput = document.querySelector('.chat-input');
    if (privateChatInput) {
      const recordButton = document.createElement('button');
      recordButton.className = 'voice-record-btn';
      recordButton.title = 'Record a voice message';
      recordButton.innerHTML = '<i class="fas fa-microphone"></i>';

      // Add before send button
      const sendBtn = privateChatInput.querySelector('.send-btn');
      if (sendBtn) {
        privateChatInput.insertBefore(recordButton, sendBtn);
      } else {
        privateChatInput.appendChild(recordButton);
      }

      // Add event listeners
      recordButton.addEventListener('click', () => this.toggleRecording('private'));
    }

    // Add to group chat
    const groupChatInput = document.querySelector('.message-input');
    if (groupChatInput) {
      const recordButton = document.createElement('button');
      recordButton.className = 'voice-record-btn';
      recordButton.title = 'Record a voice message';
      recordButton.innerHTML = '<i class="fas fa-microphone"></i>';

      // Add before send button
      const sendGroupBtn = document.getElementById('send-group-btn');
      if (sendGroupBtn) {
        groupChatInput.insertBefore(recordButton, sendGroupBtn);
      } else {
        groupChatInput.appendChild(recordButton);
      }

      // Add event listeners
      recordButton.addEventListener('click', () => this.toggleRecording('group'));
    }

    // Create recording UI elements
    this.createRecordingUI();
  }

  /**
   * Create UI elements for recording interface
   */
  createRecordingUI() {
    // Create recording overlay
    const recordingOverlay = document.createElement('div');
    recordingOverlay.className = 'recording-overlay hidden';
    recordingOverlay.innerHTML = `
      <div class="recording-container">
        <div class="recording-header">
          <div class="recording-title">Recording Voice Message</div>
          <button class="recording-cancel"><i class="fas fa-times"></i></button>
        </div>
        <div class="recording-visualizer">
          <canvas id="audio-visualizer"></canvas>
        </div>
        <div class="recording-timer">00:00</div>
        <div class="recording-controls">
          <button class="recording-stop"><i class="fas fa-stop"></i> Stop</button>
          <button class="recording-send" disabled><i class="fas fa-paper-plane"></i> Send</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(recordingOverlay);

    // Add event listeners
    const cancelBtn = recordingOverlay.querySelector('.recording-cancel');
    const stopBtn = recordingOverlay.querySelector('.recording-stop');
    const sendBtn = recordingOverlay.querySelector('.recording-send');

    cancelBtn.addEventListener('click', () => this.cancelRecording());
    stopBtn.addEventListener('click', () => this.stopRecording());
    sendBtn.addEventListener('click', () => this.sendVoiceMessage());

    // Store reference to overlay
    this.recordingOverlay = recordingOverlay;
  }

  /**
   * Toggle recording state - start or stop
   * @param {string} chatType - 'private' or 'group'
   */
  async toggleRecording(chatType) {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording(chatType);
    }
  }

  /**
   * Start recording audio
   * @param {string} chatType - 'private' or 'group'
   */
  async startRecording(chatType) {
    // Check if we have the necessary permissions
    try {
      // Request permissions for microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Show recording UI
      this.recordingOverlay.classList.remove('hidden');

      // Store chat type
      this.activeChatType = chatType;

      // Setup visualizer
      this.setupAudioVisualizer(stream);

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      // Handle data
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      // Handle recording start
      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.startRecordingTimer();

        // Update UI to show recording state
        document.querySelectorAll('.voice-record-btn').forEach(btn => {
          btn.classList.add('recording');
        });
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.stopRecordingTimer();

        // Update UI to show recording finished
        document.querySelectorAll('.voice-record-btn').forEach(btn => {
          btn.classList.remove('recording');
        });

        // Enable send button
        const sendBtn = this.recordingOverlay.querySelector('.recording-send');
        sendBtn.disabled = false;

        // Stop visualizer
        if (this.audioVisualizer) {
          this.audioVisualizer.stop();
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Set max recording time
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.maxRecordingLength);

    } catch (error) {
      console.error('Error starting voice recording:', error);
      showNotification('Unable to access microphone. Please check permissions.', 'error');
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

    // Stop the recording
    this.mediaRecorder.stop();

    // Stop all tracks
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

    // Clear recording timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
  }

  /**
   * Cancel recording and close the overlay
   */
  cancelRecording() {
    // If recording, stop it
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clear recorded chunks
    this.recordedChunks = [];

    // Hide overlay
    this.recordingOverlay.classList.add('hidden');

    // Reset recording state
    this.isRecording = false;
    this.recordingStartTime = null;
    this.stopRecordingTimer();
  }

  /**
   * Send the recorded voice message
   */
  sendVoiceMessage() {
    // Check if we have recorded data
    if (this.recordedChunks.length === 0) {
      showNotification('No voice message recorded', 'error');
      return;
    }

    // Create blob from chunks
    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });

    // Create object URL for preview
    const audioUrl = URL.createObjectURL(blob);

    // Prepare audio for sending
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = {
        type: 'voice',
        data: reader.result,
        duration: Date.now() - this.recordingStartTime
      };

      // Send message based on chat type
      if (this.activeChatType === 'private' && selectedUser) {
        this.sendPrivateVoiceMessage(audioData);
      } else if (this.activeChatType === 'group' && selectedGroup) {
        this.sendGroupVoiceMessage(audioData);
      }

      // Reset recording state
      this.recordedChunks = [];
      this.recordingOverlay.classList.add('hidden');
    };

    // Read the blob as data URL
    reader.readAsDataURL(blob);
  }

  /**
   * Send a private voice message
   * @param {Object} audioData - The voice message data
   */
  sendPrivateVoiceMessage(audioData) {
    if (!this.socket || !selectedUser) return;

    // Check if we're online or offline
    if (offlineHandler && !offlineHandler.isConnected()) {
      // We're offline, queue the message
      offlineHandler.queueMessage('private', {
        senderId: currentUser._id,
        recipientId: selectedUser._id,
        content: 'Voice message',
        audioData
      }).then(result => {
        if (result) {
          const { clientMessage } = result;

          // Add a temporary voice message element to the UI
          const messagesContainer = document.getElementById('messages-container');
          if (messagesContainer) {
            messagesContainer.appendChild(this.createVoiceMessageElement(clientMessage));
            scrollToBottom(messagesContainer);
          }

          showNotification('Voice message queued and will be sent when online', 'info');
        }
      });
    } else {
      // We're online, send normally
      emitWithErrorHandling('sendMessage', {
        recipientId: selectedUser._id,
        content: 'Voice message',
        audioData
      }, 'send voice message');
    }
  }

  /**
   * Send a group voice message
   * @param {Object} audioData - The voice message data
   */
  sendGroupVoiceMessage(audioData) {
    if (!this.socket || !selectedGroup) return;

    // Check if we're online or offline
    if (offlineHandler && !offlineHandler.isConnected()) {
      // We're offline, queue the message
      offlineHandler.queueMessage('group', {
        senderId: currentUser._id,
        groupId: selectedGroup._id,
        content: 'Voice message',
        audioData
      }).then(result => {
        if (result) {
          const { clientMessage } = result;

          // Add a temporary voice message element to the UI
          const groupMessages = document.getElementById('group-messages');
          if (groupMessages) {
            groupMessages.appendChild(this.createVoiceMessageElement(clientMessage));
            scrollToBottom(groupMessages);
          }

          showNotification('Voice message queued and will be sent when online', 'info');
        }
      });
    } else {
      // We're online, send normally
      emitWithErrorHandling('sendGroupMessage', {
        groupId: selectedGroup._id,
        content: 'Voice message',
        audioData
      }, 'send group voice message');
    }
  }

  /**
   * Create an audio visualizer for recording
   * @param {MediaStream} stream - The audio stream to visualize
   */
  setupAudioVisualizer(stream) {
    const canvas = document.getElementById('audio-visualizer');
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Create audio context and analyzer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    // Connect source to analyzer
    source.connect(analyser);

    // Configure analyzer
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw function for visualizer
    const draw = () => {
      if (!this.isRecording) return;

      // Request next animation frame
      const drawVisual = requestAnimationFrame(draw);

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      canvasCtx.fillStyle = 'rgb(240, 240, 245)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate bar width
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Draw bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 102, 195)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    // Start visualization
    draw();

    // Store reference to allow stopping
    this.audioVisualizer = {
      stop: () => {
        source.disconnect();
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      }
    };
  }

  /**
   * Start the recording timer
   */
  startRecordingTimer() {
    const timerElement = this.recordingOverlay.querySelector('.recording-timer');

    this.recordingTimer = setInterval(() => {
      const elapsedTime = Date.now() - this.recordingStartTime;
      timerElement.textContent = this.formatDuration(elapsedTime);

      // If we've reached the max recording time, stop
      if (elapsedTime >= this.maxRecordingLength) {
        this.stopRecording();
      }
    }, 1000);
  }

  /**
   * Stop the recording timer
   */
  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Format duration in milliseconds to MM:SS
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Toggle playback of a voice message
   * @param {HTMLAudioElement} audio - The audio element
   * @param {HTMLElement} playButton - The play button element
   * @param {HTMLElement} waveform - The waveform element
   */
  toggleAudioPlayback(audio, playButton, waveform) {
    if (audio.paused) {
      // Pause any currently playing audio
      this.activePlaybacks.forEach((data, currentAudio) => {
        if (currentAudio !== audio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;

          // Update UI
          const { playBtn, wave } = data;
          playBtn.innerHTML = '<i class="fas fa-play"></i>';
          this.resetWaveform(wave);
        }
      });

      // Play the audio
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showNotification('Error playing voice message', 'error');
      });

      // Update UI
      playButton.innerHTML = '<i class="fas fa-pause"></i>';

      // Track playback progress
      const updateProgress = () => {
        if (audio.paused) return;

        const progress = (audio.currentTime / audio.duration) * 100;
        if (waveform) {
          this.updateWaveform(waveform, progress);
        }

        // Request next animation frame
        requestAnimationFrame(updateProgress);
      };

      // Start tracking progress
      updateProgress();

      // Add to active playbacks
      this.activePlaybacks.set(audio, { playBtn: playButton, wave: waveform });

      // Add ended event listener
      audio.onended = () => {
        // Reset UI
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        this.resetWaveform(waveform);

        // Remove from active playbacks
        this.activePlaybacks.delete(audio);
      };
    } else {
      // Pause the audio
      audio.pause();

      // Update UI
      playButton.innerHTML = '<i class="fas fa-play"></i>';

      // Remove from active playbacks
      this.activePlaybacks.delete(audio);
    }
  }

  /**
   * Update waveform progress
   * @param {HTMLElement} waveform - The waveform element
   * @param {number} progress - Playback progress percentage
   */
  updateWaveform(waveform, progress) {
    if (!waveform) return;

    waveform.style.backgroundImage = `linear-gradient(to right, var(--primary-color) ${progress}%, rgba(0, 0, 0, 0.1) ${progress}%)`;
  }

  /**
   * Reset waveform to initial state
   * @param {HTMLElement} waveform - The waveform element
   */
  resetWaveform(waveform) {
    if (!waveform) return;

    waveform.style.backgroundImage = 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 100%, rgba(0, 0, 0, 0.1) 100%)';
  }

  /**
   * Create a voice message element for display
   * @param {Object} message - Message object
   * @returns {HTMLElement} The voice message element
   */
  createVoiceMessageElement(message) {
    // Use the existing message element creation function
    const messageElement = createMessageElement(message);

    // Add voice message specific content
    const messageContent = messageElement.querySelector('.message-content');

    if (messageContent) {
      // Clear existing content
      const existingContent = messageContent.querySelector('p');
      if (existingContent) {
        existingContent.remove();
      }

      // Create voice message player
      const voicePlayer = document.createElement('div');
      voicePlayer.className = 'voice-message-player';

      // Format duration
      const durationFormatted = message.audioData?.duration
        ? this.formatDuration(message.audioData.duration)
        : '00:00';

      voicePlayer.innerHTML = `
        <button class="voice-message-play"><i class="fas fa-play"></i></button>
        <div class="voice-message-waveform"></div>
        <div class="voice-message-duration">${durationFormatted}</div>
        <audio src="${message.audioData?.data || message.audioUrl}" preload="none"></audio>
      `;

      // Add to message content
      messageContent.insertBefore(voicePlayer, messageContent.firstChild);
    }

    return messageElement;
  }

  /**
   * Enhance the createMessageElement function to handle voice messages
   * @param {Function} createMessageElementFn - Original create message function
   * @returns {Function} Enhanced function that handles voice messages
   */
  enhanceCreateMessageElement(createMessageElementFn) {
    return (message) => {
      // Check if this is a voice message
      if (message.type === 'voice' || (message.audioData && message.audioData.type === 'voice')) {
        return this.createVoiceMessageElement(message);
      }

      // For regular messages, use the original function
      return createMessageElementFn(message);
    };
  }
}

// Export the VoiceMessageHandler class
window.VoiceMessageHandler = VoiceMessageHandler;
