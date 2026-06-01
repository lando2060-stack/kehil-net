import React from 'react';
import { Bold, AlignRight, AlignCenter, AlignLeft, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const FONTS = [
  'Heebo', 'Frank Ruhl Libre', 'Noto Serif Hebrew', 'Rubik', 'Assistant', 'Arial', 'Georgia',
];

const COLORS = [
  '#1a365d', '#2c5282', '#c53030', '#2f855a', '#d69e2e', '#6b46c1',
  '#ffffff', '#000000', '#4a5568', '#718096',
];

export default function TopTextToolbar({ element, onUpdate, onDelete }) {
  if (!element) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Font family */}
      <Select value={element.fontFamily || 'Heebo'} onValueChange={v => onUpdate({ fontFamily: v })}>
        <SelectTrigger className="h-7 text-xs w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map(f => (
            <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font size */}
      <div className="flex items-center border rounded-md overflow-hidden h-7">
        <button
          className="px-1.5 hover:bg-muted transition-colors"
          onClick={() => onUpdate({ fontSize: Math.max(8, (element.fontSize || 24) - 2) })}
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          value={element.fontSize || 24}
          onChange={e => onUpdate({ fontSize: parseInt(e.target.value) || 24 })}
          className="w-10 text-center text-xs border-0 outline-none"
        />
        <button
          className="px-1.5 hover:bg-muted transition-colors"
          onClick={() => onUpdate({ fontSize: Math.min(120, (element.fontSize || 24) + 2) })}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Bold */}
      <button
        onClick={() => onUpdate({ fontWeight: (element.fontWeight === '700' || element.fontWeight === 'bold') ? '400' : '700' })}
        className={cn('w-7 h-7 rounded flex items-center justify-center transition-colors',
          (element.fontWeight === '700' || element.fontWeight === 'bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Align */}
      {[
        { value: 'right', Icon: AlignRight },
        { value: 'center', Icon: AlignCenter },
        { value: 'left', Icon: AlignLeft },
      ].map(({ value, Icon }) => (
        <button key={value}
          onClick={() => onUpdate({ textAlign: value })}
          className={cn('w-7 h-7 rounded flex items-center justify-center transition-colors',
            (element.textAlign || 'center') === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}

      <Separator orientation="vertical" className="h-6" />

      {/* Colors */}
      <div className="flex gap-1 items-center">
        {COLORS.slice(0, 6).map(c => (
          <button key={c} onClick={() => onUpdate({ color: c })}
            className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
              element.color === c ? 'border-primary scale-110' : 'border-border'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <input type="color" value={element.color || '#1a365d'} onChange={e => onUpdate({ color: e.target.value })}
          className="w-5 h-5 rounded-full cursor-pointer border border-border overflow-hidden p-0" />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Delete */}
      <button onClick={onDelete} className="w-7 h-7 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}