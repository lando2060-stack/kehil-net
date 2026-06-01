import React, { useState, useMemo } from 'react';
import { Palette, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function colorsAreSimilar(c1, c2, threshold = 20) {
  if (!c1 || !c2 || !c1.startsWith('#') || !c2.startsWith('#')) return false;
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < threshold;
}

function normalizeColor(c) {
  if (!c) return null;
  if (c.startsWith('#') && c.length === 7) return c.toLowerCase();
  if (c.startsWith('#') && c.length === 4) {
    return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  }
  return null;
}

export default function PageColorsPanel({ textElements, onReplaceColor }) {
  const [replacingColor, setReplacingColor] = useState(null);

  const uniqueColors = useMemo(() => {
    const found = [];
    textElements.forEach(el => {
      const c = normalizeColor(el.color);
      if (!c) return;
      if (!found.some(f => colorsAreSimilar(f, c))) {
        found.push(c);
      }
    });
    return found;
  }, [textElements]);

  const handleReplace = (oldColor, newColor) => {
    onReplaceColor(oldColor, newColor);
    setReplacingColor(null);
  };

  if (uniqueColors.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        <Palette className="w-5 h-5 mx-auto mb-2 opacity-40" />
        אין צבעים במודעה עדיין
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">צבעי העמוד</p>
      {uniqueColors.map((color) => (
        <div key={color}>
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
            onClick={() => setReplacingColor(replacingColor === color ? null : color)}
          >
            <div
              className="w-7 h-7 rounded-lg border-2 border-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 0 1px #e2e8f0, 0 1px 3px rgba(0,0,0,0.15)` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-foreground">{color}</p>
              <p className="text-[10px] text-muted-foreground">
                {textElements.filter(el => colorsAreSimilar(normalizeColor(el.color), color)).length} אלמנטים
              </p>
            </div>
            <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
              replacingColor === color && 'opacity-100 text-primary rotate-180'
            )} />
          </div>

          {replacingColor === color && (
            <div className="mx-2 mb-2 p-3 bg-muted/50 rounded-xl border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-2">החלף צבע זה בכל המודעה:</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue={color}
                  onChange={e => {/* live preview optional */}}
                  onBlur={e => handleReplace(color, e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border p-0.5 bg-white"
                  title="בחר צבע חדש"
                  autoFocus
                />
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">לחץ על הצבע לבחירה</p>
                  <p className="text-[10px] text-muted-foreground">השינוי יחול על כל האלמנטים</p>
                </div>
              </div>
              <ColorPresets
                currentColor={color}
                onSelect={(newColor) => handleReplace(color, newColor)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const QUICK_COLORS = [
  '#1a365d', '#2c5282', '#c53030', '#276749', '#d69e2e', '#6b46c1',
  '#ffffff', '#000000', '#4a5568', '#718096', '#e2e8f0', '#f7fafc',
  '#c05621', '#285e61', '#553c9a', '#702459',
];

function ColorPresets({ currentColor, onSelect }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] text-muted-foreground mb-1.5">צבעים מהירים:</p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={cn('w-6 h-6 rounded-md border-2 transition-transform hover:scale-110',
              colorsAreSimilar(c, currentColor) ? 'border-primary scale-110' : 'border-white shadow-sm'
            )}
            style={{ backgroundColor: c, boxShadow: '0 0 0 1px #e2e8f0' }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}