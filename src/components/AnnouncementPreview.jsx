import React, { useRef } from 'react';
import { X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SaveExportMenu from '@/components/editor/SaveExportMenu';

export default function AnnouncementPreview({ announcement, onEdit, onClose }) {
  const canvasRef = useRef(null);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <p className="font-medium text-sm truncate flex-1 ml-3">{announcement.title}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveExportMenu canvasRef={canvasRef} title={announcement.title} />
          {onEdit && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={onEdit}>
              <Pencil className="w-3 h-3" /> ערוך
            </Button>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="bg-muted p-4 flex justify-center" style={{ maxHeight: '70vh', overflow: 'auto' }}>
        <div
          ref={canvasRef}
          style={{
            width: '595px',
            height: '842px',
            position: 'relative',
            backgroundColor: announcement.background_url ? 'transparent' : 'white',
            backgroundImage: announcement.background_url ? `url(${announcement.background_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {announcement.text_elements?.map(el => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                fontSize: `${el.fontSize}px`,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                color: el.color,
                textAlign: el.textAlign,
                lineHeight: el.lineHeight,
                direction: 'rtl',
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {el.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}