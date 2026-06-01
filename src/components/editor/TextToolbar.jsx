import React from 'react';
import { Bold, Italic, AlignRight, AlignCenter, AlignLeft, Plus, Minus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const FONTS = [
  { value: 'var(--font-frank)', label: 'Frank Ruhl Libre' },
  { value: 'var(--font-heebo)', label: 'Heebo' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'David, serif', label: 'David' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

const COLORS = [
  '#1a365d', '#2c5282', '#2b6cb0',
  '#c53030', '#9b2c2c',
  '#2f855a', '#276749',
  '#d69e2e', '#b7791f',
  '#ffffff', '#000000',
  '#4a5568', '#718096',
];

export default function TextToolbar({ element, onUpdate }) {
  if (!element) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Type className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p>בחרו אלמנט טקסט לעריכה</p>
        <p className="text-xs mt-1">או לחצו פעמיים על טקסט לעריכת התוכן</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">עריכת טקסט</h3>

      {/* Font Family */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">גופן</label>
        <Select
          value={element.fontFamily || 'var(--font-frank)'}
          onValueChange={(v) => onUpdate({ fontFamily: v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map(f => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">גודל</label>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onUpdate({ fontSize: Math.max(8, (element.fontSize || 24) - 2) })}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            value={element.fontSize || 24}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 24 })}
            className="h-8 w-16 text-center text-sm"
          />
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => onUpdate({ fontSize: Math.min(120, (element.fontSize || 24) + 2) })}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Bold */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">עיצוב</label>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant={element.fontWeight === '700' || element.fontWeight === 'bold' ? 'default' : 'outline'}
            className="h-8 w-8"
            onClick={() => onUpdate({ fontWeight: element.fontWeight === '700' ? '400' : '700' })}
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">יישור</label>
        <div className="flex gap-1">
          {[
            { value: 'right', icon: AlignRight },
            { value: 'center', icon: AlignCenter },
            { value: 'left', icon: AlignLeft },
          ].map(a => (
            <Button
              key={a.value}
              size="icon"
              variant={(element.textAlign || 'center') === a.value ? 'default' : 'outline'}
              className="h-8 w-8"
              onClick={() => onUpdate({ textAlign: a.value })}
            >
              <a.icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Color */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">צבע</label>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              className={cn(
                "w-7 h-7 rounded-md border-2 transition-transform hover:scale-110",
                element.color === c ? 'border-secondary scale-110' : 'border-border'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Input
          type="color"
          value={element.color || '#1a365d'}
          onChange={(e) => onUpdate({ color: e.target.value })}
          className="h-8 w-full mt-2 cursor-pointer"
        />
      </div>

      {/* Line Height */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">רווח שורות</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step={0.1}
            min={0.8}
            max={3}
            value={element.lineHeight || 1.4}
            onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) || 1.4 })}
            className="h-8 w-20 text-sm"
          />
        </div>
      </div>
    </div>
  );
}