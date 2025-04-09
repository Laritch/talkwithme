"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Tool = "pencil" | "eraser" | "text" | "rectangle" | "circle" | "line";
type DrawingSettings = {
  lineWidth: number;
  strokeStyle: string;
  fillStyle: string;
  tool: Tool;
};

const WhiteboardCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [settings, setSettings] = useState<DrawingSettings>({
    lineWidth: 3,
    strokeStyle: "#000000",
    fillStyle: "rgba(0, 0, 0, 0.1)",
    tool: "pencil",
  });

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Previous mouse positions
  const lastX = useRef<number>(0);
  const lastY = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match parent container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Save initial state
    saveState();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Save current state to history
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();

    // If we're in the middle of the history and draw something new,
    // we need to remove all the future states
    if (historyIndex < history.length - 1) {
      setHistory(prevHistory => prevHistory.slice(0, historyIndex + 1));
    }

    setHistory(prevHistory => [...prevHistory, dataURL]);
    setHistoryIndex(prevIndex => prevIndex + 1);
  };

  // Restore canvas to a specific state
  const restoreState = (index: number) => {
    if (index < 0 || index >= history.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = history[index];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    setHistoryIndex(index);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      restoreState(historyIndex - 1);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      restoreState(historyIndex + 1);
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  // Start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    lastX.current = x;
    lastY.current = y;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = settings.lineWidth;
      ctx.strokeStyle = settings.tool === "eraser" ? "#ffffff" : settings.strokeStyle;
      ctx.fillStyle = settings.fillStyle;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  // Draw
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (settings.tool === "pencil" || settings.tool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (settings.tool === "line") {
      // For line tool, continuously redraw from the initial point
      const initialX = lastX.current;
      const initialY = lastY.current;

      // Clear the canvas to the last saved state
      if (historyIndex >= 0) {
        const img = new Image();
        img.src = history[historyIndex];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }

      // Draw the line from initial point to current point
      ctx.beginPath();
      ctx.moveTo(initialX, initialY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  // End drawing
  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  // Handle tool selection
  const handleToolChange = (tool: Tool) => {
    setSettings(prev => ({ ...prev, tool }));
  };

  // Handle color selection
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSettings(prev => ({ ...prev, strokeStyle: color }));
  };

  // Handle line width selection
  const handleLineWidthChange = (width: number) => {
    setSettings(prev => ({ ...prev, lineWidth: width }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white dark:bg-gray-800 p-2 border-b flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={settings.tool === "pencil" ? "default" : "outline"}
            onClick={() => handleToolChange("pencil")}
          >
            ✏️ Pencil
          </Button>
          <Button
            size="sm"
            variant={settings.tool === "eraser" ? "default" : "outline"}
            onClick={() => handleToolChange("eraser")}
          >
            🧹 Eraser
          </Button>
          <Button
            size="sm"
            variant={settings.tool === "line" ? "default" : "outline"}
            onClick={() => handleToolChange("line")}
          >
            📏 Line
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="color-picker" className="text-sm">Color:</label>
          <input
            id="color-picker"
            type="color"
            value={settings.strokeStyle}
            onChange={handleColorChange}
            className="w-8 h-8 p-0 border-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="line-width" className="text-sm">Width:</label>
          <select
            id="line-width"
            value={settings.lineWidth}
            onChange={(e) => handleLineWidthChange(Number(e.target.value))}
            className="text-sm p-1 rounded border"
          >
            <option value="1">Thin</option>
            <option value="3">Medium</option>
            <option value="5">Thick</option>
            <option value="10">Very Thick</option>
          </select>
        </div>

        <div className="flex-grow"></div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            ↩️ Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            ↪️ Redo
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            🗑️ Clear
          </Button>
        </div>
      </div>

      <div className="flex-grow relative bg-white">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default WhiteboardCanvas;
