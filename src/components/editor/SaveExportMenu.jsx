import React, { useState } from 'react';
import { Save, ChevronDown, Loader2, Image, FileText, Printer, LayoutTemplate, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * SaveExportMenu – unified save & export dropdown.
 *
 * Props (editor mode):
 *   canvasRef, title, onSaveDraft, onPublish, onSaveTemplate, isSaving
 *
 * Props (preview mode – no save actions):
 *   canvasRef, title
 *   onSaveDraft / onPublish / onSaveTemplate – omit or pass null
 */
export default function SaveExportMenu({
  canvasRef,
  title,
  onSaveDraft,
  onPublish,
  onSaveTemplate,
  isSaving = false,
}) {
  const [loading, setLoading] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateVisibility, setTemplateVisibility] = useState('private');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const hasEditActions = !!(onSaveDraft || onPublish || onSaveTemplate);

  // ── Capture canvas to HTMLCanvasElement ──────────────────────────────────
  const capture = async (withBackground = true) => {
    const el = canvasRef?.current;
    if (!el) return null;

    const bgImg = el.querySelector('.canvas-bg');
    if (bgImg && !withBackground) bgImg.style.display = 'none';

    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: withBackground ? null : '#ffffff',
      logging: false,
    });

    if (bgImg && !withBackground) bgImg.style.display = '';
    return canvas;
  };

  // ── Download PNG ─────────────────────────────────────────────────────────
  const downloadImage = async (withBackground) => {
    setLoading(true);
    const canvas = await capture(withBackground);
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${title || 'מודעה'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    setLoading(false);
  };

  // ── Download PDF ─────────────────────────────────────────────────────────
  const downloadPDF = async (withBackground) => {
    setLoading(true);
    const canvas = await capture(withBackground);
    if (canvas) {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' });
      const imgWidth = 200;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const yPos = Math.max((297 - imgHeight) / 2, 5);
      pdf.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 5, yPos, imgWidth, imgHeight);
      pdf.save(`${title || 'מודעה'}.pdf`);
    }
    setLoading(false);
  };

  // ── Print ────────────────────────────────────────────────────────────────
  const print = async (withBackground) => {
    setLoading(true);
    const canvas = await capture(withBackground);
    if (canvas) {
      const win = window.open('', '', 'width=800,height=1000');
      win.document.write(`
        <html><head><style>body{margin:0;display:flex;justify-content:center}img{max-width:100%}</style></head>
        <body><img src="${canvas.toDataURL()}" /></body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }
    setLoading(false);
  };

  // ── Save as template ─────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    setSavingTemplate(true);
    await onSaveTemplate(templateName.trim(), templateVisibility === 'public');
    setSavingTemplate(false);
    setShowTemplateDialog(false);
    setTemplateName('');
  };

  const busy = loading || isSaving;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={busy} className="gap-1.5 h-8 px-3 text-sm">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            שמור / הורד
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56" dir="rtl">

          {/* ── Save actions (editor only) ── */}
          {hasEditActions && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">שמירה</DropdownMenuLabel>
              {onSaveDraft && (
                <DropdownMenuItem onClick={onSaveDraft} className="gap-2 cursor-pointer">
                  <Save className="w-4 h-4 text-muted-foreground" />
                  שמור טיוטה
                </DropdownMenuItem>
              )}
              {onPublish && (
                <DropdownMenuItem onClick={onPublish} className="gap-2 cursor-pointer">
                  <FileDown className="w-4 h-4 text-primary" />
                  שמור מודעה
                </DropdownMenuItem>
              )}
              {onSaveTemplate && (
                <DropdownMenuItem onClick={() => { setTemplateName(title || ''); setShowTemplateDialog(true); }} className="gap-2 cursor-pointer">
                  <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                  שמור כתבנית
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* ── Download PNG ── */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">הורדה לתמונה (PNG)</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => downloadImage(true)} className="gap-2 cursor-pointer">
            <Image className="w-4 h-4 text-primary" />
            PNG עם רקע
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadImage(false)} className="gap-2 cursor-pointer">
            <Image className="w-4 h-4 text-muted-foreground" />
            PNG ללא רקע
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ── Download PDF ── */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">הורדה ל-PDF</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => downloadPDF(true)} className="gap-2 cursor-pointer">
            <FileText className="w-4 h-4 text-primary" />
            PDF עם רקע
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadPDF(false)} className="gap-2 cursor-pointer">
            <FileText className="w-4 h-4 text-muted-foreground" />
            PDF ללא רקע
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ── Print ── */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">הדפסה</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => print(true)} className="gap-2 cursor-pointer">
            <Printer className="w-4 h-4 text-primary" />
            הדפס עם רקע
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => print(false)} className="gap-2 cursor-pointer">
            <Printer className="w-4 h-4 text-muted-foreground" />
            הדפס ללא רקע
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>שמור כתבנית</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div>
              <Label htmlFor="tmpl-name" className="text-sm mb-1.5 block">שם התבנית</Label>
              <Input
                id="tmpl-name"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="לדוגמה: תבנית שבת שלום"
                onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">מי יכול להשתמש בתבנית?</Label>
              <RadioGroup value={templateVisibility} onValueChange={setTemplateVisibility} className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setTemplateVisibility('private')}>
                  <RadioGroupItem value="private" id="tmpl-private" />
                  <Label htmlFor="tmpl-private" className="cursor-pointer flex-1">
                    <div className="font-medium text-sm">רק בית הכנסת שלי</div>
                    <div className="text-xs text-muted-foreground">תבנית פרטית</div>
                  </Label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setTemplateVisibility('public')}>
                  <RadioGroupItem value="public" id="tmpl-public" />
                  <Label htmlFor="tmpl-public" className="cursor-pointer flex-1">
                    <div className="font-medium text-sm">שתף עם כל הקהילה</div>
                    <div className="text-xs text-muted-foreground">גלוי לכלל המשתמשים</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim() || savingTemplate}>
              {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutTemplate className="w-4 h-4" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}