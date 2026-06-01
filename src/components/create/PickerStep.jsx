import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Upload, Loader2, ChevronLeft, ChevronRight, Image, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import TemplatePicker from './TemplatePicker';
import BackgroundPicker from './BackgroundPicker';
import UploadFlyer from './UploadFlyer';

export default function PickerStep({ onDone }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const canProceed = selectedTemplate || selectedBackground;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Upload existing flyer option */}
      <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          יש לכם מודעה מוכנה? העלו אותה ונחלק אותה לתבנית ורקע אוטומטית
        </p>
        <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4" />
          העלאת מודעה מוכנה
        </Button>
      </div>

      {/* Two-panel picker */}
      <div className="flex-1 flex overflow-hidden">
        {/* Templates panel */}
        <div className="flex-1 flex flex-col border-l overflow-hidden">
          <div className="px-4 py-3 border-b bg-card flex items-center gap-2">
            <FileText className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-sm">תבנית טקסט</span>
            {selectedTemplate && (
              <span className="mr-auto text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> נבחר
              </span>
            )}
          </div>
          <TemplatePicker selected={selectedTemplate} onSelect={setSelectedTemplate} />
        </div>

        {/* Backgrounds panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-card flex items-center gap-2">
            <Image className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-sm">רקע / מסגרת</span>
            {selectedBackground && (
              <span className="mr-auto text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> נבחר
              </span>
            )}
          </div>
          <BackgroundPicker selected={selectedBackground} onSelect={setSelectedBackground} />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="h-16 border-t bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="text-sm text-muted-foreground">
          {!selectedTemplate && !selectedBackground && 'בחרו תבנית, רקע, או שניהם'}
          {selectedTemplate && !selectedBackground && `תבנית: ${selectedTemplate.name}`}
          {!selectedTemplate && selectedBackground && `רקע: ${selectedBackground.name}`}
          {selectedTemplate && selectedBackground && `${selectedTemplate.name} + ${selectedBackground.name}`}
        </div>
        <Button
          disabled={!canProceed}
          onClick={() => onDone(selectedTemplate, selectedBackground)}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
        >
          המשך לעריכה
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {showUpload && (
        <UploadFlyer onClose={() => setShowUpload(false)} onDone={onDone} />
      )}
    </div>
  );
}