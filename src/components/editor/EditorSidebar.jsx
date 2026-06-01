import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Type, Image, Loader2, FileText, Trash2, Plus } from 'lucide-react';
import TextToolbar from './TextToolbar';

const CATEGORIES = ['ברכת תודה', 'בדק הבית', 'נר למאור', 'פרנס יום/חודש/שנה', 'עריכת נפש', 'שבועות', 'כללי'];

export default function EditorSidebar({
  title,
  category,
  synagogueName,
  isShared,
  onTitleChange,
  onCategoryChange,
  onSynagogueNameChange,
  onIsSharedChange,
  backgroundUrl,
  onBackgroundChange,
  textElements,
  selectedElementId,
  onUpdateElement,
  onAddTextElement,
  onDeleteElement,
  logoUrl,
  onLogoChange,
  onLogoRemove,
}) {
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: backgrounds = [] } = useQuery({
    queryKey: ['editor-backgrounds'],
    queryFn: () => base44.entities.Background.list('-created_date', 50),
  });

  const selectedElement = textElements.find(el => el.id === selectedElementId);

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onBackgroundChange(file_url);
    setUploadingBg(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onLogoChange(file_url);
    setUploadingLogo(false);
  };

  return (
    <div className="w-80 border-r border-border bg-card h-full overflow-y-auto flex-shrink-0">
      <Tabs defaultValue="settings" className="h-full">
        <TabsList className="w-full rounded-none border-b bg-muted/50 p-1 h-auto">
          <TabsTrigger value="settings" className="text-xs flex-1">הגדרות</TabsTrigger>
          <TabsTrigger value="background" className="text-xs flex-1">רקע</TabsTrigger>
          <TabsTrigger value="text" className="text-xs flex-1">טקסט</TabsTrigger>
          <TabsTrigger value="logo" className="text-xs flex-1">לוגו</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="p-4 space-y-4 mt-0">
          <div>
            <Label className="text-xs">שם המודעה</Label>
            <Input value={title} onChange={e => onTitleChange(e.target.value)} className="mt-1" placeholder="מודעה חדשה" />
          </div>
          <div>
            <Label className="text-xs">שם בית הכנסת</Label>
            <Input value={synagogueName} onChange={e => onSynagogueNameChange(e.target.value)} className="mt-1" placeholder="שם בית הכנסת" />
          </div>
          <div>
            <Label className="text-xs">קטגוריה</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחרו קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs">שתף עם הקהילה</Label>
            <Switch checked={isShared} onCheckedChange={onIsSharedChange} />
          </div>
        </TabsContent>

        {/* Background Tab */}
        <TabsContent value="background" className="p-4 mt-0">
          <div className="space-y-4">
            <input type="file" accept="image/*" id="bg-editor-upload" className="hidden" onChange={handleBgUpload} />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => document.getElementById('bg-editor-upload').click()}
              disabled={uploadingBg}
            >
              {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              העלאת רקע
            </Button>

            {backgroundUrl && (
              <Button variant="ghost" className="w-full text-destructive" onClick={() => onBackgroundChange('')}>
                <Trash2 className="w-4 h-4 ml-2" /> הסר רקע
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              {backgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => onBackgroundChange(bg.image_url)}
                  className={`rounded-lg overflow-hidden border-2 transition-all hover:border-secondary ${
                    backgroundUrl === bg.image_url ? 'border-secondary' : 'border-transparent'
                  }`}
                >
                  <img src={bg.image_url} alt={bg.name} className="w-full aspect-[3/4] object-cover" />
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="mt-0">
          <div className="p-4 pb-2">
            <Button
              onClick={onAddTextElement}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף שדה טקסט
            </Button>

            {selectedElement && (
              <Button
                variant="ghost"
                className="w-full text-destructive mt-2"
                onClick={() => onDeleteElement(selectedElementId)}
              >
                <Trash2 className="w-4 h-4 ml-2" /> מחק שדה טקסט
              </Button>
            )}
          </div>

          <TextToolbar
            element={selectedElement}
            onUpdate={(updates) => selectedElementId && onUpdateElement(selectedElementId, updates)}
          />

          {/* Text elements list */}
          <div className="p-4 pt-2 border-t">
            <label className="text-xs text-muted-foreground mb-2 block">שדות טקסט ({textElements.length})</label>
            <div className="space-y-1">
              {textElements.map(el => (
                <button
                  key={el.id}
                  onClick={() => {}}
                  className={`w-full text-right text-xs p-2 rounded transition-colors truncate ${
                    selectedElementId === el.id ? 'bg-secondary/20 text-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {el.content || 'טקסט ריק'}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo" className="p-4 mt-0 space-y-4">
          <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={handleLogoUpload} />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => document.getElementById('logo-upload').click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת לוגו
          </Button>

          {logoUrl && (
            <>
              <div className="rounded-lg border p-4 flex items-center justify-center bg-muted/50">
                <img src={logoUrl} alt="לוגו" className="max-h-24 object-contain" />
              </div>
              <Button variant="ghost" className="w-full text-destructive" onClick={onLogoRemove}>
                <Trash2 className="w-4 h-4 ml-2" /> הסר לוגו
              </Button>
            </>
          )}

          {!logoUrl && (
            <p className="text-xs text-muted-foreground text-center">
              העלו את הלוגו של בית הכנסת והוא יופיע על המודעה
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}