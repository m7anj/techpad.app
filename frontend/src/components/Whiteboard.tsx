import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getStroke } from "perfect-freehand";
import "./Whiteboard.css";

interface WhiteboardProps {
  onChange?: (lines: any[]) => void;
}

export interface WhiteboardRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  ({ onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lines, setLines] = useState<any[]>([]);
    const [currentLine, setCurrentLine] = useState<any[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [history, setHistory] = useState<any[][]>([]);

    // Set canvas size on mount and when container becomes visible
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const updateSize = () => {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;
          canvas.style.width = rect.width + "px";
          canvas.style.height = rect.height + "px";
          setCanvasSize({ width: rect.width, height: rect.height });
        }
      };

      // Initial size
      updateSize();

      // Retry after delays for when component becomes visible
      const timeout1 = setTimeout(updateSize, 100);
      const timeout2 = setTimeout(updateSize, 500);

      // Watch for resize
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        resizeObserver.disconnect();
      };
    }, []);

    // Redraw canvas whenever lines change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas with dark background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all lines
      [...lines, currentLine.length > 0 ? currentLine : []].forEach((line) => {
        if (line.length < 2) return;

        const stroke = getStroke(line, {
          size: 4,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        });

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();

        if (stroke.length) {
          ctx.moveTo(stroke[0][0], stroke[0][1]);

          for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i][0], stroke[i][1]);
          }

          ctx.closePath();
          ctx.fill();
        }
      });
    }, [lines, currentLine]);

    const getPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];

      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5];
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      setCurrentLine([getPoint(e)]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      setCurrentLine([...currentLine, getPoint(e)]);
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (currentLine.length > 0) {
        const newLines = [...lines, currentLine];
        setHistory([...history, lines]);
        setLines(newLines);
        setCurrentLine([]);
        onChange?.(newLines);
      }
    };

    const clearCanvas = () => {
      setHistory([...history, lines]);
      setLines([]);
      setCurrentLine([]);
      onChange?.([]);
    };

    const undo = () => {
      if (history.length === 0) return;
      const previousState = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setLines(previousState);
      onChange?.(previousState);
    };

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          undo();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, lines]);

    return (
      <div ref={containerRef} className="whiteboard-container">
        <div className="whiteboard-controls">
          <button onClick={clearCanvas} className="whiteboard-clear">
            Clear
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="whiteboard-canvas"
        />
      </div>
    );
  },
);
