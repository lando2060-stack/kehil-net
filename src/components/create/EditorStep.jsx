import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import EditorCanvas from '@/components/editor/EditorCanvas';
import TextToolbar from '@/components/editor/TextToolbar';
import { Plus, Trash2 } from 'lucide-react';

const DEFAULT_TEXT_ELEMENTS = [
  { id: 'title', content: 'כותרת המודעה', x: 150, y: 120, width: 300, fontSize: 36, fontFamily: 'var(--font-frank)', fontWeight: '700', color: '#1a365d', textAlign: 'center', lineHeight: 1.3 },
  { id: 'subtitle', content: 'כותרת משנה', x: 150, y: 200, width: 300, fontSize: 20, fontFamily: 'var(--font-heebo)', fontWeight: '500', color: '#2c5282', textAlign: 'center', lineHeight: 1.4 },
  { id: 'body', content: 'תוכן המודעה...', x: 80, y: 300, width: 440, fontSize: 16, fontFamily: 'var(--font-heebo)', fontWeight: '400', color: '#4a5568', textAlign: 'center', lineHeight: 1.6 },
];

export default function EditorStep({ editId, initialTemplate, initialBackground }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('מודעה חדשה');
  const [synagogueName, setSynagogueName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState(initialBackground?.image_url || '');
  const [textElements, setTextElements] = useState(
    initialTemplate?.text_elements?.length ? initialTemplate.text_elements : DEFAULT_TEXT_ELEMENTS
  );
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load for editing
  const { data: existingAnnouncement } = useQuery({
    queryKey: ['announcement', editId],
    queryFn: async () => {
      if (!editId) return null;
      const all = await base44.entities.Announcement.list();
      return all.find(a => a.id === editId) || null;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingAnnouncement && !loaded) {
      setTitle(existingAnnouncement.title || '');
      setSynagogueName(existingAnnouncement.synagogue_name || '');
      setIsShared(existingAnnouncement.is_shared || false);
      setBackgroundUrl(existingAnnouncement.background_url || '');
      setTextElements(existingAnnouncement.text_elements?.length ? existingAnnouncement.text_elements : DEFAULT_TEXT_ELEMENTS);
      setLoaded(true);
    }
  }, [existingAnnouncement, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { title, synagogue_name: synagogueName, is_shared: isShared, background_url: backgroundUrl, text_elements: textElements };
      if (editId) return base44.entities.Announcement.update(editId, data);
      return base44.entities.Announcement.create(data);
    },
    onSuccess: () => {
      toast.success('המודעה נשמרה');
      navigate('/my-announcements');
    },
  });

  const handleUpdateElement = useCallback((id, updates) => {
    setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleAddTextElement = useCallback(() => {
    const newEl = { id: `text-${Date.now()}`, content: 'טקסט חדש', x: 150, y: 350, width: 300, fontSize: 18, fontFamily: 'var(--font-heebo)', fontWeight: '400', color: '#1a365d', textAlign: 'center', lineHeight: 1.4 };
    setTextElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  }, []);

  const handleDeleteElement = useCallback((id) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    setSelectedElementId(null);
  }, []);

  const selectedElement = textElements.find(el => el.id === selectedElementId);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Right panel: text toolbar + settings */}
      <div className="w-72 border-l bg-card flex flex-col overflow-hidden flex-shrink-0">
        {/* Settings */}
        <div className="p-4 border-b space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">שם המודעה</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">בית כנסת</Label>
            <Input value={synagogueName} onChange={e => setSynagogueName(e.target.value)} className="mt-1 h-8 text-sm" placeholder="שם בית הכנסת" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">שתף עם הקהילה</Label>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>
        </div>

        {/* Text element controls */}
        <div className="p-3 border-b flex gap-2">
          <Button size="sm" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1 text-xs" onClick={handleAddTextElement}>
            <Plus className="w-3.5 h-3.5" /> הוסף טקסט
          </Button>
          {selectedElementId && (
            <Button size="sm" variant="ghost" className="text-destructive px-2" onClick={() => handleDeleteElement(selectedElementId)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Text toolbar */}
        <div className="flex-1 overflow-y-auto">
          <TextToolbar element={selectedElement} onUpdate={(updates) => selectedElementId && handleUpdateElement(selectedElementId, updates)} />
        </div>

        {/* Save button */}
        <div className="p-4 border-t">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור מודעה
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 bg-muted/50 overflow-auto">
        <EditorCanvas
          backgroundUrl={backgroundUrl}
          textElements={textElements}
          selectedId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
        />
      </div>
    </div>
  );
}