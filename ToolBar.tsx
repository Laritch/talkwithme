import { ElementType } from '../types';
import useWhiteboardStore from '../store/useWhiteboardStore';

const ToolBar = () => {
  const {
    tool,
    setTool,
    strokeColor,
    setStrokeColor,
    backgroundColor,
    setBackgroundColor,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    roughness,
    setRoughness,
    undo,
    redo,
    clearWhiteboard,
  } = useWhiteboardStore();

  return (
    <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 bg-white">
      <div className="flex items-center space-x-2">
        <button
          className={`px-3 py-1 border rounded ${
            tool === ElementType.Rectangle ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
          onClick={() => setTool(ElementType.Rectangle)}
          title="Rectangle"
        >
          □
        </button>
        <button
          className={`px-3 py-1 border rounded ${
            tool === ElementType.Ellipse ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
          onClick={() => setTool(ElementType.Ellipse)}
          title="Ellipse"
        >
          ○
        </button>
        <button
          className={`px-3 py-1 border rounded ${
            tool === ElementType.Line ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
          onClick={() => setTool(ElementType.Line)}
          title="Line"
        >
          ━
        </button>
        <button
          className={`px-3 py-1 border rounded ${
            tool === ElementType.Pencil ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
          onClick={() => setTool(ElementType.Pencil)}
          title="Pencil"
        >
          ✎
        </button>
        <button
          className={`px-3 py-1 border rounded ${
            tool === ElementType.Text ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
          onClick={() => setTool(ElementType.Text)}
          title="Text"
        >
          T
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="stroke-color" className="text-sm">Stroke:</label>
        <input
          id="stroke-color"
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="w-8 h-8 border"
        />

        <label htmlFor="bg-color" className="text-sm ml-2">Fill:</label>
        <input
          id="bg-color"
          type="color"
          value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="w-8 h-8 border"
        />
      </div>

      {tool === ElementType.Text && (
        <div className="flex items-center space-x-2">
          <label htmlFor="font-size" className="text-sm">Size:</label>
          <select
            id="font-size"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>

          <label htmlFor="font-family" className="text-sm ml-2">Font:</label>
          <select
            id="font-family"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
      )}

      <div className="flex-grow"></div>

      <div className="flex items-center space-x-2">
        <button
          onClick={undo}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
          title="Undo"
        >
          ↩
        </button>
        <button
          onClick={redo}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
          title="Redo"
        >
          ↪
        </button>
        <button
          onClick={clearWhiteboard}
          className="px-3 py-1 border rounded bg-red-100 hover:bg-red-200 text-red-700"
          title="Clear whiteboard"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ToolBar;
