'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface VideoChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  isPeer?: boolean;
  onSessionEnd?: () => void;
}

const VideoChat: React.FC<VideoChatProps> = ({
  sessionId,
  userId,
  userName,
  isPeer = false,
  onSessionEnd,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // WebRTC connection objects
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Initialize the video chat
  useEffect(() => {
    const initializeVideoChat = async () => {
      try {
        // Set up peer connection with STUN servers
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });

        // Get local media stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Add tracks to peer connection
        mediaStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, mediaStream);
        });

        // Set up event handlers for remote stream
        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteStreamRef.current = event.streams[0];
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            // In a real implementation, you would send this to the signaling server
            console.log('New ICE candidate', event.candidate);
          }
        };

        // Connection state change
        peerConnection.onconnectionstatechange = () => {
          if (peerConnection.connectionState === 'connected') {
            setIsConnected(true);
            setConnectionError(null);
          } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
            setIsConnected(false);
            if (peerConnection.connectionState === 'failed') {
              setConnectionError('Connection failed. Please try reconnecting.');
            }
          }
        };

        // Store references
        peerConnectionRef.current = peerConnection;
        localStreamRef.current = mediaStream;

        // Initiate connection based on role
        if (isPeer) {
          // Create offer (for the initiating peer)
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          // In a real implementation, send the offer to the signaling server
        }

        // Clean up on unmount
        return () => {
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }

          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
        };
      } catch (error) {
        console.error('Failed to initialize video chat:', error);
        setConnectionError('Failed to access camera or microphone. Please check your permissions.');
      }
    };

    initializeVideoChat();
  }, [sessionId, userId, isPeer]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        // Revert to camera
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          videoTracks.forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Replace tracks in the peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender =>
            sender.track?.kind === 'video'
          );

          if (videoSender && mediaStream.getVideoTracks()[0]) {
            videoSender.replaceTrack(mediaStream.getVideoTracks()[0]);
          }
        }

        localStreamRef.current = mediaStream;
        setIsScreenSharing(false);
      } else {
        // Switch to screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        // Replace video track in the peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender =>
            sender.track?.kind === 'video'
          );

          if (videoSender && displayStream.getVideoTracks()[0]) {
            videoSender.replaceTrack(displayStream.getVideoTracks()[0]);
          }
        }

        // Keep audio from existing stream
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            displayStream.addTrack(audioTrack);
          }
        }

        // Listen for the end of screen sharing
        displayStream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing();
        };

        localStreamRef.current = displayStream;
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  // End the call
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (onSessionEnd) {
      onSessionEnd();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Video Consultation Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionError && (
          <div className="bg-destructive/20 text-destructive p-2 rounded-md text-sm">
            {connectionError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-auto bg-muted rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
              You ({userName})
            </div>
          </div>

          {/* Remote video */}
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-auto bg-muted rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
              {isConnected ? 'Connected' : 'Waiting for connection...'}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex space-x-2">
          <Button
            variant={isMuted ? "default" : "outline"}
            size="icon"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </Button>

          <Button
            variant={isVideoEnabled ? "outline" : "default"}
            size="icon"
            onClick={toggleVideo}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? "📹" : "🚫"}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            onClick={toggleScreenSharing}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            💻
          </Button>
        </div>

        <Button
          variant="destructive"
          onClick={endCall}
        >
          End Call
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VideoChat;
