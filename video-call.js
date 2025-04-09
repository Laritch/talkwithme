/**
 * Video Call System for Service Marketplace
 * Implements WebRTC-based video calling between experts and clients
 */

// Video Call State Management
const callState = {
  // Call configuration
  isInCall: false,
  callStartTime: null,
  callDuration: 0,
  callType: 'video', // 'video' or 'audio'

  // Media state
  localStream: null,
  remoteStream: null,
  screenShareStream: null,
  isMicMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isCaptionsOn: false,

  // UI state
  isChatOpen: false,
  isFullScreen: false,

  // Connection and signaling
  peerConnection: null,
  signallingChannel: null,
  remoteUser: {
    id: 'user-123',
    name: 'Dr. Jessica Chen',
    avatar: '/uploads/default-avatar.png',
    role: 'expert'
  },

  // WebRTC configuration
  configuration: {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      }
    ]
  }
};

// Initialize video call system
document.addEventListener('DOMContentLoaded', () => {
  // Check if we need to show incoming call UI
  // For demo, show it 50% of the time
  if (Math.random() > 0.5) {
    setTimeout(showIncomingCall, 2000);
  } else {
    // Otherwise initialize call directly
    initVideoCall();
  }

  // Set up event listeners
  setupCallControls();
});

// Initialize a video call
async function initVideoCall() {
  try {
    // Show connecting status
    document.getElementById('call-status').style.display = 'block';

    // Set remote user info in UI
    updateRemoteUserUI();

    // Get local media stream (with retry if denied)
    await getLocalMedia();

    // Hide connecting status once we have local media
    document.getElementById('call-status').style.display = 'none';

    // In a real app, we would set up peer connection here
    // For demo, we'll simulate a connected call
    simulateConnectedCall();

    // Start call timer
    startCallTimer();

    callState.isInCall = true;
  } catch (error) {
    console.error('Error initializing call:', error);
    // Show error notification or fallback to audio-only
    alert('Failed to access camera/microphone. Please check permissions.');
  }
}

// Update remote user information in the UI
function updateRemoteUserUI() {
  document.getElementById('remote-name').textContent = callState.remoteUser.name;
  document.getElementById('remote-avatar').src = callState.remoteUser.avatar;
}

// Get local media stream (camera and microphone)
async function getLocalMedia() {
  try {
    // Request access to camera and microphone
    callState.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Display local video stream
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = callState.localStream;

    return callState.localStream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
}

// Simulate a connected call for demo purposes
function simulateConnectedCall() {
  // Simulate remote stream with a local stream copy
  // In a real app, this would come from the peer connection
  callState.remoteStream = callState.localStream;

  // Display "remote" video (which is actually a copy of local video for demo)
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = callState.remoteStream;
}

// Set up call control buttons
function setupCallControls() {
  // Microphone toggle
  document.getElementById('toggle-mic').addEventListener('click', toggleMicrophone);

  // Camera toggle
  document.getElementById('toggle-video').addEventListener('click', toggleVideo);

  // Screen sharing toggle
  document.getElementById('toggle-screenshare').addEventListener('click', toggleScreenShare);

  // Captions toggle
  document.getElementById('toggle-captions').addEventListener('click', toggleCaptions);

  // End call button
  document.getElementById('end-call').addEventListener('click', endCall);

  // Chat toggle
  document.getElementById('toggle-chat-btn').addEventListener('click', toggleChat);
  document.getElementById('close-chat-btn').addEventListener('click', toggleChat);

  // Fullscreen toggle
  document.getElementById('toggle-fullscreen').addEventListener('click', toggleFullScreen);

  // Incoming call buttons
  document.getElementById('accept-call').addEventListener('click', acceptIncomingCall);
  document.getElementById('decline-call').addEventListener('click', declineIncomingCall);
}

// Toggle microphone mute/unmute
function toggleMicrophone() {
  const micButton = document.getElementById('toggle-mic');
  const micIcon = micButton.querySelector('i');

  callState.isMicMuted = !callState.isMicMuted;

  // Update UI
  if (callState.isMicMuted) {
    micButton.classList.add('muted');
    micIcon.className = 'fas fa-microphone-slash';
  } else {
    micButton.classList.remove('muted');
    micIcon.className = 'fas fa-microphone';
  }

  // Mute/unmute audio tracks
  if (callState.localStream) {
    callState.localStream.getAudioTracks().forEach(track => {
      track.enabled = !callState.isMicMuted;
    });
  }
}

// Toggle video on/off
function toggleVideo() {
  const videoButton = document.getElementById('toggle-video');
  const videoIcon = videoButton.querySelector('i');

  callState.isVideoOff = !callState.isVideoOff;

  // Update UI
  if (callState.isVideoOff) {
    videoButton.classList.add('disabled');
    videoIcon.className = 'fas fa-video-slash';
    document.getElementById('local-video-container').style.backgroundColor = '#333';
  } else {
    videoButton.classList.remove('disabled');
    videoIcon.className = 'fas fa-video';
    document.getElementById('local-video-container').style.backgroundColor = 'transparent';
  }

  // Enable/disable video tracks
  if (callState.localStream) {
    callState.localStream.getVideoTracks().forEach(track => {
      track.enabled = !callState.isVideoOff;
    });
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  const screenShareButton = document.getElementById('toggle-screenshare');
  const screenShareIcon = screenShareButton.querySelector('i');

  // Handle stopping screen share
  if (callState.isScreenSharing) {
    callState.isScreenSharing = false;
    screenShareButton.classList.remove('active');
    screenShareIcon.className = 'fas fa-desktop';

    // Stop screen share stream tracks
    if (callState.screenShareStream) {
      callState.screenShareStream.getTracks().forEach(track => track.stop());
      callState.screenShareStream = null;
    }

    // Hide screen share layout and show normal call view
    document.getElementById('screenshare-grid').style.display = 'none';
    document.getElementById('call-videos').style.display = 'flex';

    return;
  }

  // Start screen sharing
  try {
    callState.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    // Update UI
    callState.isScreenSharing = true;
    screenShareButton.classList.add('active');
    screenShareIcon.className = 'fas fa-stop-circle';

    // Show screen share layout
    document.getElementById('screenshare-preview').srcObject = callState.screenShareStream;
    document.getElementById('screenshare-grid').style.display = 'grid';
    document.getElementById('call-videos').style.display = 'none';
    document.getElementById('shared-by').textContent = `Screen shared by You`;

    // Handle user stopping screen share through browser UI
    callState.screenShareStream.getVideoTracks()[0].onended = () => {
      toggleScreenShare();
    };
  } catch (error) {
    console.error('Error starting screen share:', error);
    // User cancelled or error occurred
    callState.isScreenSharing = false;
  }
}

// Toggle closed captions
function toggleCaptions() {
  const captionsButton = document.getElementById('toggle-captions');

  callState.isCaptionsOn = !callState.isCaptionsOn;

  // Update UI
  if (callState.isCaptionsOn) {
    captionsButton.classList.add('active');
    // In a real app, we would start speech recognition here
    showNotification('Captions are not implemented in this demo');
  } else {
    captionsButton.classList.remove('active');
  }
}

// Toggle chat panel
function toggleChat() {
  const chatPanel = document.getElementById('chat-panel');

  callState.isChatOpen = !callState.isChatOpen;

  if (callState.isChatOpen) {
    chatPanel.classList.add('open');
  } else {
    chatPanel.classList.remove('open');
  }
}

// Toggle fullscreen mode
function toggleFullScreen() {
  const fullScreenButton = document.getElementById('toggle-fullscreen');
  const fullScreenIcon = fullScreenButton.querySelector('i');

  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
    fullScreenIcon.className = 'fas fa-compress';
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
      fullScreenIcon.className = 'fas fa-expand';
    }
  }
}

// End the current call
function endCall() {
  // Stop all media streams
  if (callState.localStream) {
    callState.localStream.getTracks().forEach(track => track.stop());
  }

  if (callState.screenShareStream) {
    callState.screenShareStream.getTracks().forEach(track => track.stop());
  }

  // Close peer connection in a real app
  if (callState.peerConnection) {
    callState.peerConnection.close();
  }

  // Stop call timer
  stopCallTimer();

  // Redirect back to appropriate page
  const userRole = getQueryParam('role') || 'client';
  if (userRole === 'expert') {
    window.location.href = '/expert-dashboard.html';
  } else if (userRole === 'admin') {
    window.location.href = '/admin-dashboard.html';
  } else {
    window.location.href = '/index.html';
  }
}

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '1000';
  notification.textContent = message;

  // Add to body
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Start call timer
function startCallTimer() {
  callState.callStartTime = new Date();
  updateCallDuration();

  // Update duration every second
  callState.durationInterval = setInterval(updateCallDuration, 1000);
}

// Update call duration display
function updateCallDuration() {
  if (!callState.callStartTime) return;

  const now = new Date();
  const diffSeconds = Math.floor((now - callState.callStartTime) / 1000);
  callState.callDuration = diffSeconds;

  // Format as mm:ss
  const minutes = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
  const seconds = (diffSeconds % 60).toString().padStart(2, '0');
  document.getElementById('call-duration').textContent = `${minutes}:${seconds}`;
}

// Stop call timer
function stopCallTimer() {
  clearInterval(callState.durationInterval);
}

// Show incoming call UI
function showIncomingCall() {
  const incomingCall = document.getElementById('incoming-call');
  incomingCall.style.display = 'block';

  // Set caller info
  document.getElementById('caller-name').textContent = callState.remoteUser.name;
  document.getElementById('caller-avatar').src = callState.remoteUser.avatar;
  document.getElementById('call-type').textContent = 'Video Call';

  // Play ringtone (in a real app)
  playIncomingCallSound();
}

// Play incoming call sound
function playIncomingCallSound() {
  // In a real app, we would play a ringtone here
  console.log('Playing ringtone...');
}

// Accept incoming call
function acceptIncomingCall() {
  document.getElementById('incoming-call').style.display = 'none';
  initVideoCall();
}

// Decline incoming call
function declineIncomingCall() {
  document.getElementById('incoming-call').style.display = 'none';
  // In a real app, we would send a decline signal to the caller

  // Redirect back to previous page
  window.history.back();
}

// Helper function to get query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
