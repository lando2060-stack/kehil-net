import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export default function TextElement({
  element, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onBringForward, onSendBackward,
  canvasWidth, canvasHeight, zIndex, onCommit,
}) {
  const elRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizing, setResizing] = useState(null);

  const getScale = useCallback(() => {
    try {
      const canvas = elRef.current?.closest('[data-canvas]');
      if (!canvas) return 1;
      const transform = window.getComputedStyle(canvas.parentElement).transform;
      if (!transform || transform === 'none') return 1;
      const m = transform.match(/matrix\(([^)]+)\)/);
      if (m) return parseFloat(m[1].split(',')[0]);
    } catch {}
    return 1;
  }, []);

  // ── Drag ──
  const handleMouseDown = useCallback((e) => {
    if (isEditing) return;
    if (e.target.closest('[data-handle]')) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y });
  }, [isEditing, element.x, element.y, onSelect]);

  useEffect(() => {
    if (!isDragging || !dragStart) return;
    const onMove = (e) => {
      const scale = getScale();
      const dx = (e.clientX - dragStart.mx) / scale;
      const dy = (e.clientY - dragStart.my) / scale;
      onUpdate({
        x: Math.max(0, Math.min(canvasWidth - (element.width || 100), dragStart.ex + dx)),
        y: Math.max(0, Math.min(canvasHeight - 30, dragStart.ey + dy)),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      onCommit?.();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging, dragStart, canvasWidth, canvasHeight, element.width, getScale, onCommit]);

  // ── Resize ──
  const startResize = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: element.width || 200,
      startH: element.height || (element.fontSize * (element.lineHeight || 1.4) * 2),
      startX0: element.x,
      startY0: element.y,
    });
  }, [element]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const scale = getScale();
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;
      const updates = {};
      if (resizing.dir.includes('e')) updates.width = Math.max(60, resizing.startW + dx);
      if (resizing.dir.includes('w')) { updates.width = Math.max(60, resizing.startW - dx); updates.x = resizing.startX0 + dx; }
      if (resizing.dir.includes('s')) updates.height = Math.max(30, resizing.startH + dy);
      if (resizing.dir.includes('n')) { updates.height = Math.max(30, resizing.startH - dy); updates.y = resizing.startY0 + dy; }
      onUpdate(updates);
    };
    const onUp = () => {
      setResizing(null);
      onCommit?.();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [resizing, getScale, onCommit]);

  // ── Edit (double click) ──
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    onSelect();
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 30);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerText });
      onCommit?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setIsEditing(false); contentRef.current?.blur(); return; }
    if (e.key === 'Enter' && !e.shiftKey && !isEditing) { e.preventDefault(); return; }
    e.stopPropagation();
  };

  // ── Keyboard shortcuts when selected (not editing) ──
  useEffect(() => {
    if (!isSelected || isEditing) return;
    const onKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onDelete?.(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); onDuplicate?.(); }
      if (e.key === 'Enter') { e.preventDefault(); handleDoubleClick({ stopPropagation: () => {} }); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSelected, isEditing, onDelete, onDuplicate]);

  const w = element.width || 200;
  const handles = [
    { dir: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize', width: 8, height: 8 } },
    { dir: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize', width: 8, height: 8 } },
    { dir: 'e',  style: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize', width: 8, height: 8 } },
    { dir: 'w',  style: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize', width: 8, height: 8 } },
    { dir: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize', width: 10, height: 10 } },
    { dir: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize', width: 10, height: 10 } },
    { dir: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize', width: 10, height: 10 } },
    { dir: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize', width: 10, height: 10 } },
  ];

  return (
    <div
      ref={elRef}
      className={cn('absolute select-none group/el', isDragging ? 'cursor-grabbing' : 'cursor-grab', isEditing && 'cursor-text')}
      style={{ left: element.x, top: element.y, width: w, minHeight: 30, zIndex: zIndex || (isSelected ? 50 : 10) }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Hover border (when not selected) */}
      {!isSelected && (
        <div className="absolute inset-0 border border-dashed border-transparent group-hover/el:border-blue-300/70 pointer-events-none rounded-sm transition-colors" />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-sm shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" />
      )}

      {/* Content */}
      <div
        ref={contentRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={isEditing ? undefined : { __html: element.content }}
        className={cn('outline-none min-w-[40px] min-h-[20px] p-1 whitespace-pre-wrap break-words', isEditing && 'bg-white/70 ring-2 ring-blue-400 rounded')}
        style={{
          fontSize: element.fontSize || 24,
          fontFamily: element.fontFamily || 'Frank Ruhl Libre',
          fontWeight: element.fontWeight || '700',
          color: element.color || '#1a365d',
          textAlign: element.textAlign || 'center',
          lineHeight: element.lineHeight || 1.4,
          direction: 'rtl',
          cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
          textShadow: element.textShadow || 'none',
          backgroundColor: element.backgroundColor || 'transparent',
          borderRadius: element.borderRadius || 0,
          padding: element.padding || '4px',
        }}
      />

      {/* Resize handles */}
      {isSelected && !isEditing && handles.map(h => (
        <div
          key={h.dir}
          data-handle="resize"
          className="absolute bg-white border-2 border-blue-500 rounded-full z-50 shadow-sm"
          style={{ ...h.style, position: 'absolute' }}
          onMouseDown={(e) => startResize(e, h.dir)}
        />
      ))}

      {/* Action toolbar */}
      {isSelected && !isEditing && (
        <div
          data-handle="toolbar"
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-gray-900 text-white rounded-lg px-1.5 py-1 shadow-lg z-50 whitespace-nowrap"
          onMouseDown={e => e.stopPropagation()}
        >
          <span className="text-[9px] text-white/50 pr-1 select-none">לחץ ×2 לעריכה</span>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} title="שכפל (Ctrl+D)" className="p-1 hover:bg-white/20 rounded">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBringForward?.(); }} title="הבא קדימה" className="p-1 hover:bg-white/20 rounded">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSendBackward?.(); }} title="שלח אחורה" className="p-1 hover:bg-white/20 rounded">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} title="מחק (Delete)" className="p-1 hover:bg-red-500/80 rounded text-red-300 hover:text-white">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
          עורך טקסט — Esc לסיום
        </div>
      )}
    </div>
  );
}
