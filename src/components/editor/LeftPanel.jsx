import React, { useState } from 'react';
import { FileText, Image, Type, Shapes, BookMarked, Palette, Search, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import SynagogueLibrary from './SynagogueLibrary';
import PageColorsPanel from './PageColorsPanel';

const TABS = [
  { id: 'templates', label: 'תבניות', icon: FileText },
  { id: 'backgrounds', label: 'רקעים', icon: Image },
  { id: 'text', label: 'טקסט', icon: Type },
  { id: 'elements', label: 'אלמנטים', icon: Shapes },
  { id: 'colors', label: 'צבעים', icon: Palette },
  { id: 'synagogue', label: 'שלי', icon: BookMarked },
];

export default function LeftPanel({ backgroundUrl, onBackgroundChange, onAddText, textElements, onReplaceColor, panelWidth, onPanelWidthChange, onResizeMouseDown }) {
  const [activeTab, setActiveTab] = useState(null);

  const handleTabClick = (tabId) => {
    const next = activeTab === tabId ? null : tabId;
    setActiveTab(next);
    if (next && (!panelWidth || panelWidth === 0)) onPanelWidthChange(256);
    if (!next) onPanelWidthChange(0);
  };

  const resolvedWidth = activeTab ? (panelWidth || 256) : 0;

  return (
    <div className="flex flex-row-reverse flex-shrink-0 h-full z-10">
      {/* Icon rail — right side (RTL) */}
      <div className="w-14 bg-white border-l flex flex-col items-center py-2 gap-1 shadow-sm flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            title={tab.label}
            className={cn(
              'w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-medium',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="leading-none">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Slide-out panel — opens to the left of the icon rail */}
      {activeTab && (
        <div className="flex flex-row-reverse h-full flex-shrink-0" style={{ width: resolvedWidth }}>
          {/* Resize handle on the LEFT edge (towards canvas) */}
          <div
            onMouseDown={onResizeMouseDown}
            className="w-1.5 h-full cursor-col-resize flex-shrink-0 hover:bg-primary/20 active:bg-primary/40 transition-colors group"
            title="גרור לשינוי רוחב"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-0.5 h-10 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>

          <div className="flex-1 bg-white border-l flex flex-col shadow-lg overflow-hidden min-w-0">
            <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0">
              <button onClick={() => handleTabClick(activeTab)} className="p-1 rounded hover:bg-muted transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-xs font-semibold">{TABS.find(t => t.id === activeTab)?.label}</span>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'templates' && <TemplatesTab onBackgroundChange={onBackgroundChange} />}
              {activeTab === 'backgrounds' && <BackgroundsTab backgroundUrl={backgroundUrl} onSelect={onBackgroundChange} />}
              {activeTab === 'text' && <TextTab onAddText={onAddText} />}
              {activeTab === 'elements' && <ElementsTab onAddText={onAddText} />}
              {activeTab === 'colors' && <PageColorsPanel textElements={textElements || []} onReplaceColor={onReplaceColor} />}
              {activeTab === 'synagogue' && <SynagogueLibrary backgroundUrl={backgroundUrl} onBackgroundChange={onBackgroundChange} onAddText={onAddText} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Templates Tab ──
function TemplatesTab({ onBackgroundChange }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [gridSize, setGridSize] = useState(2);

  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => base44.entities.TemplateCategory.list('order', 50),
  });
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates-picker'],
    queryFn: () => base44.entities.Template.list('-created_date', 200),
  });

  const allCats = ['הכל', ...categories.map(c => c.name)];
  const filtered = templates.filter(t => {
    if (search && !t.name?.includes(search)) return false;
    if (activeCategory !== 'הכל' && !t.categories?.includes(activeCategory)) return false;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input placeholder="חפש תבניות..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-7 text-xs" />
        </div>
      </div>
      <div className="px-2 pb-1.5 flex gap-1 overflow-x-auto flex-shrink-0">
        {allCats.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn('px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors',
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
            {cat}
          </button>
        ))}
      </div>
      <GridSizeControl value={gridSize} onChange={setGridSize} />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">אין תבניות</p>
          : <div className={cn('grid gap-1.5', gridSize === 1 ? 'grid-cols-1' : gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {filtered.map(t => (
              <button key={t.id} onClick={() => t.background_url && onBackgroundChange(t.background_url)}
                className="rounded-lg overflow-hidden border hover:border-primary transition-colors cursor-pointer text-right">
                <div className="aspect-[3/4] bg-muted">
                  {t.thumbnail_url || t.background_url
                    ? <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><FileText className="w-5 h-5 text-muted-foreground/40" /></div>}
                </div>
                {gridSize <= 2 && <p className="text-[9px] text-center p-1 truncate font-medium">{t.name}</p>}
              </button>
            ))}
          </div>}
      </div>
    </div>
  );
}

// ── Backgrounds Tab ──
function BackgroundsTab({ backgroundUrl, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [gridSize, setGridSize] = useState(2);

  const { data: categories = [] } = useQuery({
    queryKey: ['bg-categories'],
    queryFn: () => base44.entities.BackgroundCategory.list('order', 50),
  });
  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: ['backgrounds-picker'],
    queryFn: () => base44.entities.Background.list('-created_date', 200),
  });

  const allCats = ['הכל', ...categories.map(c => c.name)];
  const filtered = backgrounds.filter(bg => {
    if (search && !bg.name?.includes(search)) return false;
    if (activeCategory !== 'הכל' && !bg.categories?.includes(activeCategory)) return false;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input placeholder="חפש רקעים..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-7 text-xs" />
        </div>
      </div>
      <div className="px-2 pb-1.5 flex gap-1 overflow-x-auto flex-shrink-0">
        {allCats.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn('px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors',
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
            {cat}
          </button>
        ))}
      </div>
      <GridSizeControl value={gridSize} onChange={setGridSize} />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">אין רקעים</p>
          : <div className={cn('grid gap-1.5', gridSize === 1 ? 'grid-cols-1' : gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {filtered.map(bg => (
              <button key={bg.id} onClick={() => onSelect(backgroundUrl === bg.image_url ? '' : bg.image_url)}
                className={cn('relative rounded-lg overflow-hidden border-2 transition-all',
                  backgroundUrl === bg.image_url ? 'border-primary shadow-md' : 'border-transparent hover:border-border')}>
                <div className="aspect-[3/4]">
                  <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
                </div>
                {backgroundUrl === bg.image_url && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                {gridSize <= 2 && <p className="text-[9px] text-center p-1 truncate">{bg.name}</p>}
              </button>
            ))}
          </div>}
      </div>
    </div>
  );
}

// ── Grid Size Control ──
function GridSizeControl({ value, onChange }) {
  return (
    <div className="flex items-center justify-end gap-1 px-2 pb-1.5 flex-shrink-0">
      <span className="text-[9px] text-muted-foreground ml-1">תצוגה:</span>
      {[1, 2, 3].map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center transition-colors',
            value === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
          title={s === 1 ? 'גדול' : s === 2 ? 'בינוני' : 'קטן'}
        >
          <div className={cn('grid gap-px', s === 1 ? 'grid-cols-1' : s === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {Array.from({ length: s * s }).map((_, i) => (
              <div key={i} className={cn(value === s ? 'bg-primary-foreground' : 'bg-muted-foreground',
                s === 1 ? 'w-2.5 h-2.5' : s === 2 ? 'w-1.5 h-1.5' : 'w-1 h-1'
              )} />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Text Tab ──
function TextTab({ onAddText }) {
  return (
    <div className="p-3 space-y-2 overflow-y-auto">
      <p className="text-[10px] font-semibold text-muted-foreground mb-2">הוספת טקסט</p>
      {[
        { label: 'כותרת ראשית', fontSize: 36, fontWeight: '700', fontFamily: 'Frank Ruhl Libre', previewSize: 20 },
        { label: 'כותרת משנה', fontSize: 22, fontWeight: '600', fontFamily: 'Frank Ruhl Libre', previewSize: 16 },
        { label: 'טקסט גוף', fontSize: 16, fontWeight: '400', fontFamily: 'Heebo', previewSize: 13 },
        { label: 'כתובית', fontSize: 13, fontWeight: '400', fontFamily: 'Heebo', previewSize: 11, color: '#718096' },
      ].map(({ label, previewSize, color, ...props }) => (
        <button key={label} onClick={() => onAddText({ ...props, content: label })}
          className="w-full text-right px-3 py-2.5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all">
          <span style={{ fontSize: previewSize, fontFamily: props.fontFamily, fontWeight: props.fontWeight, color: color || undefined }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Elements Tab ──
const EMOJI_ELEMENTS = ['✡️', '🕍', '📜', '🕯️', '✨', '⭐', '🌟', '🎗️', '🔯', '📖', '🕊️', '🌿'];
const SHAPE_ELEMENTS = [
  { content: '──────────', style: { fontSize: 14 } },
  { content: '• • • • •', style: { fontSize: 18 } },
  { content: '❖ ❖ ❖', style: { fontSize: 20 } },
  { content: '✦ ✦ ✦', style: { fontSize: 18 } },
];

function ElementsTab({ onAddText }) {
  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2">קישוטים</p>
        <div className="grid grid-cols-4 gap-1.5">
          {EMOJI_ELEMENTS.map(emoji => (
            <button key={emoji}
              onClick={() => onAddText({ content: emoji, fontSize: 32, fontFamily: 'Heebo', fontWeight: '400' })}
              className="aspect-square rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center text-xl">
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2">מפרידים</p>
        <div className="space-y-1.5">
          {SHAPE_ELEMENTS.map((s, i) => (
            <button key={i}
              onClick={() => onAddText({ content: s.content, fontSize: s.style.fontSize, fontFamily: 'Heebo', fontWeight: '400', color: '#4a5568' })}
              className="w-full px-3 py-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center">
              <span style={s.style}>{s.content}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}