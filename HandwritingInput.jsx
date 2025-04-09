import React, { useState, useRef, useEffect } from 'react';
import {
  initHandwritingRecognition,
  recognizeHandwriting,
  canvasToStrokes,
  isHandwritingRecognitionAvailable
} from '../i18n/HandwritingRecognition';
import './HandwritingInput.css';

/**
 * HandwritingInput component
 *
 * A canvas-based handwriting input component that allows users to
 * write text with their finger or mouse and have it recognized.
 */
const HandwritingInput = ({
  language = 'en',
  onTextRecognized,
  placeholder = 'Write here...',
  height = 200
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [allStrokes, setAllStrokes] = useState([]);

  // Initialize handwriting recognition
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await initHandwritingRecognition();
      setIsAvailable(available);
    };

    checkAvailability();
  }, []);

  // Set up canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    // Clear canvas initially
    clearCanvas();

    // Handle resize
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = height;

      // Restore drawing context settings after resize
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';

      // Redraw all strokes
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [height, allStrokes]);

  // Handle mouse/touch events
  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    setIsDrawing(true);
    setHasContent(true);

    // Start a new path
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);

    // Start a new stroke
    setCurrentStroke([{
      x: offsetX,
      y: offsetY,
      time: Date.now()
    }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    // Draw the line
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    // Add to current stroke
    setCurrentStroke(prev => [
      ...prev,
      {
        x: offsetX,
        y: offsetY,
        time: Date.now()
      }
    ]);
  };

  const endDrawing = () => {
    if (!isDrawing) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);

    // Add completed stroke to all strokes
    if (currentStroke.length > 0) {
      setAllStrokes(prev => [...prev, { points: currentStroke }]);
      setCurrentStroke([]);
    }
  };

  // Get coordinates from mouse or touch event
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    let offsetX, offsetY;

    if (e.type.includes('touch')) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      offsetX = e.nativeEvent.offsetX;
      offsetY = e.nativeEvent.offsetY;
    }

    return { offsetX, offsetY };
  };

  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    setAllStrokes([]);
    setCurrentStroke([]);
  };

  // Redraw all strokes (e.g., after resize)
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw each stroke
    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
      ctx.closePath();
    });
  };

  // Recognize the handwritten text
  const recognizeText = async () => {
    if (!hasContent || isRecognizing) return;

    setIsRecognizing(true);

    try {
      // Use the strokes data for recognition
      const result = await recognizeHandwriting(allStrokes, language);

      if (onTextRecognized) {
        onTextRecognized(result.text, result);
      }

      // Clear after successful recognition
      clearCanvas();
    } catch (error) {
      console.error('Handwriting recognition failed:', error);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Upload an image for recognition
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Process the image file... (implementation would go here)
    // For now, just notify that this feature is coming soon
    alert('Image recognition coming soon!');
  };

  if (!isAvailable) {
    return (
      <div className="handwriting-input handwriting-unavailable">
        <p>Handwriting recognition is not available in this browser or is disabled.</p>
      </div>
    );
  }

  return (
    <div className="handwriting-input">
      <div className="handwriting-canvas-container">
        {!hasContent && (
          <div className="handwriting-placeholder">{placeholder}</div>
        )}
        <canvas
          ref={canvasRef}
          className="handwriting-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          height={height}
        />
      </div>

      <div className="handwriting-controls">
        <button
          className="handwriting-button clear"
          onClick={clearCanvas}
          disabled={!hasContent || isRecognizing}
        >
          Clear
        </button>
        <button
          className="handwriting-button recognize"
          onClick={recognizeText}
          disabled={!hasContent || isRecognizing}
        >
          {isRecognizing ? 'Recognizing...' : 'Recognize'}
        </button>

        <div className="handwriting-upload">
          <label htmlFor="image-upload" className="handwriting-button upload">
            Upload Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isRecognizing}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default HandwritingInput;
