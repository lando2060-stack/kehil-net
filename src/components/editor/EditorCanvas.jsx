import React, { useRef } from 'react';
import TextElement from './TextElement';

export default function EditorCanvas({
  canvasWidth = 595,
  canvasHeight = 842,
  backgroundUrl,
  textElements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringForward,
  onSendBackward,
  logoUrl,
  logoPosition,
  onLogoUpdate,
  canvasRefProp,
  orientation = 'portrait',
  onCommitElement,
}) {
  const internalRef = useRef(null);
  const canvasRef = canvasRefProp || internalRef;

  const finalWidth = orientation === 'landscape' ? canvasHeight : canvasWidth;
  const finalHeight = orientation === 'landscape' ? canvasWidth : canvasHeight;

  const isEmpty = !backgroundUrl && textElements.length === 0;

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
      onSelectElement(null);
    }
  };

  return (
    <div className="flex items-start justify-center">
      <div
        ref={canvasRef}
        data-canvas="true"
        className="relative bg-white shadow-2xl transition-all"
        style={{ width: finalWidth, height: finalHeight, minWidth: finalWidth }}
        onClick={handleCanvasClick}
      >
        {/* Background */}
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover canvas-bg pointer-events-none"
          />
        )}

        {/* Empty state overlay */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-gray-200">בחרו רקע או תבנית</p>
              <p className="text-sm text-gray-300">מהפאנל מימין</p>
            </div>
            <div className="border-t border-gray-200 w-24 my-1" />
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-300">לחצו על טקסט כדי לבחור</p>
              <p className="text-xs text-gray-300">לחצו פעמיים כדי לערוך</p>
            </div>
          </div>
        )}

        {/* Text Elements */}
        {textElements.map((el, idx) => (
          <TextElement
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onSelect={() => onSelectElement(el.id)}
            onUpdate={(updates) => onUpdateElement(el.id, updates)}
            onDelete={() => onDeleteElement?.(el.id)}
            onDuplicate={() => onDuplicateElement?.(el.id)}
            onBringForward={() => onBringForward?.(el.id)}
            onSendBackward={() => onSendBackward?.(el.id)}
            canvasWidth={finalWidth}
            canvasHeight={finalHeight}
            zIndex={idx + 10}
            onCommit={onCommitElement}
          />
        ))}

        {/* Logo */}
        {logoUrl && logoPosition && (
          <div
            className="absolute cursor-move border-2 border-transparent hover:border-secondary/50"
            style={{ left: logoPosition.x, top: logoPosition.y, width: logoPosition.width || 100, height: logoPosition.height || 100 }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <img src={logoUrl} alt="לוגו" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}
