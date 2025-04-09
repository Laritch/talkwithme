"use client";

import { useState, useEffect } from 'react';

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  startTime: number | null;
}

export interface RecordedSession {
  id: string;
  title: string;
  date: string;
  duration: number;
  thumbnailUrl: string | null;
  summary: string | null;
  keypoints: string[];
  recordingUrl: string | null;
}

interface SessionRecorderProps {
  sessionTitle: string;
  onSave: (session: RecordedSession) => void;
  elements: any[]; // This would be your WhiteboardElement[] type
}

export default function SessionRecorder({ sessionTitle, onSave, elements }: SessionRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    startTime: null,
  });
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [recordingSnapshot, setRecordingSnapshot] = useState<any[]>([]);

  // Start recording
  const startRecording = () => {
    setRecordingState({
      isRecording: true,
      duration: 0,
      startTime: Date.now(),
    });

    // Take a snapshot of current elements to start recording
    setRecordingSnapshot([...elements]);
  };

  // Stop recording and generate summary
  const stopRecording = async () => {
    if (!recordingState.startTime) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - recordingState.startTime) / 1000);

    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      duration,
    }));

    // Take final snapshot
    const finalSnapshot = [...elements];

    // Generate AI summary
    setGeneratingSummary(true);
    await generateSessionSummary(finalSnapshot);
  };

  // Generate summary (mock AI processing)
  const generateSessionSummary = async (finalElements: any[]) => {
    // In a real implementation, this would call an AI service
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract text from text elements
    const textElements = finalElements.filter(el => el.type === 'text').map(el => el.text);

    // Count element types
    const elementCounts = finalElements.reduce((acc: Record<string, number>, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {});

    // Mock AI-generated summary
    let summary = `This ${sessionTitle} covered multiple topics`;
    if (textElements.length > 0) {
      summary += ` including ${textElements.slice(0, 3).join(', ')}`;
      if (textElements.length > 3) {
        summary += ` and ${textElements.length - 3} more points`;
      }
    }
    summary += '.';

    // Mock AI-generated key points
    const keypoints = [
      'Collaborative brainstorming session with multiple participants',
      `Created ${elementCounts.rectangle || 0} rectangles, ${elementCounts.ellipse || 0} ellipses, and ${elementCounts.text || 0} text elements`,
      'Main focus areas identified and prioritized',
      'Action items assigned to team members'
    ];

    // Create session record
    const session: RecordedSession = {
      id: `session-${Date.now()}`,
      title: sessionTitle,
      date: new Date().toISOString(),
      duration: recordingState.duration,
      thumbnailUrl: null, // In a real implementation, this would be a snapshot of the whiteboard
      summary,
      keypoints,
      recordingUrl: null, // In a real implementation, this would be a URL to the recording
    };

    // Save session
    onSave(session);
    setGeneratingSummary(false);
  };

  // Update duration during recording
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingState.isRecording && recordingState.startTime) {
      interval = setInterval(() => {
        const currentDuration = Math.floor((Date.now() - recordingState.startTime!) / 1000);
        setRecordingState(prev => ({
          ...prev,
          duration: currentDuration,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState.isRecording, recordingState.startTime]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-zinc-200 mt-4 pt-4">
      <h3 className="font-medium mb-2">Session Recording</h3>

      {!recordingState.isRecording && !generatingSummary ? (
        <button
          onClick={startRecording}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md flex items-center justify-center"
          disabled={generatingSummary}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="6" />
          </svg>
          Start Recording
        </button>
      ) : recordingState.isRecording ? (
        <div>
          <div className="text-center mb-2 text-red-600 animate-pulse font-medium flex items-center justify-center">
            <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
            Recording: {formatDuration(recordingState.duration)}
          </div>
          <button
            onClick={stopRecording}
            className="w-full py-2 px-4 bg-zinc-800 text-white rounded-md"
          >
            Stop & Generate Summary
          </button>
        </div>
      ) : (
        <div className="text-center py-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-zinc-600">Generating AI summary...</p>
        </div>
      )}

      {!recordingState.isRecording && recordingState.duration > 0 && !generatingSummary && (
        <div className="mt-2 text-center text-sm text-zinc-500">
          Last recording: {formatDuration(recordingState.duration)}
        </div>
      )}

      <div className="mt-4 text-xs text-zinc-500">
        Session recording captures whiteboard changes and generates an AI summary of key points discussed.
      </div>
    </div>
  );
}
