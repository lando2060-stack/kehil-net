import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText, Image, Type, Shapes, BookMarked, Palette, Check, Search,
  Loader2, Plus, Minus, Bold, AlignRight, AlignCenter, AlignLeft, Trash2,
  Sparkles, Settings2, RectangleVertical, RectangleHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SynagogueLibrary from './SynagogueLibrary';
import PageColorsPanel from './PageColorsPanel';

const TABS = [
  { id: 'templates', label: 'תבניות', icon: FileText },
  { id: 'backgrounds', label: 'רקעים', icon: Image },
  { id: 'text', label: 'טקסט', icon: Type },
  { id: 'elements', label: 'אלמנטים', icon: Shapes },
  { id: 'colors', label: 'צבעים', icon: Palette },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'synagogue', label: 'שלי', icon: BookMarked },
  { id: 'settings', label: 'עמוד', icon: Settings2 },
];

const FONTS = ['Heebo', 'Frank Ruhl Libre', 'Noto Serif Hebrew', 'Rubik', 'Assistant', 'Arial', 'Georgia'];

const COLORS = [
  '#1a365d', '#2c5282', '#c53030', '#2f855a', '#d69e2e', '#6b46c1',
  '#ffffff', '#000000', '#4a5568', '#718096', '#e53e3e', '#3182ce',
];

export default function RightPanel({
  backgroundUrl, onBackgroundChange, onAddText,
  textElements, onReplaceColor,
  logoUrl, onLogoChange, onApplyTemplate,
  selectedElement, onUpdateElement, onDeleteElement,
  title, onTitleChange,
  orientation, onOrientationChange,
  canvasWidth, canvasHeight, onCanvasSizeChange,
  synagogueName,
}) {
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    if (selectedElement) setActiveTab('text');
  }, [selectedElement?.id]);

  return (
    <div className="flex flex-row h-full w-full bg-white shadow-md">
      {/* Content panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 border-r">
        {activeTab === 'templates' && <TemplatesTab onBackgroundChange={onBackgroundChange} onApplyTemplate={onApplyTemplate} />}
        {activeTab === 'backgrounds' && <BackgroundsTab backgroundUrl={backgroundUrl} onSelect={onBackgroundChange} />}
        {activeTab === 'text' && (
          <TextTab onAddText={onAddText} selectedElement={selectedElement} onUpdate={onUpdateElement} onDelete={onDeleteElement} />
        )}
        {activeTab === 'elements' && <ElementsTab onAddText={onAddText} />}
        {activeTab === 'colors' && (
          <ColorsTab
            textElements={textElements || []}
            onReplaceColor={onReplaceColor}
            selectedElement={selectedElement}
            onUpdate={onUpdateElement}
          />
        )}
        {activeTab === 'ai' && (
          <AITab
            onAddText={onAddText}
            onBackgroundChange={onBackgroundChange}
            setTextElements={undefined}
            synagogueName={synagogueName}
          />
        )}
        {activeTab === 'synagogue' && (
          <SynagogueLibrary
            backgroundUrl={backgroundUrl}
            onBackgroundChange={onBackgroundChange}
            onAddText={onAddText}
            logoUrl={logoUrl}
            onLogoChange={onLogoChange}
          />
        )}
        {activeTab === 'settings' && (
          <PageSettingsTab
            title={title}
            onTitleChange={onTitleChange}
            orientation={orientation}
            onOrientationChange={onOrientationChange}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onCanvasSizeChange={onCanvasSizeChange}
          />
        )}
      </div>

      {/* Icon rail — right side */}
      <div className="w-14 bg-sidebar flex flex-col items-center py-3 gap-1 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={cn(
              'w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-medium',
              activeTab === tab.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Colors Tab (with selected element support) ──
function ColorsTab({ textElements, onReplaceColor, selectedElement, onUpdate }) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto" dir="rtl">
      {/* Selected element color */}
      {selectedElement && (
        <div className="p-3 border-b bg-blue-50/50">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">צבע הטקסט הנבחר</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => onUpdate?.(selectedElement.id, { color: c })}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                  selectedElement.color === c ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border'
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <div className="relative w-6 h-6" title="צבע מותאם">
              <input
                type="color"
                value={selectedElement.color || '#1a365d'}
                onChange={e => onUpdate?.(selectedElement.id, { color: e.target.value })}
                className="absolute inset-0 w-full h-full rounded-full cursor-pointer opacity-0"
              />
              <div
                className="w-6 h-6 rounded-full border-2 border-dashed border-primary flex items-center justify-center text-[8px] font-bold text-primary"
                style={{ backgroundColor: selectedElement.color || '#1a365d' }}
              >+</div>
            </div>
          </div>
        </div>
      )}
      {/* Page colors */}
      <div className="flex-1">
        <PageColorsPanel textElements={textElements} onReplaceColor={onReplaceColor} />
      </div>
    </div>
  );
}

// ── AI Writing Tab ──
function AITab({ onAddText, onBackgroundChange, synagogueName }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const textareaRef = useRef(null);

  const { data: recentAnnouncements = [] } = useQuery({
    queryKey: ['ai-style-context'],
    queryFn: () => base44.entities.Announcement.list('-updated_date', 5),
    staleTime: 60000,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const styleContext = recentAnnouncements
        .filter((/** @type {any} */ a) => a.text_elements?.length)
        .slice(0, 3)
        .map((/** @type {any} */ a) => ({
          title: a.title,
          elements: a.text_elements?.slice(0, 4).map((/** @type {any} */ el) => ({
            content: el.content, fontSize: el.fontSize, fontFamily: el.fontFamily,
            fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign,
          })),
        }));

      const styleContextStr = styleContext.length > 0
        ? `\n\nסגנון המשתמש (מהמודעות הקיימות שלו):\n${JSON.stringify(styleContext, null, 2)}`
        : '';

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה עוזר ליצירת מודעות לבית כנסת. צור מודעה לפי הבקשה הבאה.${styleContextStr}

בקשה: ${prompt}

החזר JSON עם השדות הבאים:
- title: שם/כותרת קצרה למודעה
- text_elements: מערך של אלמנטי טקסט, כל אחד עם: id (ייחודי), content (תוכן עברי), x, y (מיקום בתוך קנבס 595x842), width, fontSize, fontFamily (Heebo או Frank Ruhl Libre), fontWeight (700/400), color (hex), textAlign (right/center/left), lineHeight (1.2-1.6)

הנחיות:
- כותרת ראשית: fontSize 32-48, fontWeight 700, Frank Ruhl Libre
- טקסט משנה: fontSize 18-24, fontWeight 600
- גוף: fontSize 14-18, fontWeight 400, Heebo
- השתמש בצבעים של סגנון המשתמש אם קיים, אחרת #1a365d לכותרות
- מקם אלמנטים במרכז הקנבס (x בין 80-150, width בין 300-440)
- כתוב בעברית תקינה ומכובדת לבית כנסת`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            text_elements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  fontSize: { type: 'number' },
                  fontFamily: { type: 'string' },
                  fontWeight: { type: 'string' },
                  color: { type: 'string' },
                  textAlign: { type: 'string' },
                  lineHeight: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const typed = /** @type {any} */ (aiResult);
      if (typed?.text_elements?.length) {
        setResult(typed);
      } else {
        setResult({ error: 'לא הצלחנו לייצר תוכן. נסה לתאר בצורה מפורטת יותר.' });
      }
    } catch {
      setResult({ error: 'שגיאה בחיבור לAI. נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  const applyResult = () => {
    if (!result?.text_elements) return;
    result.text_elements.forEach((/** @type {any} */ el) => {
      onAddText({
        content: el.content,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        color: el.color,
        textAlign: el.textAlign,
        lineHeight: el.lineHeight,
        x: el.x,
        y: el.y,
        width: el.width,
      });
    });
    setResult(null);
    setPrompt('');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" dir="rtl">
      <div className="p-3 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">כתיבה בעזרת AI</p>
        </div>
        <p className="text-[10px] text-muted-foreground">ה-AI לומד מסגנון המודעות הקיימות שלך</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">תאר את המודעה שתרצה:</p>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`לדוגמה:\n"הזמנה לשיעור תורה בכל יום שישי בשעה 7 בבוקר"\n"אזכרה לרב משה כהן ז׳ל ביום שלישי הקרוב"\n"ברכה לרגל חג הפסח"`}
            className="w-full h-28 text-xs border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter לשליחה</p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
          className="w-full bg-primary text-primary-foreground gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'יוצר מודעה...' : 'צור מודעה'}
        </Button>

        {/* Result */}
        {result && !result.error && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-green-800">✓ המודעה נוצרה!</p>
            <div className="space-y-1">
              {result.text_elements?.slice(0, 4).map((/** @type {any} */ el, i) => (
                <div key={i} className="text-[10px] bg-white rounded-lg px-2 py-1.5 border border-green-100">
                  <span className="text-muted-foreground">{el.fontSize}px · </span>
                  <span className="font-medium text-foreground">{el.content?.slice(0, 40)}{el.content?.length > 40 ? '…' : ''}</span>
                </div>
              ))}
            </div>
            <Button onClick={applyResult} className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              הוסף לקנבס
            </Button>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700">{result.error}</p>
          </div>
        )}

        {/* Style context indicator */}
        {recentAnnouncements.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
            <p className="text-[10px] text-muted-foreground">
              <span className="font-medium">סגנון נלמד מ: </span>
              {recentAnnouncements.slice(0, 3).map((/** @type {any} */ a) => a.title).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Settings Tab ──
const CANVAS_PRESETS = [
  { label: 'A4 אנכי', width: 595, height: 842 },
  { label: 'A4 אופקי', width: 842, height: 595 },
  { label: 'ריבוע', width: 595, height: 595 },
  { label: 'אינסטגרם', width: 1080, height: 1080 },
  { label: 'סטורי', width: 1080, height: 1920 },
  { label: 'פנורמה', width: 842, height: 400 },
];

function PageSettingsTab({ title, onTitleChange, orientation, onOrientationChange, canvasWidth, canvasHeight, onCanvasSizeChange }) {
  const [customW, setCustomW] = useState(String(canvasWidth || 595));
  const [customH, setCustomH] = useState(String(canvasHeight || 842));

  const applyCustom = () => {
    const w = parseInt(customW);
    const h = parseInt(customH);
    if (w > 0 && h > 0) onCanvasSizeChange?.(w, h);
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-3 space-y-5" dir="rtl">
      {/* Announcement name */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">שם המודעה</p>
        <Input
          value={title || ''}
          onChange={e => onTitleChange?.(e.target.value)}
          placeholder="שם המודעה"
          className="h-8 text-sm"
        />
      </div>

      {/* Orientation */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">כיוון</p>
        <div className="flex gap-2">
          <button
            onClick={() => onOrientationChange?.('portrait')}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
              orientation === 'portrait' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border/80'
            )}
          >
            <RectangleVertical className="w-5 h-5" />
            אנכי
          </button>
          <button
            onClick={() => onOrientationChange?.('landscape')}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
              orientation === 'landscape' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border/80'
            )}
          >
            <RectangleHorizontal className="w-5 h-5" />
            אופקי
          </button>
        </div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">גודל מוגדר מראש</p>
        <div className="grid grid-cols-2 gap-2">
          {CANVAS_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => { onCanvasSizeChange?.(p.width, p.height); setCustomW(String(p.width)); setCustomH(String(p.height)); }}
              className={cn(
                'p-2 rounded-lg border text-xs transition-all text-right',
                canvasWidth === p.width && canvasHeight === p.height
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              <p className="font-medium text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.width}×{p.height}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom size */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">גודל מותאם (פיקסלים)</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">רוחב</p>
            <Input value={customW} onChange={e => setCustomW(e.target.value)} className="h-8 text-sm text-center" type="number" min="200" max="3000" />
          </div>
          <span className="text-muted-foreground mb-2 text-sm">×</span>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">גובה</p>
            <Input value={customH} onChange={e => setCustomH(e.target.value)} className="h-8 text-sm text-center" type="number" min="200" max="3000" />
          </div>
          <Button onClick={applyCustom} className="h-8 px-3 mb-0 text-xs bg-primary text-primary-foreground">
            החל
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">נוכחי: {canvasWidth}×{canvasHeight}</p>
      </div>
    </div>
  );
}

// ── Text Tab ──
function TextTab({ onAddText, selectedElement, onUpdate, onDelete }) {
  const [showPresets, setShowPresets] = useState(false);

  if (selectedElement) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden" dir="rtl">
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">עריכת טקסט</p>
              <button
                onClick={() => onDelete?.(selectedElement.id)}
                className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                title="מחק"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">גופן</label>
              <Select value={selectedElement.fontFamily || 'Heebo'} onValueChange={v => onUpdate?.(selectedElement.id, { fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  {FONTS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">גודל</label>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted" onClick={() => onUpdate?.(selectedElement.id, { fontSize: Math.max(8, (selectedElement.fontSize || 24) - 2) })}>
                  <Minus className="w-3 h-3" />
                </button>
                <input type="number" value={selectedElement.fontSize || 24} onChange={e => onUpdate?.(selectedElement.id, { fontSize: parseInt(e.target.value) || 24 })} className="flex-1 h-7 text-center text-sm border rounded outline-none focus:ring-1 focus:ring-primary" />
                <button className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted" onClick={() => onUpdate?.(selectedElement.id, { fontSize: Math.min(120, (selectedElement.fontSize || 24) + 2) })}>
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">עיצוב ויישור</label>
              <div className="flex gap-1">
                {[
                  { action: () => onUpdate?.(selectedElement.id, { fontWeight: (selectedElement.fontWeight === '700' || selectedElement.fontWeight === 'bold') ? '400' : '700' }), active: (selectedElement.fontWeight === '700' || selectedElement.fontWeight === 'bold'), Icon: Bold, title: 'מודגש' },
                  { action: () => onUpdate?.(selectedElement.id, { textAlign: 'right' }), active: (selectedElement.textAlign || 'center') === 'right', Icon: AlignRight, title: 'ימין' },
                  { action: () => onUpdate?.(selectedElement.id, { textAlign: 'center' }), active: (selectedElement.textAlign || 'center') === 'center', Icon: AlignCenter, title: 'מרכז' },
                  { action: () => onUpdate?.(selectedElement.id, { textAlign: 'left' }), active: (selectedElement.textAlign || 'center') === 'left', Icon: AlignLeft, title: 'שמאל' },
                ].map(({ action, active, Icon, title }, i) => (
                  <button key={i} onClick={action} title={title} className={cn('w-8 h-8 rounded-lg border flex items-center justify-center transition-colors flex-1', active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted border-border')}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">צבע טקסט</label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLORS.map(c => (
                  <button key={c} onClick={() => onUpdate?.(selectedElement.id, { color: c })}
                    className={cn('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110', selectedElement.color === c ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border')}
                    style={{ backgroundColor: c }} title={c}
                  />
                ))}
                <div className="relative w-6 h-6">
                  <input type="color" value={selectedElement.color || '#1a365d'} onChange={e => onUpdate?.(selectedElement.id, { color: e.target.value })} className="absolute inset-0 w-full h-full rounded-full cursor-pointer opacity-0" />
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-border flex items-center justify-center text-[8px]" style={{ backgroundColor: selectedElement.color || '#1a365d' }}>+</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">רווח שורות: {selectedElement.lineHeight || 1.4}</label>
              <input type="range" min="1" max="3" step="0.1" value={selectedElement.lineHeight || 1.4} onChange={e => onUpdate?.(selectedElement.id, { lineHeight: parseFloat(e.target.value) })} className="w-full accent-primary" />
            </div>
          </div>

          <div className="border-t mx-3" />
          <div className="p-3">
            <button onClick={() => setShowPresets(p => !p)} className="w-full text-xs text-primary font-medium py-2 rounded-lg hover:bg-primary/5 transition-colors">
              {showPresets ? '▲ הסתר סגנונות' : '▼ הוסף טקסט בסגנון'}
            </button>
            {showPresets && <TextPresetsGrid onAddText={onAddText} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" dir="rtl">
      <div className="p-2 border-b">
        <Button className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => onAddText?.({})}>
          <Plus className="w-4 h-4" /> הוסף תיבת טקסט
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <TextPresetsGrid onAddText={onAddText} showSearch />
      </div>
    </div>
  );
}

// ── Text Presets ──
const TEXT_PRESETS = [
  { id: 't1', label: 'כותרת ראשית', category: 'כותרות', content: 'כותרת ראשית', fontSize: 36, fontWeight: '700', fontFamily: 'Frank Ruhl Libre', color: '#1a365d', textAlign: 'center' },
  { id: 't2', label: 'כותרת משנה', category: 'כותרות', content: 'כותרת משנה', fontSize: 24, fontWeight: '600', fontFamily: 'Frank Ruhl Libre', color: '#2c5282', textAlign: 'center' },
  { id: 't3', label: 'טקסט גוף', category: 'גוף', content: 'טקסט גוף', fontSize: 16, fontWeight: '400', fontFamily: 'Heebo', color: '#4a5568', textAlign: 'center' },
  { id: 't4', label: 'כתובית קטנה', category: 'גוף', content: 'כתובית', fontSize: 13, fontWeight: '400', fontFamily: 'Heebo', color: '#718096', textAlign: 'center' },
  { id: 't5', label: 'תווית כחולה', category: 'עם רקע', content: 'תווית', fontSize: 18, fontWeight: '700', fontFamily: 'Heebo', color: '#ffffff', backgroundColor: '#2c5282cc', borderRadius: 8, padding: '6px 16px', textAlign: 'center' },
  { id: 't6', label: 'תווית זהב', category: 'עם רקע', content: 'הודעה', fontSize: 18, fontWeight: '700', fontFamily: 'Heebo', color: '#1a365d', backgroundColor: '#d69e2ecc', borderRadius: 8, padding: '6px 16px', textAlign: 'center' },
  { id: 't7', label: 'תווית אדומה', category: 'עם רקע', content: 'חשוב!', fontSize: 18, fontWeight: '700', fontFamily: 'Heebo', color: '#ffffff', backgroundColor: '#c53030cc', borderRadius: 8, padding: '6px 16px', textAlign: 'center' },
  { id: 't8', label: 'תווית ירוקה', category: 'עם רקע', content: 'מבורך', fontSize: 18, fontWeight: '700', fontFamily: 'Heebo', color: '#ffffff', backgroundColor: '#2f855acc', borderRadius: 8, padding: '6px 16px', textAlign: 'center' },
  { id: 't11', label: 'כפתור כחול', category: 'עגול', content: 'לחץ', fontSize: 20, fontWeight: '700', fontFamily: 'Heebo', color: '#ffffff', backgroundColor: '#2c5282', borderRadius: 999, padding: '10px 28px', textAlign: 'center' },
  { id: 't12', label: 'כפתור זהב', category: 'עגול', content: 'הצטרף', fontSize: 20, fontWeight: '700', fontFamily: 'Heebo', color: '#1a365d', backgroundColor: '#d69e2e', borderRadius: 999, padding: '10px 28px', textAlign: 'center' },
  { id: 't15', label: 'צל כהה', category: 'צל', content: 'כותרת', fontSize: 32, fontWeight: '900', fontFamily: 'Frank Ruhl Libre', color: '#1a365d', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', textAlign: 'center' },
  { id: 't16', label: 'צל לבן', category: 'צל', content: 'כותרת', fontSize: 32, fontWeight: '900', fontFamily: 'Frank Ruhl Libre', color: '#ffffff', textShadow: '2px 2px 6px rgba(0,0,0,0.8)', textAlign: 'center' },
];

const TEXT_CATS = ['הכל', 'כותרות', 'גוף', 'עם רקע', 'עגול', 'צל'];

function TextPresetsGrid({ onAddText, showSearch = false }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('הכל');
  const filtered = useMemo(() => TEXT_PRESETS.filter(t => {
    if (search && !t.label.includes(search)) return false;
    if (cat !== 'הכל' && t.category !== cat) return false;
    return true;
  }), [search, cat]);
  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {showSearch && (
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input placeholder="חפש סגנון..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-8 text-xs" />
          </div>
        </div>
      )}
      <div className="px-2 pt-1.5 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
        {TEXT_CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} className={cn('px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors', cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{c}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(t => (
            <button key={t.id}
              onClick={() => onAddText?.({ content: t.content, fontSize: t.fontSize, fontFamily: t.fontFamily, fontWeight: t.fontWeight, color: t.color, textAlign: t.textAlign, backgroundColor: t.backgroundColor, borderRadius: t.borderRadius, padding: t.padding, textShadow: t.textShadow })}
              className="rounded-xl border-2 border-border hover:border-primary transition-all overflow-hidden bg-checkered"
            >
              <div className="w-full h-14 flex items-center justify-center p-1">
                <span style={{ fontSize: Math.min(t.fontSize * 0.45, 16), fontFamily: t.fontFamily, fontWeight: t.fontWeight, color: t.color, textAlign: t.textAlign, backgroundColor: t.backgroundColor || 'transparent', borderRadius: t.borderRadius || 0, padding: t.padding || '2px', textShadow: t.textShadow || 'none', display: 'block', width: '100%', direction: 'rtl' }}>
                  {t.content}
                </span>
              </div>
              <div className="text-[9px] text-center text-muted-foreground pb-1 truncate px-1">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Templates Tab ──
function TemplatesTab({ onBackgroundChange, onApplyTemplate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [gridSize, setGridSize] = useState(2);
  const { data: categories = [] } = useQuery({ queryKey: ['template-categories'], queryFn: () => base44.entities.TemplateCategory.list('order', 50) });
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates-picker'], queryFn: () => base44.entities.Template.list('-created_date', 200) });
  const allCats = ['הכל', ...categories.map((/** @type {any} */ c) => c.name)];
  const q = search.trim().toLowerCase();
  const filtered = templates.filter((/** @type {any} */ t) => {
    if (q && !t.name?.toLowerCase().includes(q)) return false;
    if (activeCategory !== 'הכל' && !t.categories?.includes(activeCategory)) return false;
    return true;
  });
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2 border-b">
        <div className="relative"><Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input placeholder="חפש תבניות..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-8 text-xs" /></div>
      </div>
      <div className="px-2 pt-1.5 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
        {allCats.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={cn('px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors', activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{cat}</button>))}
      </div>
      <GridSizeControl value={gridSize} onChange={setGridSize} />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">אין תבניות</p>
          : <div className={cn('grid gap-2', gridSize === 1 ? 'grid-cols-1' : gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {filtered.map((/** @type {any} */ t) => (
              <button key={t.id} onClick={() => { if (onApplyTemplate) onApplyTemplate(t); else if (t.background_url) onBackgroundChange(t.background_url); }} className="rounded-lg overflow-hidden border hover:border-primary transition-colors cursor-pointer text-right">
                <div className={cn('relative', gridSize === 1 ? 'aspect-[3/4]' : 'aspect-[2/3]')}>
                  {t.thumbnail_url || t.background_url ? <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground/40" /></div>}
                  {t.text_elements?.map((/** @type {any} */ el) => (<div key={el.id} style={{ position: 'absolute', left: `${(el.x / 595) * 100}%`, top: `${(el.y / 842) * 100}%`, width: `${(el.width / 595) * 100}%`, fontSize: `${Math.max(el.fontSize * 0.22, 4)}px`, fontFamily: el.fontFamily, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign, lineHeight: el.lineHeight, direction: 'rtl', pointerEvents: 'none', whiteSpace: 'pre-wrap', overflow: 'hidden' }}>{el.content}</div>))}
                </div>
                <p className="text-[10px] text-center p-1.5 truncate font-medium">{t.name}</p>
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
  const { data: categories = [] } = useQuery({ queryKey: ['bg-categories'], queryFn: () => base44.entities.BackgroundCategory.list('order', 50) });
  const { data: backgrounds = [], isLoading } = useQuery({ queryKey: ['backgrounds-picker'], queryFn: () => base44.entities.Background.list('-created_date', 200) });
  const allCats = ['הכל', ...categories.map((/** @type {any} */ c) => c.name)];
  const q = search.trim().toLowerCase();
  const filtered = backgrounds.filter((/** @type {any} */ bg) => {
    if (q && !bg.name?.toLowerCase().includes(q)) return false;
    if (activeCategory !== 'הכל' && !bg.categories?.includes(activeCategory)) return false;
    return true;
  });
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2 border-b"><div className="relative"><Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input placeholder="חפש רקעים..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-8 text-xs" /></div></div>
      <div className="px-2 pt-1.5 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
        {allCats.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={cn('px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors', activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{cat}</button>))}
      </div>
      <GridSizeControl value={gridSize} onChange={setGridSize} />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">אין רקעים</p>
          : <div className={cn('grid gap-2', gridSize === 1 ? 'grid-cols-1' : gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {filtered.map((/** @type {any} */ bg) => (
              <button key={bg.id} onClick={() => onSelect(backgroundUrl === bg.image_url ? '' : bg.image_url)} className={cn('relative rounded-lg overflow-hidden border-2 transition-all', backgroundUrl === bg.image_url ? 'border-primary shadow-md' : 'border-transparent hover:border-border')}>
                <div className={cn(gridSize === 1 ? 'aspect-[3/4]' : 'aspect-[2/3]')}><img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" /></div>
                {backgroundUrl === bg.image_url && <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                <p className="text-[10px] text-center p-1.5 truncate">{bg.name}</p>
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
    <div className="flex items-center justify-end gap-1 px-3 pb-2 flex-shrink-0">
      <span className="text-[10px] text-muted-foreground ml-1">תצוגה:</span>
      {[1, 2, 3].map(s => (
        <button key={s} onClick={() => onChange(s)} className={cn('w-6 h-6 rounded flex items-center justify-center transition-colors', value === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')} title={s === 1 ? 'גדול' : s === 2 ? 'בינוני' : 'קטן'}>
          <div className={cn('grid gap-px', s === 1 ? 'grid-cols-1' : s === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {Array.from({ length: s * s }).map((_, i) => (<div key={i} className={cn(value === s ? 'bg-primary-foreground' : 'bg-muted-foreground', s === 1 ? 'w-2 h-2' : s === 2 ? 'w-1.5 h-1.5' : 'w-1 h-1')} />))}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Elements Tab ──
const ELEMENTS_PRESETS = [
  { id: 'e1', label: '✡️ מגן דוד', category: 'יהדות', content: '✡️', fontSize: 40 },
  { id: 'e2', label: '🕍 בית כנסת', category: 'יהדות', content: '🕍', fontSize: 40 },
  { id: 'e3', label: '📜 ספר תורה', category: 'יהדות', content: '📜', fontSize: 40 },
  { id: 'e4', label: '🕯️ נרות', category: 'יהדות', content: '🕯️', fontSize: 40 },
  { id: 'e5', label: '🔯 חותם', category: 'יהדות', content: '🔯', fontSize: 40 },
  { id: 'e6', label: '📖 ספר', category: 'יהדות', content: '📖', fontSize: 40 },
  { id: 'e7', label: '🕊️ יונה', category: 'יהדות', content: '🕊️', fontSize: 40 },
  { id: 'e8', label: '🌿 עלה', category: 'יהדות', content: '🌿', fontSize: 40 },
  { id: 'e9', label: '🕎 מנורה', category: 'יהדות', content: '🕎', fontSize: 40 },
  { id: 'e10', label: '🍷 כוס', category: 'יהדות', content: '🍷', fontSize: 40 },
  { id: 'e11', label: '✨ ניצוצות', category: 'כוכבים', content: '✨', fontSize: 40 },
  { id: 'e12', label: '⭐ כוכב', category: 'כוכבים', content: '⭐', fontSize: 40 },
  { id: 'e13', label: '🌟 זהב', category: 'כוכבים', content: '🌟', fontSize: 40 },
  { id: 'e15', label: '🌙 ירח', category: 'כוכבים', content: '🌙', fontSize: 40 },
  { id: 'e17', label: 'קו דק', category: 'מפרידים', content: '──────────', fontSize: 16, color: '#4a5568' },
  { id: 'e18', label: 'נקודות', category: 'מפרידים', content: '• • • • •', fontSize: 20, color: '#4a5568' },
  { id: 'e19', label: 'יהלומים', category: 'מפרידים', content: '❖ ❖ ❖', fontSize: 22, color: '#4a5568' },
  { id: 'e20', label: 'כוכביות', category: 'מפרידים', content: '✦ ✦ ✦', fontSize: 20, color: '#4a5568' },
  { id: 'e21', label: 'פרחים', category: 'מפרידים', content: '❀ ❀ ❀', fontSize: 22, color: '#d69e2e' },
  { id: 'e25', label: '🌸 פרח', category: 'טבע', content: '🌸', fontSize: 40 },
  { id: 'e27', label: '🌼 חמנית', category: 'טבע', content: '🌼', fontSize: 40 },
  { id: 'e28', label: '🌹 ורד', category: 'טבע', content: '🌹', fontSize: 40 },
];
const ELEM_CATS = ['הכל', 'יהדות', 'כוכבים', 'מפרידים', 'טבע'];

function ElementsTab({ onAddText }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('הכל');
  const filtered = useMemo(() => ELEMENTS_PRESETS.filter(e => {
    if (search && !e.label.includes(search)) return false;
    if (cat !== 'הכל' && e.category !== cat) return false;
    return true;
  }), [search, cat]);
  const isSep = (e) => e.category === 'מפרידים';
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2 border-b"><div className="relative"><Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input placeholder="חפש אלמנט..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-8 text-xs" /></div></div>
      <div className="px-2 pt-1.5 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
        {ELEM_CATS.map(c => (<button key={c} onClick={() => setCat(c)} className={cn('px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors', cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{c}</button>))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
        <div className="grid grid-cols-4 gap-2">
          {filtered.map(el => (
            <button key={el.id} onClick={() => onAddText?.({ content: el.content, fontSize: el.fontSize || 32, fontFamily: 'Heebo', fontWeight: '400', color: el.color || '#1a365d', textAlign: 'center' })}
              className={cn('rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-0.5 p-1', isSep(el) ? 'col-span-4 py-2' : 'aspect-square')}>
              <span style={{ fontSize: isSep(el) ? el.fontSize : Math.min(el.fontSize, 28), color: el.color || undefined, fontFamily: 'Heebo' }}>{el.content}</span>
              {!isSep(el) && <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center">{el.label.split(' ').slice(1).join(' ')}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

