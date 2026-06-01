import React, { useState } from 'react';
import { Check, X, Layers, Type, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Shows the extracted flyer split into background + text elements.
 * User can click each text element to mark it as "background" (part of image) or "template" (editable text).
 */
export default function FlyerSplitReview({ imageUrl, textElements: initialElements, onConfirm, onBack }) {
  // Each element: { ...el, role: 'template' | 'background' }
  const [elements, setElements] = useState(() =>
    initialElements.map(el => ({ ...el, role: 'template' }))
  );
  const [hoveredId, setHoveredId] = useState(null);

  const toggleRole = (id) => {
    setElements(prev => prev.map(el =>
      el.id === id
        ? { ...el, role: el.role === 'template' ? 'background' : 'template' }
        : el
    ));
  };

  const templateElements = elements.filter(e => e.role === 'template');
  const backgroundElements = elements.filter(e => e.role === 'background');

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <strong>בדקו את הפיצול:</strong> לחצו על כל טקסט כדי להחליף בין <span className="text-primary font-medium">תבנית</span> (ניתן לעריכה) ו<span className="text-orange-500 font-medium">רקע</span> (חלק מהתמונה).
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left: Background preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            רקע
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{backgroundElements.length + 1}</Badge>
          </div>
          <div className="relative rounded-lg overflow-hidden border bg-checkered" style={{ aspectRatio: '595/842' }}>
            {/* The full image */}
            <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* Overlay background-role elements as highlights */}
            {elements.map(el => el.role === 'background' && (
              <div
                key={el.id}
                className="absolute bg-orange-400/30 border border-orange-400 rounded cursor-pointer hover:bg-orange-400/50 transition-colors"
                style={{
                  left: `${(el.x / 595) * 100}%`,
                  top: `${(el.y / 842) * 100}%`,
                  width: `${(el.width / 595) * 100}%`,
                  minHeight: `${(el.fontSize / 842) * 100 * 1.5}%`,
                }}
                onClick={() => toggleRole(el.id)}
                title="לחץ להוציא לתבנית"
              />
            ))}
          </div>
        </div>

        {/* Right: Template preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Type className="w-3.5 h-3.5" />
            תבנית (טקסטים לעריכה)
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{templateElements.length}</Badge>
          </div>
          <div className="relative rounded-lg overflow-hidden border bg-checkered" style={{ aspectRatio: '595/842' }}>
            {/* Transparent background to show template elements only */}
            {elements.map(el => (
              <div
                key={el.id}
                onClick={() => toggleRole(el.id)}
                onMouseEnter={() => setHoveredId(el.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'absolute cursor-pointer transition-all rounded',
                  el.role === 'template'
                    ? 'opacity-100 hover:ring-2 hover:ring-primary'
                    : 'opacity-20 pointer-events-none'
                )}
                style={{
                  left: `${(el.x / 595) * 100}%`,
                  top: `${(el.y / 842) * 100}%`,
                  width: `${(el.width / 595) * 100}%`,
                  fontSize: `${Math.max(el.fontSize * 0.22, 5)}px`,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  color: el.role === 'template' ? el.color : '#999',
                  textAlign: el.textAlign,
                  lineHeight: el.lineHeight,
                  direction: 'rtl',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backgroundColor: el.role === 'template' && hoveredId === el.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                }}
                title={el.role === 'template' ? 'לחץ להעביר לרקע' : 'לחץ להוציא לתבנית'}
              >
                {el.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary inline-block" /> תבנית – ניתן לעריכה</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400/30 border border-orange-400 inline-block" /> רקע – חלק מהתמונה</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-between pt-1">
        <Button variant="outline" size="sm" onClick={onBack}>
          <X className="w-3.5 h-3.5 ml-1" /> חזור
        </Button>
        <Button size="sm" onClick={() => onConfirm(templateElements, imageUrl)} className="gap-1.5">
          <Check className="w-3.5 h-3.5" />
          אשר ושמור ({templateElements.length} טקסטים בתבנית)
        </Button>
      </div>
    </div>
  );
}