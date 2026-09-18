import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  Maximize2,
  AlertTriangle,
  Move,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import TShirtMockupSVG from './TShirtMockupSVG';

/**
 * Interactive Design Studio Canvas
 * Features:
 * - Front & Back view rendering with printable boundary guide (dotted box)
 * - Interactive element selection, drag-to-move, scale, rotate
 * - Snap-to-center alignment guides (vertical & horizontal)
 * - Low-resolution warning indicator for images
 * - Curved text rendering support
 * - Touch & Mouse gesture handling
 */
const DesignStudioCanvas = ({
  color = '#111827',
  shirtType = 'round_neck',
  view = 'front',
  elements = [],
  selectedId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  onDeleteElement = () => {},
  showPrintBoundary = true,
}) => {
  const containerRef = useRef(null);
  const printableAreaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [snapGuides, setSnapGuides] = useState({ v: false, h: false });

  // Currently selected element object
  const selectedElement = elements.find((el) => el.id === selectedId);

  // Helper to convert screen coordinates into printable-area relative coordinates
  const getRelativePointer = (clientX, clientY) => {
    if (!printableAreaRef.current) return { x: 0, y: 0 };
    const rect = printableAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return {
      x: clientX - centerX,
      y: clientY - centerY,
      rectWidth: rect.width,
      rectHeight: rect.height
    };
  };

  // --- DRAG MOVE HANDLER ---
  const handlePointerDown = (e, element, action = 'move') => {
    e.stopPropagation();
    onSelectElement(element.id);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
    setInitialTransform({
      x: element.x || 0,
      y: element.y || 0,
      scale: element.scale || 1,
      rotation: element.rotation || 0
    });

    if (action === 'move') setIsDragging(true);
    if (action === 'resize') setIsResizing(true);
    if (action === 'rotate') setIsRotating(true);
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging && !isResizing && !isRotating) return;
      if (!selectedElement || !printableAreaRef.current) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;

        let newX = initialTransform.x + deltaX;
        let newY = initialTransform.y + deltaY;

        // Snap to Center Guide Logic (within 6px threshold)
        const snapThreshold = 6;
        let showVGuide = false;
        let showHGuide = false;

        if (Math.abs(newX) < snapThreshold) {
          newX = 0;
          showVGuide = true;
        }

        if (Math.abs(newY) < snapThreshold) {
          newY = 0;
          showHGuide = true;
        }

        setSnapGuides({ v: showVGuide, h: showHGuide });
        onUpdateElement(selectedElement.id, { x: newX, y: newY });
      } else if (isResizing) {
        const deltaY = clientY - dragStart.y;
        const scaleChange = -deltaY * 0.008;
        const newScale = Math.min(Math.max(0.3, initialTransform.scale + scaleChange), 3.5);
        onUpdateElement(selectedElement.id, { scale: newScale });
      } else if (isRotating) {
        const rel = getRelativePointer(clientX, clientY);
        const rad = Math.atan2(rel.y - initialTransform.y, rel.x - initialTransform.x);
        let deg = Math.round((rad * 180) / Math.PI);
        if (deg < 0) deg += 360;
        // Snap to 0/90/180/270deg
        if (Math.abs(deg % 90) < 4 || Math.abs((deg % 90) - 90) < 4) {
          deg = Math.round(deg / 90) * 90;
        }
        onUpdateElement(selectedElement.id, { rotation: deg });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setSnapGuides({ v: false, h: false });
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, initialTransform, selectedElement]);

  // Click canvas background to deselect
  const handleCanvasClick = (e) => {
    if (e.target === printableAreaRef.current || e.target.classList.contains('canvas-backdrop')) {
      onSelectElement(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[480px] aspect-[1/1.05] mx-auto select-none overflow-hidden bg-[#F4F1EA] p-2"
      onClick={handleCanvasClick}
    >
      {/* T-Shirt SVG Graphic */}
      <TShirtMockupSVG color={color} shirtType={shirtType} view={view}>
        {/* Printable Boundary Box */}
        <div
          ref={printableAreaRef}
          className={`absolute left-[24%] top-[18%] w-[52%] h-[58%] rounded-sm transition-all duration-300 flex items-center justify-center ${
            showPrintBoundary
              ? 'border-2 border-dashed border-ink-900/60 bg-ink-900/[0.03]'
              : 'border-transparent'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Printable Area Badge */}
          {showPrintBoundary && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-900 bg-ink-950/90 rounded-full border border-line shadow-sm pointer-events-none">
              Printable Area ({view})
            </span>
          )}

          {/* Snap-to-center Vertical Guide */}
          {snapGuides.v && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-clay-500 z-50 pointer-events-none -translate-x-1/2 animate-pulse" />
          )}

          {/* Snap-to-center Horizontal Guide */}
          {snapGuides.h && (
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-clay-500 z-50 pointer-events-none -translate-y-1/2 animate-pulse" />
          )}

          {/* Render Elements inside Printable Area */}
          {elements.map((el) => {
            const isSelected = el.id === selectedId;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handlePointerDown(e, el, 'move')}
                onTouchStart={(e) => handlePointerDown(e, el, 'move')}
                className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${
                  isSelected ? 'ring-2 ring-ink-900 ring-offset-2 ring-offset-white' : 'hover:outline hover:outline-1 hover:outline-clay-500/60'
                }`}
                style={{
                  transform: `translate(${el.x || 0}px, ${el.y || 0}px) scale(${el.scale || 1}) rotate(${
                    el.rotation || 0
                  }deg)`,
                  zIndex: el.zIndex || 10,
                  transformOrigin: 'center center',
                  touchAction: 'none',
                }}
              >
                {/* Image Element */}
                {el.type === 'image' && (
                  <div className="relative group">
                    <img
                      src={el.url}
                      alt="Uploaded graphics"
                      className="max-w-[160px] max-h-[160px] object-contain rounded-sm drop-shadow-md"
                      draggable={false}
                    />
                    {/* Low resolution warning badge */}
                    {el.lowResWarning && (
                      <div
                        className="absolute -top-2 -right-2 bg-amber-500/90 text-canvas p-1 rounded-full text-[10px] font-bold shadow-lg flex items-center justify-center cursor-help"
                        title="Low resolution image: Print quality may be reduced."
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                )}

                {/* Text Element */}
                {el.type === 'text' && (
                  <div
                    className="whitespace-nowrap px-2 py-1 select-none"
                    style={{
                      fontFamily: el.fontFamily || "'Outfit', sans-serif",
                      fontSize: `${el.fontSize || 24}px`,
                      color: el.color || '#ffffff',
                      fontWeight: el.bold ? 800 : 500,
                      fontStyle: el.italic ? 'italic' : 'normal',
                      textAlign: el.align || 'center',
                      textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      letterSpacing: el.isCurved ? '0.12em' : 'normal',
                    }}
                  >
                    {el.isCurved ? (
                      /* Curved Text representation */
                      <svg
                        width={(el.text.length * (el.fontSize || 24) * 0.7) + 40}
                        height={(el.fontSize || 24) * 2.5}
                        viewBox={`0 0 ${(el.text.length * (el.fontSize || 24) * 0.7) + 40} ${(el.fontSize || 24) * 2.5}`}
                        className="overflow-visible"
                      >
                        <path
                          id={`curve-${el.id}`}
                          d={`M 10,${(el.fontSize || 24) * 2} Q ${(el.text.length * (el.fontSize || 24) * 0.35) + 20},10 ${(el.text.length * (el.fontSize || 24) * 0.7) + 30},${(el.fontSize || 24) * 2}`}
                          fill="none"
                        />
                        <text
                          fill={el.color || '#ffffff'}
                          fontSize={el.fontSize || 24}
                          fontFamily={el.fontFamily || "'Outfit', sans-serif"}
                          fontWeight={el.bold ? '800' : '500'}
                          fontStyle={el.italic ? 'italic' : 'normal'}
                        >
                          <textPath href={`#curve-${el.id}`} startOffset="50%" textAnchor="middle">
                            {el.text}
                          </textPath>
                        </text>
                      </svg>
                    ) : (
                      el.text || 'Sample Text'
                    )}
                  </div>
                )}

                {/* Selection Handles (Rotate, Scale, Delete) */}
                {isSelected && (
                  <>
                    {/* Rotate handle top center */}
                    <button
                      type="button"
                      onMouseDown={(e) => handlePointerDown(e, el, 'rotate')}
                      onTouchStart={(e) => handlePointerDown(e, el, 'rotate')}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-ink-900 text-ink-900 flex items-center justify-center shadow-lg  active:scale-95 transition-transform"
                      title="Rotate 360°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Scale corner handle bottom right */}
                    <button
                      type="button"
                      onMouseDown={(e) => handlePointerDown(e, el, 'resize')}
                      onTouchStart={(e) => handlePointerDown(e, el, 'resize')}
                      className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-white text-ink-900 border-2 border-clay-500 flex items-center justify-center shadow-lg  active:scale-95 transition-transform"
                      title="Resize / Scale"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>

                    {/* Delete handle top right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-rose-600 text-ink-900 flex items-center justify-center shadow-lg  active:scale-95 transition-transform"
                      title="Delete Element"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </TShirtMockupSVG>
    </div>
  );
};

export default DesignStudioCanvas;
