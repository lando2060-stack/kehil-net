import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText, Image, Type, Shapes, BookMarked, Palette, Check, Search,
  Loader2, Plus, Minus, Bold, AlignRight, AlignCenter, AlignLeft, Trash2,
  Sparkles, Settings2, RectangleVertical, RectangleHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabase';
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
  sourceTemplateId, onRecordBackgroundUsage,
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
        {activeTab === 'backgrounds' && <BackgroundsTab backgroundUrl={backgroundUrl} onSelect={onBackgroundChange} sourceTemplateId={sourceTemplateId} onRecordUsage={onRecordBackgroundUsage} />}
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
            synagogueName={synagogueName}
            selectedElement={selectedElement}
            onUpdateElement={onUpdateElement}
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
const AI_MODES = [
  { id: 'generate', label: 'צור מודעה', icon: '✨' },
  { id: 'improve', label: 'שפר טקסט', icon: '✏️' },
  { id: 'title', label: 'כותרת חזקה', icon: '💡' },
  { id: 'shorten', label: 'קצר', icon: '⬇️' },
  { id: 'lengthen', label: 'הרחב', icon: '⬆️' },
  { id: 'synagogue', label: 'סגנון ביהכ"נ', icon: '🕍' },
];

function AITab({ onAddText, synagogueName, selectedElement, onUpdateElement }) {
  const [mode, setMode] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(/** @type {any} */ (null));
  const textareaRef = useRef(null);

  const { data: recentAnnouncements = [] } = useQuery({
    queryKey: ['ai-style-context'],
    queryFn: () => base44.entities.Announcement.list('-updated_date', 5),
    staleTime: 60000,
  });

  const selectedText = selectedElement?.content || '';

  const buildPrompt = () => {
    const styleContext = recentAnnouncements
      .filter((/** @type {any} */ a) => a.text_elements?.length)
      .slice(0, 3)
      .map((/** @type {any} */ a) => ({
        title: a.title,
        elements: a.text_elements?.slice(0, 3).map((/** @type {any} */ el) => ({
          content: el.content, fontSize: el.fontSize, color: el.color,
        })),
      }));
    const styleStr = styleContext.length > 0
      ? `\n\nסגנון המשתמש:\n${JSON.stringify(styleContext)}` : '';
    const shul = synagogueName ? `\nבית הכנסת: ${synagogueName}` : '';

    if (mode === 'generate') {
      return `אתה עוזר ליצירת מודעות לבית כנסת.${shul}${styleStr}

בקשה: ${prompt}

החזר JSON:
- title: כותרת קצרה
- text_elements: מערך של אלמנטים, כל אחד: id, content (עברית), x, y, width, fontSize, fontFamily (Heebo/Frank Ruhl Libre), fontWeight (700/400), color (hex), textAlign (right/center), lineHeight
כותרת ראשית: fontSize 36-48, fontWeight 700, Frank Ruhl Libre, y≈120
טקסט גוף: fontSize 15-18, fontWeight 400, Heebo, y≈280
מרכז הקנבס: x≈100-150, width≈300-420
כתוב בעברית מכובדת לבית כנסת.`;
    }
    if (mode === 'improve') {
      return `שפר את הטקסט הבא למודעה בבית כנסת. שמור על המשמעות אך שפר את הניסוח, השטף והנוכחות.${shul}
טקסט מקורי: "${selectedText || prompt}"
החזר JSON: { "improved_text": "הטקסט המשופר" }`;
    }
    if (mode === 'title') {
      return `צור כותרת חזקה ומשפיעה לבית כנסת.${shul}
נושא: ${prompt || selectedText}
החזר JSON: { "titles": ["כותרת 1", "כותרת 2", "כותרת 3"] }`;
    }
    if (mode === 'shorten') {
      return `קצר את הטקסט הבא לגרסה תמציתית וחזקה יותר (חצי האורך לכל היותר):
"${selectedText || prompt}"
החזר JSON: { "shortened": "הטקסט המקוצר" }`;
    }
    if (mode === 'lengthen') {
      return `הרחב את הטקסט הבא לגרסה מפורטת ועשירה יותר (כפולה בערך):
"${selectedText || prompt}"
${shul}
החזר JSON: { "lengthened": "הטקסט המורחב" }`;
    }
    if (mode === 'synagogue') {
      return `התאם את הטקסט הבא לסגנון מכובד, רשמי ויפה לבית כנסת:${shul}
טקסט: "${selectedText || prompt}"
החזר JSON: { "adapted": "הטקסט המותאם" }`;
    }
    return '';
  };

  const handleGenerate = async () => {
    const needsPrompt = (mode === 'generate' || mode === 'title') && !prompt.trim();
    const needsSelection = ['improve', 'shorten', 'lengthen', 'synagogue'].includes(mode) && !selectedText && !prompt.trim();
    if (needsPrompt || needsSelection) return;

    setLoading(true);
    setResult(null);
    try {
      const aiResult = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt() });
      const typed = /** @type {any} */ (aiResult);

      if (mode === 'generate' && typed?.text_elements?.length) {
        setResult({ type: 'elements', data: typed });
      } else if (mode === 'improve' && typed?.improved_text) {
        setResult({ type: 'text', label: 'טקסט משופר', value: typed.improved_text });
      } else if (mode === 'title' && typed?.titles?.length) {
        setResult({ type: 'list', label: 'כותרות מוצעות', items: typed.titles });
      } else if (mode === 'shorten' && typed?.shortened) {
        setResult({ type: 'text', label: 'טקסט מקוצר', value: typed.shortened });
      } else if (mode === 'lengthen' && typed?.lengthened) {
        setResult({ type: 'text', label: 'טקסט מורחב', value: typed.lengthened });
      } else if (mode === 'synagogue' && typed?.adapted) {
        setResult({ type: 'text', label: 'טקסט מותאם', value: typed.adapted });
      } else {
        setResult({ type: 'error', value: 'לא הצלחנו לייצר תוכן. נסה שנית.' });
      }
    } catch {
      setResult({ type: 'error', value: 'שגיאה בחיבור ל-AI. נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  const applyElements = () => {
    if (!result?.data?.text_elements) return;
    result.data.text_elements.forEach((/** @type {any} */ el) => onAddText({
      content: el.content, fontSize: el.fontSize, fontFamily: el.fontFamily,
      fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign,
      lineHeight: el.lineHeight, x: el.x, y: el.y, width: el.width,
    }));
    setResult(null); setPrompt('');
  };

  const applyTextToSelected = (text) => {
    if (selectedElement && onUpdateElement) {
      onUpdateElement(selectedElement.id, { content: text });
    } else {
      onAddText({ content: text, fontSize: 18, fontFamily: 'Heebo', fontWeight: '400', color: '#1a365d', textAlign: 'center' });
    }
    setResult(null); setPrompt('');
  };

  const modesNeedingSelection = ['improve', 'shorten', 'lengthen', 'synagogue'];
  const currentNeedsSelection = modesNeedingSelection.includes(mode);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" dir="rtl">
      <div className="p-3 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">עריכה בעזרת AI</p>
        </div>
        <p className="text-[10px] text-muted-foreground">6 אפשרויות AI לשיפור המודעה</p>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-1 p-2 border-b">
        {AI_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); }}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] font-medium transition-colors',
              mode === m.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="text-sm leading-none">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Selected element indicator */}
        {currentNeedsSelection && (
          <div className={cn(
            'rounded-lg px-3 py-2 text-xs',
            selectedElement ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
          )}>
            {selectedElement
              ? `✓ טקסט נבחר: "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '…' : ''}"`
              : 'בחר אלמנט טקסט בקנבס, או הכנס טקסט ידנית למטה'}
          </div>
        )}

        {/* Prompt input */}
        {(mode === 'generate' || mode === 'title' || !selectedElement) && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              {mode === 'generate' ? 'תאר את המודעה:' :
               mode === 'title' ? 'נושא לכותרת:' : 'טקסט לעריכה:'}
            </p>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                mode === 'generate' ? 'לדוגמה: "הזמנה לשיעור תורה יום שישי 7:00"' :
                mode === 'title' ? 'לדוגמה: "שמירת שקט בתפילה"' :
                'הכנס כאן את הטקסט לעריכה...'
              }
              className="w-full h-20 text-xs border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            />
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || (currentNeedsSelection && !selectedElement && !prompt.trim()) || ((mode === 'generate' || mode === 'title') && !prompt.trim())}
          className="w-full bg-primary text-primary-foreground gap-2"
          size="sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? 'מעבד...' : AI_MODES.find(m => m.id === mode)?.label}
        </Button>

        {/* Results */}
        {result?.type === 'elements' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-green-800">✓ המודעה נוצרה!</p>
            <div className="space-y-1">
              {result.data.text_elements?.slice(0, 4).map((/** @type {any} */ el, i) => (
                <div key={i} className="text-[10px] bg-white rounded-lg px-2 py-1.5 border border-green-100">
                  <span className="text-muted-foreground">{el.fontSize}px · </span>
                  <span className="font-medium">{el.content?.slice(0, 35)}{el.content?.length > 35 ? '…' : ''}</span>
                </div>
              ))}
            </div>
            <Button onClick={applyElements} className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5" size="sm">
              <Plus className="w-3.5 h-3.5" /> הוסף לקנבס
            </Button>
          </div>
        )}

        {result?.type === 'text' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-800">{result.label}</p>
            <p className="text-xs bg-white rounded-lg p-2 border border-blue-100 leading-relaxed whitespace-pre-wrap">{result.value}</p>
            <Button onClick={() => applyTextToSelected(result.value)} className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5" size="sm">
              <Check className="w-3.5 h-3.5" /> {selectedElement ? 'החלף טקסט נבחר' : 'הוסף לקנבס'}
            </Button>
          </div>
        )}

        {result?.type === 'list' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-purple-800">{result.label}</p>
            <div className="space-y-1.5">
              {result.items?.map((item, i) => (
                <button
                  key={i}
                  onClick={() => applyTextToSelected(item)}
                  className="w-full text-right text-xs bg-white rounded-lg px-3 py-2 border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {result?.type === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700">{result.value}</p>
          </div>
        )}

        {recentAnnouncements.length > 0 && mode === 'generate' && (
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
function BackgroundsTab({ backgroundUrl, onSelect, sourceTemplateId, onRecordUsage }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [gridSize, setGridSize] = useState(2);

  const { data: categories = [] } = useQuery({ queryKey: ['bg-categories'], queryFn: () => base44.entities.BackgroundCategory.list('order', 50) });
  const { data: backgrounds = [], isLoading } = useQuery({ queryKey: ['backgrounds-picker'], queryFn: () => base44.entities.Background.list('-created_date', 200) });

  // Recommended backgrounds based on template usage
  const { data: usageRows = [] } = useQuery({
    queryKey: ['template-bg-usage', sourceTemplateId],
    queryFn: async () => {
      const { data } = await supabase
        .from('template_background_usage')
        .select('background_id, used_count')
        .eq('template_id', sourceTemplateId)
        .order('used_count', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!sourceTemplateId,
  });

  const recommendedIds = new Set((usageRows || []).map((/** @type {any} */ r) => r.background_id));
  const recommended = (backgrounds || []).filter((/** @type {any} */ bg) => recommendedIds.has(bg.id));

  const allCats = ['הכל', ...categories.map((/** @type {any} */ c) => c.name)];
  const q = search.trim().toLowerCase();
  const filtered = (backgrounds || []).filter((/** @type {any} */ bg) => {
    if (q && !bg.name?.toLowerCase().includes(q)) return false;
    if (activeCategory !== 'הכל' && !bg.categories?.includes(activeCategory)) return false;
    return true;
  });

  const handleSelect = (/** @type {any} */ bg) => {
    const newUrl = backgroundUrl === bg.image_url ? '' : bg.image_url;
    onSelect(newUrl);
    if (newUrl && onRecordUsage) onRecordUsage(bg.id);
  };

  const BgGrid = ({ items }) => (
    <div className={cn('grid gap-2', gridSize === 1 ? 'grid-cols-1' : gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
      {items.map((/** @type {any} */ bg) => (
        <button key={bg.id} onClick={() => handleSelect(bg)} className={cn('relative rounded-lg overflow-hidden border-2 transition-all', backgroundUrl === bg.image_url ? 'border-primary shadow-md' : 'border-transparent hover:border-border')}>
          <div className={cn(gridSize === 1 ? 'aspect-[3/4]' : 'aspect-[2/3]')}><img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" /></div>
          {backgroundUrl === bg.image_url && <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
          <p className="text-[10px] text-center p-1.5 truncate">{bg.name}</p>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2 border-b"><div className="relative"><Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input placeholder="חפש רקעים..." value={search} onChange={e => setSearch(e.target.value)} className="pr-7 h-8 text-xs" /></div></div>
      <div className="px-2 pt-1.5 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
        {allCats.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={cn('px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 transition-colors', activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{cat}</button>))}
      </div>
      <GridSizeControl value={gridSize} onChange={setGridSize} />
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {/* Recommended section */}
        {recommended.length > 0 && !q && (
          <div>
            <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mb-2 flex items-center gap-1">
              ⭐ מומלצים לתבנית זו
            </p>
            <BgGrid items={recommended} />
          </div>
        )}

        {/* All backgrounds */}
        {isLoading
          ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          : filtered.length === 0
            ? <p className="text-center text-xs text-muted-foreground py-6">אין רקעים</p>
            : (
              <div>
                {recommended.length > 0 && !q && (
                  <p className="text-[10px] text-muted-foreground mb-2 px-1">כל הרקעים</p>
                )}
                <BgGrid items={filtered} />
              </div>
            )
        }
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

