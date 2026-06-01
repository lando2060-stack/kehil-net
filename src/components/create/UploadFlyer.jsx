import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Scissors, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import FlyerSplitReview from './FlyerSplitReview';

export default function UploadFlyer({ onClose, onDone }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [bgName, setBgName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [llmFailed, setLlmFailed] = useState(false);

  const [reviewData, setReviewData] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setTemplateName(f.name.replace(/\.[^.]+$/, '') + ' - תבנית');
    setBgName(f.name.replace(/\.[^.]+$/, '') + ' - רקע');
    setLlmFailed(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) /** @type {any} */ (setPreview)(ev.target.result);
    };
    reader.readAsDataURL(f);
    setReviewData(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setLlmFailed(false);
    try {
      // Step 1: Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Try AI text extraction (optional — failure is OK)
      let textElements = [];
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Look at this announcement image and return a JSON with all text elements visible. For each text element provide: id (unique string), content (the actual text), x, y (position on 595x842 canvas), width, fontSize, fontWeight ("700" for headings, "400" for body), color (hex), textAlign ("right"/"center"/"left"), lineHeight (1.4). All text is Hebrew RTL.',
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: {
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
        const extracted = (/** @type {any} */ (result))?.text_elements;
        if (Array.isArray(extracted) && extracted.length > 0) {
          textElements = extracted;
        } else {
          setLlmFailed(true);
        }
      } catch {
        setLlmFailed(true);
      }

      // Step 3: Move to review (even with 0 text elements)
      /** @type {any} */ (setReviewData)({ imageUrl: file_url, textElements });
    } catch {
      toast.error('שגיאה בהעלאת הקובץ — נסה שוב');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async (finalTextElements, imageUrl) => {
    setSaving(true);
    try {
      const [template, background] = await Promise.all([
        base44.entities.Template.create({
          name: templateName || 'תבנית חדשה',
          text_elements: finalTextElements,
          thumbnail_url: imageUrl,
          background_url: imageUrl,
          is_shared: true,
          categories: [],
        }),
        base44.entities.Background.create({
          name: bgName || 'רקע חדש',
          image_url: imageUrl,
          is_shared: true,
          categories: [],
        }),
      ]);

      queryClient.invalidateQueries({ queryKey: ['templates-picker'] });
      queryClient.invalidateQueries({ queryKey: ['backgrounds-picker'] });
      queryClient.invalidateQueries({ queryKey: ['admin-backgrounds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });

      toast.success('הופרד לתבנית ורקע בהצלחה!');
      onDone(template, background);
      onClose();
    } catch {
      toast.error('שגיאה בשמירה — נסה שוב');
      setSaving(false);
    }
  };

  const handleSkipAI = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      /** @type {any} */ (setReviewData)({ imageUrl: file_url, textElements: [] });
    } catch {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={reviewData ? 'max-w-2xl' : 'max-w-md'} dir="rtl">
        <DialogTitle>העלאת מודעה מוכנה</DialogTitle>
        <DialogDescription>
          {reviewData
            ? 'בדקו את הפיצול — לחצו על טקסטים כדי לסווג אותם כתבנית (ניתן לעריכה) או כחלק מהרקע'
            : 'העלו תמונת מודעה — המערכת תנסה לחלץ טקסטים אוטומטית'}
        </DialogDescription>

        {/* ── שלב 1: העלאה ושמות ── */}
        {!reviewData && (
          <div className="space-y-4 mt-2">
            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('flyer-upload-input')?.click()}
            >
              <input
                type="file"
                accept="image/*"
                id="flyer-upload-input"
                className="hidden"
                onChange={handleFile}
              />
              {preview ? (
                <img src={preview} alt="" className="max-h-48 mx-auto rounded object-contain" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">לחצו לבחירת קובץ תמונה</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP</p>
                </>
              )}
            </div>

            {/* Names */}
            {file && (
              <div className="space-y-3 bg-muted/30 rounded-xl p-3">
                <div>
                  <Label className="text-xs text-muted-foreground">שם התבנית</Label>
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">שם הרקע</Label>
                  <Input value={bgName} onChange={e => setBgName(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} className="text-sm">ביטול</Button>
              {file && (
                <Button
                  variant="outline"
                  onClick={handleSkipAI}
                  disabled={processing}
                  className="text-sm gap-1.5"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  שמור כרקע בלבד
                </Button>
              )}
              <Button
                disabled={!file || processing}
                onClick={handleProcess}
                className="bg-primary text-primary-foreground gap-2 text-sm"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                {processing ? 'מעבד עם AI...' : 'עיבוד והפרדה (AI)'}
              </Button>
            </div>
          </div>
        )}

        {/* ── שלב 2: סקירת פיצול ── */}
        {reviewData && (
          <div className="mt-2">
            {/* LLM failure notice */}
            {llmFailed && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>חילוץ טקסטים אוטומטי לא הצליח — ניתן לאשר ולשמור את הרקע בלבד, הטקסטים יתווספו בעורך</span>
              </div>
            )}

            {saving ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">שומר תבנית ורקע...</span>
              </div>
            ) : (
              <FlyerSplitReview
                imageUrl={reviewData.imageUrl}
                textElements={reviewData.textElements}
                onConfirm={handleConfirm}
                onBack={() => { setReviewData(null); setLlmFailed(false); }}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
