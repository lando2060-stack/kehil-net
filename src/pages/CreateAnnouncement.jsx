import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabase';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Save, Loader2, ArrowRight, ZoomIn, ZoomOut, Maximize2, Sparkles,
  Undo2, Redo2, RectangleVertical, RectangleHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import EditorCanvas from '@/components/editor/EditorCanvas';
import RightPanel from '@/components/editor/RightPanel';
import SaveExportMenu from '@/components/editor/SaveExportMenu';

const DEFAULT_TEXT_ELEMENTS = [
  { id: 'title', content: 'כותרת המודעה', x: 147, y: 120, width: 300, fontSize: 36, fontFamily: 'Frank Ruhl Libre', fontWeight: '700', color: '#1a365d', textAlign: 'center', lineHeight: 1.3 },
  { id: 'subtitle', content: 'כותרת משנה', x: 147, y: 200, width: 300, fontSize: 20, fontFamily: 'Heebo', fontWeight: '500', color: '#2c5282', textAlign: 'center', lineHeight: 1.4 },
  { id: 'body', content: 'תוכן המודעה...', x: 80, y: 300, width: 440, fontSize: 16, fontFamily: 'Heebo', fontWeight: '400', color: '#4a5568', textAlign: 'center', lineHeight: 1.6 },
];

// Calculates how different the current elements are from the source template (0–1)
function calcTemplateChange(original, current) {
  const orig = original || [];
  const cur = current || [];
  const origText = orig.map(e => e.content || '').join(' ');
  const curText = cur.map(e => e.content || '').join(' ');
  const origWords = origText.split(/\s+/).filter(Boolean);
  const curWords = new Set(curText.split(/\s+/).filter(Boolean));
  if (origWords.length === 0) return cur.length > 0 ? 1 : 0;
  const unchanged = origWords.filter(w => curWords.has(w)).length;
  const textChange = 1 - unchanged / origWords.length;
  const countChange = Math.abs(cur.length - orig.length) / Math.max(orig.length, 1);
  return Math.max(textChange, countChange);
}

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');

  const [title, setTitle] = useState('מודעה חדשה');
  const [synagogueName, setSynagogueName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [textElements, setTextElements] = useState(/** @type {any[]} */ ([]));
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [canvasWidth, setCanvasWidth] = useState(595);
  const [canvasHeight, setCanvasHeight] = useState(842);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [credits, setCredits] = useState(/** @type {number|null} */ (null));
  const [sourceTemplate, setSourceTemplate] = useState(/** @type {any} */ (null));

  useEffect(() => {
    base44.auth.me().then(u => {
      setSynagogueName(u?.synagogue_name || '');
      setCredits(u?.credits ?? 10);
    }).catch(() => {});
  }, []);

  // ── History (Undo/Redo) ──
  const historyRef = useRef([JSON.stringify([])]);
  const historyIdxRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const textElementsRef = useRef(textElements);

  useEffect(() => { textElementsRef.current = textElements; }, [textElements]);

  const pushHistory = useCallback((/** @type {any[]} */ elements) => {
    const snap = JSON.stringify(elements);
    if (historyRef.current[historyIdxRef.current] === snap) return;
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIdxRef.current = historyRef.current.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
    setIsDirty(true);
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const prev = JSON.parse(historyRef.current[historyIdxRef.current]);
    setTextElements(prev);
    setSelectedElementId(null);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const next = JSON.parse(historyRef.current[historyIdxRef.current]);
    setTextElements(next);
    setSelectedElementId(null);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, []);

  // Called by TextElement after drag/resize/text edit ends
  const handleCommitElement = useCallback(() => {
    pushHistory(textElementsRef.current);
  }, [pushHistory]);

  // ── Keyboard shortcuts (global) ──
  useEffect(() => {
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ── beforeunload warning ──
  useEffect(() => {
    const handler = (/** @type {BeforeUnloadEvent} */ e) => {
      if (isDirty && !isSaved) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, isSaved]);

  const safeNavigate = (/** @type {any} */ path) => {
    if (isDirty && !isSaved) {
      if (window.confirm('יש שינויים שלא נשמרו. לצאת בלי לשמור?')) navigate(path);
    } else {
      navigate(path);
    }
  };

  const { data: existingAnnouncement } = useQuery({
    queryKey: ['announcement', editId],
    queryFn: () => base44.entities.Announcement.get(/** @type {string} */ (editId)),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingAnnouncement && !loaded) {
      setTitle(existingAnnouncement.title || '');
      setSynagogueName(existingAnnouncement.synagogue_name || '');
      setIsShared(existingAnnouncement.is_shared || false);
      setBackgroundUrl(existingAnnouncement.background_url || '');
      setLogoUrl(existingAnnouncement.logo_url || '');
      const els = existingAnnouncement.text_elements?.length ? existingAnnouncement.text_elements : DEFAULT_TEXT_ELEMENTS;
      setTextElements(els);
      historyRef.current = [JSON.stringify(els)];
      historyIdxRef.current = 0;
      setOrientation(existingAnnouncement.orientation || 'portrait');
      setLoaded(true);
      setIsDirty(false);
    }
  }, [existingAnnouncement, loaded]);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveVisibility, setSaveVisibility] = useState('private');
  const [savePending, setSavePending] = useState(/** @type {any} */ (null));

  const saveMutation = useMutation({
    mutationFn: async (/** @type {{asDraft: boolean, shared: boolean}} */ { asDraft, shared }) => {
      const data = {
        title, synagogue_name: synagogueName, is_shared: shared,
        background_url: backgroundUrl, logo_url: logoUrl,
        text_elements: textElements, is_draft: asDraft, orientation,
        canvas_width: canvasWidth, canvas_height: canvasHeight,
      };
      if (editId) return base44.entities.Announcement.update(editId, data);
      return base44.entities.Announcement.create(data);
    },
    onSuccess: async (_, { asDraft, shared }) => {
      toast.success(asDraft ? 'נשמר כטיוטה' : 'המודעה פורסמה');
      // Credits: publishing costs 1, sharing to community grants 1
      if (!asDraft) {
        try {
          const user = await base44.auth.me();
          const cur = user?.credits ?? 10;
          const bonus = shared ? 1 : 0;
          await base44.auth.updateMe({ credits: Math.max(0, cur - 1 + bonus) });
          setCredits(Math.max(0, cur - 1 + bonus));
        } catch {}
      }
      setIsDirty(false);
      setIsSaved(true);
      navigate('/my-announcements');
    },
    onError: () => toast.error('שגיאה בשמירה'),
  });

  const handleSave = (/** @type {boolean} */ asDraft) => {
    if (!asDraft && credits !== null && credits <= 0) {
      toast.error('אין לך מספיק קרדיטים לפרסום. שתף מודעות עם הקהילה כדי לקבל קרדיטים.');
      return;
    }
    if (asDraft) {
      saveMutation.mutate({ asDraft: true, shared: false });
    } else {
      setShowSaveDialog(true);
      setSaveVisibility('private');
      setSavePending({ asDraft });
    }
  };

  const confirmSave = () => {
    saveMutation.mutate({ asDraft: savePending?.asDraft, shared: saveVisibility === 'public' });
    setShowSaveDialog(false);
  };

  // ── Element handlers ──
  const handleUpdateElement = useCallback((/** @type {string} */ id, /** @type {any} */ updates) => {
    setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    setIsDirty(true);
  }, []);

  const handleAddText = useCallback((/** @type {any} */ overrides = {}) => {
    const newEl = {
      id: `text-${Date.now()}`, content: overrides.content || 'טקסט חדש',
      x: 150, y: 350, width: 280,
      fontSize: overrides.fontSize || 20,
      fontFamily: overrides.fontFamily || 'Heebo',
      fontWeight: overrides.fontWeight || '400',
      color: overrides.color || '#1a365d',
      textAlign: overrides.textAlign || 'center',
      lineHeight: 1.4,
      backgroundColor: overrides.backgroundColor,
      borderRadius: overrides.borderRadius,
      padding: overrides.padding,
      textShadow: overrides.textShadow,
    };
    setTextElements(prev => {
      const next = [...prev, newEl];
      pushHistory(next);
      return next;
    });
    setSelectedElementId(newEl.id);
  }, [pushHistory]);

  const handleDeleteElement = useCallback((/** @type {string} */ id) => {
    setTextElements(prev => {
      const next = prev.filter(el => el.id !== id);
      pushHistory(next);
      return next;
    });
    if (selectedElementId === id) setSelectedElementId(null);
  }, [selectedElementId, pushHistory]);

  const handleDuplicateElement = useCallback((/** @type {string} */ id) => {
    setTextElements(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      const clone = { ...el, id: `text-${Date.now()}`, x: el.x + 15, y: el.y + 15 };
      const next = [...prev, clone];
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleBringForward = useCallback((/** @type {string} */ id) => {
    setTextElements(prev => {
      const idx = prev.findIndex(e => e.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleSendBackward = useCallback((/** @type {string} */ id) => {
    setTextElements(prev => {
      const idx = prev.findIndex(e => e.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleReplaceColor = useCallback((oldColor, newColor) => {
    const hexToRgb = (hex) => { const c = hex.replace('#', ''); return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) }; };
    const similar = (c1, c2) => {
      if (!c1 || !c2) return false;
      const a = hexToRgb(c1.toLowerCase()), b = hexToRgb(c2.toLowerCase());
      return Math.abs(a.r-b.r) + Math.abs(a.g-b.g) + Math.abs(a.b-b.b) < 20;
    };
    setTextElements(prev => {
      const next = prev.map(el => similar(el.color, oldColor) ? { ...el, color: newColor } : el);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const selectedElement = textElements.find(el => el.id === selectedElementId);

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateAnnouncementContent', {});
      return response.data;
    },
    onSuccess: (data) => {
      setTitle(data.title);
      setTextElements(data.textElements);
      pushHistory(data.textElements);
      toast.success('נוסח חדש נוצר!');
    },
    onError: () => toast.error('שגיאה בהפקת נוסח'),
  });

  const [zoom, setZoom] = useState(0.75);
  const zoomIn = () => setZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))));
  const zoomOut = () => setZoom(z => Math.max(0.25, parseFloat((z - 0.1).toFixed(1))));
  const zoomFit = () => setZoom(0.75);

  const canvasRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const isPanelDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const handleResizeMouseDown = useCallback((e) => {
    isPanelDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    const onMove = (ev) => {
      if (!isPanelDragging.current) return;
      const delta = dragStartX.current - ev.clientX;
      setPanelWidth(Math.max(200, Math.min(520, dragStartWidth.current + delta)));
    };
    const onUp = () => {
      isPanelDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  }, [panelWidth]);

  return (
    <div className="h-screen flex flex-col bg-[#f0f0f0]">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-3 flex-shrink-0 shadow-sm z-20" dir="rtl">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => safeNavigate(-1)}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="text-sm font-medium bg-transparent border-0 outline-none w-36 hover:bg-muted/50 rounded px-2 py-1"
          />
          {isDirty && !isSaved && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">לא שמור</span>
          )}
        </div>

        {/* Center: Undo/Redo + orientation */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
              title="בטל (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
              title="חזור (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Orientation */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setOrientation('portrait')}
              className={`w-8 h-7 flex items-center justify-center rounded-md transition-colors ${orientation === 'portrait' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="אנכי"
            >
              <RectangleVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`w-8 h-7 flex items-center justify-center rounded-md transition-colors ${orientation === 'landscape' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="אופקי"
            >
              <RectangleHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button
            variant="outline"
            onClick={() => generateContentMutation.mutate()}
            disabled={generateContentMutation.isPending}
            className="gap-1.5 h-8 px-2.5 text-xs"
            title="הפקת נוסח חדש בעזרת AI"
          >
            {generateContentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI
          </Button>
          <SaveExportMenu
            canvasRef={canvasRef}
            title={title}
            isSaving={saveMutation.isPending}
            onSaveDraft={() => handleSave(true)}
            onPublish={() => handleSave(false)}
            onSaveTemplate={async (name, isPublic) => {
              await base44.entities.Template.create({ name, background_url: backgroundUrl, text_elements: textElements, is_shared: isPublic });
              // Check 20% change threshold for credit
              if (isPublic && sourceTemplate) {
                const changePercent = calcTemplateChange(sourceTemplate.text_elements, textElements);
                if (changePercent >= 0.2) {
                  try {
                    const me = await base44.auth.me();
                    await base44.auth.updateMe({
                      credits: (me?.credits ?? 0) + 1,
                      credits_from_shares: (me?.credits_from_shares ?? 0) + 1,
                    });
                    toast.success('נשמר כתבנית! קיבלת קרדיט על שינוי משמעותי (20%+) 🎉');
                  } catch { toast.success('נשמר כתבנית!'); }
                } else {
                  toast.success('נשמר כתבנית! (פחות מ-20% שינוי — לא הושג קרדיט)');
                }
              } else {
                toast.success('נשמר כתבנית!');
              }
            }}
          />
        </div>
      </div>

      {/* Main editor — LTR layout so panel sits on right */}
      <div className="flex flex-row flex-1 overflow-hidden" style={{ direction: 'ltr' }}>
        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-8 relative" style={{ direction: 'rtl' }}>
          {/* Zoom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-border px-2 py-1.5">
            <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="הקטן">
              <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={zoomFit} className="px-2 h-7 text-xs font-mono font-semibold hover:bg-muted rounded-lg transition-colors min-w-[44px] text-center" title="75%">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="הגדל">
              <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button onClick={zoomFit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="ברירת מחדל">
              <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}>
            <EditorCanvas
              backgroundUrl={backgroundUrl}
              textElements={textElements}
              selectedId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              canvasRefProp={canvasRef}
              orientation={orientation}
              onCommitElement={handleCommitElement}
              logoUrl={logoUrl}
              logoPosition={undefined}
              onLogoUpdate={undefined}
            />
          </div>
        </div>

        {/* Panel — right */}
        <div className="flex flex-shrink-0 h-full" style={{ width: panelWidth }}>
          <div
            onMouseDown={handleResizeMouseDown}
            className="w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors flex-shrink-0 group"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-0.5 h-10 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
          <RightPanel
            backgroundUrl={backgroundUrl}
            onBackgroundChange={(/** @type {string} */ url) => { setBackgroundUrl(url); setIsDirty(true); }}
            onAddText={handleAddText}
            textElements={textElements}
            onReplaceColor={handleReplaceColor}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            onApplyTemplate={(/** @type {any} */ template) => {
              if (template.background_url) { setBackgroundUrl(template.background_url); setIsDirty(true); }
              if (template.text_elements?.length) {
                setTextElements(template.text_elements);
                pushHistory(template.text_elements);
              }
              setSourceTemplate(template);
            }}
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            title={title}
            onTitleChange={(/** @type {string} */ v) => { setTitle(v); setIsDirty(true); }}
            orientation={orientation}
            onOrientationChange={setOrientation}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onCanvasSizeChange={(/** @type {number} */ w, /** @type {number} */ h) => { setCanvasWidth(w); setCanvasHeight(h); setIsDirty(true); }}
            synagogueName={synagogueName}
            sourceTemplateId={sourceTemplate?.id}
            onRecordBackgroundUsage={async (/** @type {string} */ bgId) => {
              if (!sourceTemplate?.id || !bgId) return;
              try {
                const { data: existing } = await supabase
                  .from('template_background_usage')
                  .select('id, used_count')
                  .eq('template_id', sourceTemplate.id)
                  .eq('background_id', bgId)
                  .single();
                if (existing) {
                  await supabase.from('template_background_usage')
                    .update({ used_count: (existing.used_count || 1) + 1 })
                    .eq('id', existing.id);
                } else {
                  await supabase.from('template_background_usage')
                    .insert({ template_id: sourceTemplate.id, background_id: bgId, used_count: 1 });
                }
              } catch {}
            }}
          />
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרסם מודעה</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Label className="text-sm font-medium">מי יכול לראות את המודעה?</Label>
            <RadioGroup value={saveVisibility} onValueChange={setSaveVisibility} className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setSaveVisibility('private')}>
                <RadioGroupItem value="private" id="save-private" />
                <Label htmlFor="save-private" className="cursor-pointer flex-1">
                  <div className="font-medium text-sm">רק בית הכנסת שלי</div>
                  <div className="text-xs text-muted-foreground">גלוי רק לכם</div>
                </Label>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setSaveVisibility('public')}>
                <RadioGroupItem value="public" id="save-public" />
                <Label htmlFor="save-public" className="cursor-pointer flex-1">
                  <div className="font-medium text-sm">שתף עם כל הקהילה</div>
                  <div className="text-xs text-muted-foreground">גלוי לכלל המשתמשים</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>ביטול</Button>
            <Button onClick={confirmSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              פרסם
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
