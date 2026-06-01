import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAGE_SIZES = {
  A4: { name: 'A4', width: 210, height: 297 }, // mm
  A3: { name: 'A3', width: 297, height: 420 }, // mm
};

const QUALITY_LEVELS = {
  high: { name: 'גבוהה (HD)', scale: 2, quality: 1 },
  medium: { name: 'בינונית (Normal)', scale: 1.5, quality: 0.9 },
  low: { name: 'נמוכה (Fast)', scale: 1, quality: 0.8 },
};

export default function PDFExportDialog({ open, onOpenChange, announcement, canvasRef }) {
  const [pageSize, setPageSize] = useState('A4');
  const [quality, setQuality] = useState('high');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!canvasRef?.current) return;

    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      const size = PAGE_SIZES[pageSize];
      const qualityConfig = QUALITY_LEVELS[quality];

      // Capture canvas with selected quality
      const image = await html2canvas(canvas, {
        scale: qualityConfig.scale,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      });

      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: size.width > size.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: pageSize,
      });

      const imgWidth = size.width - 10; // 5mm margins on each side
      const imgHeight = (image.height / image.width) * imgWidth;
      const yPos = (size.height - imgHeight) / 2; // Center vertically

      pdf.addImage(
        image.toDataURL('image/jpeg', qualityConfig.quality),
        'JPEG',
        5,
        yPos > 0 ? yPos : 5,
        imgWidth,
        imgHeight
      );

      pdf.save(`${announcement.title}.pdf`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייצוא ל-PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Page Size Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">גודל דף</Label>
            <RadioGroup value={pageSize} onValueChange={setPageSize}>
              {Object.entries(PAGE_SIZES).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={key} id={`size-${key}`} />
                  <Label htmlFor={`size-${key}`} className="cursor-pointer flex-1 m-0">
                    <div className="font-medium text-sm">{value.name}</div>
                    <div className="text-xs text-muted-foreground">{value.width}mm × {value.height}mm</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Quality Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">איכות</Label>
            <RadioGroup value={quality} onValueChange={setQuality}>
              {Object.entries(QUALITY_LEVELS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={key} id={`quality-${key}`} />
                  <Label htmlFor={`quality-${key}`} className="cursor-pointer flex-1 m-0">
                    <div className="font-medium text-sm">{value.name}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isExporting ? 'מייצא...' : 'ייצוא'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}