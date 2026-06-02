import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Whiteboard({ initialDrawing, onSave, onExit }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#f8fafc");
  const [thickness, setThickness] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [tool, setTool] = useState("pen"); // "pen", "eraser", or "text"
  
  // Use refs for synchronous history tracking
  const historyRef = useRef([]);
  const redoHistoryRef = useRef([]);
  
  // Use state just to trigger re-renders for button enable/disable
  const [historyLength, setHistoryLength] = useState(0);
  const [redoLength, setRedoLength] = useState(0);

  // Text Overlay state
  const [textOverlay, setTextOverlay] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: ""
  });
  
  // Dragging state for text overlay
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const textInputRef = useRef(null);
  const toolRef = useRef(tool);

  // Keep toolRef in sync
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const updateHistoryState = () => {
    setHistoryLength(historyRef.current.length);
    setRedoLength(redoHistoryRef.current.length);
  };

  // Helper: get canvas-relative coordinates from a touch event
  const getTouchPos = (touchEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
    return {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top
    };
  };

  // Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.textBaseline = "top";
    contextRef.current = context;
    
    // Fill background
    context.fillStyle = "#1e293b"; 
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (initialDrawing) {
      const img = new Image();
      img.src = initialDrawing.dataURL;
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL();
        historyRef.current = [data];
        redoHistoryRef.current = [];
        updateHistoryState();
      };
    } else {
      const data = canvas.toDataURL();
      historyRef.current = [data];
      redoHistoryRef.current = [];
      updateHistoryState();
    }

    // ─── Touch event handlers (attached directly to canvas for passive:false) ───
    const handleTouchStart = (e) => {
      e.preventDefault(); // Prevent scrolling while drawing
      if (toolRef.current === "text") return;

      saveStateToHistory();
      const { offsetX, offsetY } = getTouchPos(e);
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      isDrawingRef.current = true;
      setIsDrawing(true);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!isDrawingRef.current || toolRef.current === "text") return;
      const { offsetX, offsetY } = getTouchPos(e);
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      if (toolRef.current === "text") return;
      contextRef.current.closePath();
      isDrawingRef.current = false;
      setIsDrawing(false);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [initialDrawing]);

  // Update stroke style based on tool/color/thickness
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "#1e293b" : color;
      contextRef.current.lineWidth = thickness;
    }
  }, [color, thickness, tool]);

  // Focus the text input when it becomes visible
  useEffect(() => {
    if (textOverlay.visible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textOverlay.visible]);

  const drawToCanvas = (dataURL) => {
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return; 
    
    const currentState = historyRef.current.pop(); 
    redoHistoryRef.current.push(currentState);
    
    const previousStateURL = historyRef.current[historyRef.current.length - 1]; 
    drawToCanvas(previousStateURL);
    
    updateHistoryState();
  };

  const handleRedo = () => {
    if (redoHistoryRef.current.length === 0) return;
    
    const nextStateURL = redoHistoryRef.current.pop(); 
    historyRef.current.push(nextStateURL);
    
    drawToCanvas(nextStateURL);
    
    updateHistoryState();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); 

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    historyRef.current.push(data);
    redoHistoryRef.current = []; 
    updateHistoryState();
  };

  const finalizeText = () => {
    if (textOverlay.visible && textOverlay.value.trim() !== "") {
      saveStateToHistory();

      const context = contextRef.current;
      context.font = `${fontSize}px Inter, sans-serif`;
      context.fillStyle = color;
      
      context.fillText(textOverlay.value, textOverlay.x + 4, textOverlay.y + 4);
    }
    
    setTextOverlay({ visible: false, x: 0, y: 0, value: "" });
  };

  const startInteraction = ({ nativeEvent }) => {
    if (tool === "text") {
      if (textOverlay.visible) {
        finalizeText();
      } else {
        const { offsetX, offsetY } = nativeEvent;
        setTextOverlay({
          visible: true,
          x: offsetX,
          y: offsetY,
          value: ""
        });
      }
      return;
    }

    // Capture state BEFORE drawing new stroke
    saveStateToHistory();

    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (tool === "text") return;
    contextRef.current.closePath();
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawingRef.current || tool === "text") return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    saveStateToHistory(); 
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = "#1e293b";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (textOverlay.visible) {
      finalizeText();
      setTimeout(() => {
        saveFinal();
      }, 0);
    } else {
      saveFinal();
    }
  };

  const saveFinal = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    onSave({
      id: initialDrawing ? initialDrawing.id : uuidv4(),
      dataURL,
      createdAt: initialDrawing ? initialDrawing.createdAt : new Date().toISOString()
    });
  }

  // Text Overlay Drag Handlers (mouse)
  const handleTextMouseDown = (e) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: textOverlay.x,
      initialY: textOverlay.y
    };
    e.stopPropagation();
  };

  const handleTextMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    setTextOverlay(prev => ({
      ...prev,
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    }));
  };

  const handleTextMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  // Text Overlay Drag Handlers (touch)
  const handleTextTouchStart = (e) => {
    const touch = e.touches[0];
    dragRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: textOverlay.x,
      initialY: textOverlay.y
    };
    e.stopPropagation();
  };

  const handleTextTouchMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    
    setTextOverlay(prev => ({
      ...prev,
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    }));
  };

  const handleTextTouchEnd = () => {
    dragRef.current.isDragging = false;
  };

  // Attach global listeners for dragging the text box smoothly
  useEffect(() => {
    if (textOverlay.visible) {
      window.addEventListener('mousemove', handleTextMouseMove);
      window.addEventListener('mouseup', handleTextMouseUp);
      window.addEventListener('touchmove', handleTextTouchMove, { passive: false });
      window.addEventListener('touchend', handleTextTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleTextMouseMove);
      window.removeEventListener('mouseup', handleTextMouseUp);
      window.removeEventListener('touchmove', handleTextTouchMove);
      window.removeEventListener('touchend', handleTextTouchEnd);
    };
  }, [textOverlay.visible]);

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-toolbar">
        <button className="btn btn-secondary btn-sm-mobile" onClick={onExit}>
          ← Exit
        </button>

        <div className="toolbar-group" style={{ marginLeft: "0.5rem" }}>
          <button 
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => { setTool('pen'); finalizeText(); }}
          >
            ✏️ <span className="hide-mobile">Pen</span>
          </button>
          <button 
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => { setTool('eraser'); finalizeText(); }}
          >
            🧽 <span className="hide-mobile">Eraser</span>
          </button>
          <button 
            className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
          >
            🔤 <span className="hide-mobile">Text</span>
          </button>
        </div>

        {(tool === 'pen' || tool === 'text') && (
          <div className="toolbar-group">
            <label className="hide-mobile">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color-picker"
            />
          </div>
        )}

        {tool !== 'text' && (
          <div className="toolbar-group">
            <label><span className="hide-mobile">Thickness: </span>{thickness}px</label>
            <input
              type="range"
              min="1"
              max="40"
              value={thickness}
              onChange={(e) => setThickness(parseInt(e.target.value))}
            />
          </div>
        )}

        {tool === 'text' && (
          <div className="toolbar-group">
            <label><span className="hide-mobile">Font: </span>{fontSize}px</label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
          </div>
        )}
        
        <div className="toolbar-actions">
          <button 
            className="btn btn-secondary btn-sm-mobile" 
            onClick={handleUndo}
            disabled={historyLength <= 1}
            title="Undo (Ctrl+Z)"
          >
            ↩️ <span className="hide-mobile">Undo</span>
          </button>
          <button 
            className="btn btn-secondary btn-sm-mobile" 
            onClick={handleRedo}
            disabled={redoLength === 0}
            title="Redo (Ctrl+Y)"
          >
            ↪️ <span className="hide-mobile">Redo</span>
          </button>
          <button className="btn btn-danger btn-sm-mobile" onClick={clearCanvas}>
            <span className="hide-mobile">Clear</span><span className="show-mobile">🗑️</span>
          </button>
          <button className="btn btn-primary btn-sm-mobile" onClick={handleSave}>
            💾 <span className="hide-mobile">{initialDrawing ? "Update Note" : "Save to Note"}</span><span className="show-mobile">Save</span>
          </button>
        </div>
      </div>
      
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startInteraction}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
        />
        
        {textOverlay.visible && (
          <textarea
            ref={textInputRef}
            className="text-overlay"
            value={textOverlay.value}
            onChange={(e) => setTextOverlay({...textOverlay, value: e.target.value})}
            onMouseDown={handleTextMouseDown}
            onTouchStart={handleTextTouchStart}
            placeholder="Type something..."
            style={{
              left: textOverlay.x,
              top: textOverlay.y,
              fontSize: `${fontSize}px`,
              color: color
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                finalizeText();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
