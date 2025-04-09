import { useRef, useState, useEffect } from 'react';
import useWhiteboardStore from '../store/useWhiteboardStore';
import WhiteboardElement from './WhiteboardElement';
import { ElementType, Point } from '../types';

interface WhiteboardProps {
  width?: number;
  height?: number;
}

const Whiteboard = ({ width = 800, height = 600 }: WhiteboardProps) => {
  const {
    elements,
    tool,
    strokeColor,
    backgroundColor,
    fontSize,
    fontFamily,
    roughness,
    selectedElement,
    setSelectedElement,
    addElement,
    updateElement,
  } = useWhiteboardStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [textInputPosition, setTextInputPosition] = useState<Point | null>(null);

  // Handle mouse down for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    // Get canvas position
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start drawing
    setIsDrawing(true);
    setStartPoint({ x, y });

    // If text tool is selected, show text input
    if (tool === ElementType.Text) {
      setTextInputPosition({ x, y });
      return;
    }

    // For pencil, create a new element immediately
    if (tool === ElementType.Pencil) {
      const newElement = {
        type: tool,
        x,
        y,
        strokeColor,
        backgroundColor,
        points: [{ x: 0, y: 0 }], // First point is relative to element position
      };

      addElement(newElement);
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // For pencil strokes, update the points
    if (tool === ElementType.Pencil && elements.length > 0) {
      const latestElement = elements[elements.length - 1];
      if (latestElement.type === ElementType.Pencil && latestElement.points) {
        const newPoints = [
          ...latestElement.points,
          {
            x: x - latestElement.x,
            y: y - latestElement.y,
          },
        ];
        updateElement(latestElement.id, { points: newPoints });
      }
    }
  };

  // Handle mouse up for drawing
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !canvasRef.current || tool === ElementType.Text) {
      setIsDrawing(false);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create element based on tool
    if (tool !== ElementType.Pencil) {
      const width = Math.abs(x - startPoint.x);
      const height = Math.abs(y - startPoint.y);
      const left = Math.min(x, startPoint.x);
      const top = Math.min(y, startPoint.y);

      const newElement = {
        type: tool,
        x: left,
        y: top,
        width,
        height,
        strokeColor,
        backgroundColor,
        roughness,
      };

      addElement(newElement);
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  // Handle text input
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentText(e.target.value);
  };

  // Handle text input blur
  const handleTextInputBlur = () => {
    if (textInputPosition && currentText.trim()) {
      const newElement = {
        type: ElementType.Text,
        x: textInputPosition.x,
        y: textInputPosition.y,
        strokeColor,
        backgroundColor,
        fontSize,
        fontFamily,
        text: currentText,
      };

      addElement(newElement);
    }

    setTextInputPosition(null);
    setCurrentText('');
  };

  // Handle element selection
  const handleElementClick = (element: React.MouseEvent<HTMLDivElement>) => {
    // Prevent event bubbling to avoid selecting canvas
    element.stopPropagation();
  };

  return (
    <div
      ref={canvasRef}
      className="relative bg-white border border-gray-300 overflow-hidden"
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => setSelectedElement(null)}
    >
      {/* Render all elements */}
      {elements.map((element) => (
        <WhiteboardElement
          key={element.id}
          element={element}
          selected={selectedElement?.id === element.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedElement(element);
          }}
        />
      ))}

      {/* Text input for adding text */}
      {textInputPosition && (
        <input
          type="text"
          autoFocus
          value={currentText}
          onChange={handleTextInput}
          onBlur={handleTextInputBlur}
          className="absolute border border-blue-500 outline-none p-1"
          style={{
            left: textInputPosition.x,
            top: textInputPosition.y,
            color: strokeColor,
            backgroundColor,
            fontSize: `${fontSize}px`,
            fontFamily,
            minWidth: '100px',
          }}
        />
      )}
    </div>
  );
};

export default Whiteboard;
