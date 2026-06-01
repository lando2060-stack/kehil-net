import React, { useState } from 'react';
import { X, Image, FileText, Type, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function CategoryPicker({ selectedCategories, onChange, entityCategories }) {
  const [newCat, setNewCat] = useState('');

  const toggle = (cat) => {
    if (selectedCategories.includes(cat)) onChange(selectedCategories.filter(c => c !== cat));
    else onChange([...selectedCategories, cat]);
  };

  const addNew = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!selectedCategories.includes(trimmed)) onChange([...selectedCategories, trimmed]);
    setNewCat('');
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] text-muted-foreground font-medium">קטגוריות:</p>
      <div className="flex flex-wrap gap-1.5">
        {entityCategories.map(cat => (
          <button key={cat} onClick={() => toggle(cat)}
            className={cn('px-2 py-0.5 rounded-full text-[10px] border transition-colors',
              selectedCategories.includes(cat)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
            )}>
            {cat}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={newCat} onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNew()}
          placeholder="קטגוריה חדשה..."
          className="flex-1 h-7 text-[11px] px-2 rounded border border-border bg-muted/50 outline-none focus:border-primary" />
        <button onClick={addNew} className="h-7 px-2 text-[11px] bg-primary/10 text-primary rounded hover:bg-primary/20">+</button>
      </div>
    </div>
  );
}

export default function UploadPanel({ onClose }) {
  const queryClient = useQueryClient();
  const [bgCats, setBgCats] = useState([]);
  const [templateCats, setTemplateCats] = useState([]);
  const [templateHasBg, setTemplateHasBg] = useState(true);
  const [states, setStates] = useState({});

  const { data: bgCategories = [] } = useQuery({
    queryKey: ['bg-categories'],
    queryFn: () => base44.entities.BackgroundCategory.list('order', 50),
  });
  const { data: templateCategories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => base44.entities.TemplateCategory.list('order', 50),
  });

  const setLoading = (key, val) => setStates(s => ({ ...s, [key]: val }));

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading('bg', true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Background.create({ name: file.name.replace(/\.[^.]+$/, ''), image_url: file_url, is_shared: true, categories: bgCats });
    queryClient.invalidateQueries({ queryKey: ['backgrounds-picker'] });
    setLoading('bg', false);
    setBgCats([]);
    toast.success('הרקע הועלה ונוסף לספרייה');
    e.target.value = '';
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading('template', true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Template.create({
      name: file.name.replace(/\.[^.]+$/, ''),
      background_url: templateHasBg ? file_url : '',
      thumbnail_url: file_url,
      is_shared: true,
      categories: templateCats,
      text_elements: [],
    });
    queryClient.invalidateQueries({ queryKey: ['templates-picker'] });
    setLoading('template', false);
    setTemplateCats([]);
    toast.success('התבנית הועלתה');
    e.target.value = '';
  };

  const handleFontUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading('font', true);
    await base44.integrations.Core.UploadFile({ file });
    setLoading('font', false);
    toast.success('הגופן הועלה');
    e.target.value = '';
  };

  return (
    <div className="absolute bottom-0 right-0 w-full bg-white text-foreground shadow-2xl rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">העלאה לספרייה</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Background */}
          <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">רקע / מסגרת</p>
                <p className="text-[11px] text-muted-foreground">PNG, JPG</p>
              </div>
            </div>
            <CategoryPicker selectedCategories={bgCats} onChange={setBgCats} entityCategories={bgCategories.map(c => c.name)} />
            <input type="file" accept="image/*" id="sidebar-upload-bg" className="hidden" onChange={handleBackgroundUpload} />
            <button onClick={() => document.getElementById('sidebar-upload-bg').click()} disabled={states.bg}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50">
              {states.bg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {states.bg ? 'מעלה...' : 'בחרו קובץ'}
            </button>
          </div>

          {/* Template */}
          <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">תבנית מוכנה</p>
                <p className="text-[11px] text-muted-foreground">עיצוב מוכן להתאמה</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTemplateHasBg(true)}
                className={cn('px-2.5 py-1 rounded-full text-[11px] border transition-colors',
                  templateHasBg ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border')}>
                עם רקע
              </button>
              <button onClick={() => setTemplateHasBg(false)}
                className={cn('px-2.5 py-1 rounded-full text-[11px] border transition-colors',
                  !templateHasBg ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border')}>
                טקסט בלבד
              </button>
            </div>
            <CategoryPicker selectedCategories={templateCats} onChange={setTemplateCats} entityCategories={templateCategories.map(c => c.name)} />
            <input type="file" accept="image/*" id="sidebar-upload-template" className="hidden" onChange={handleTemplateUpload} />
            <button onClick={() => document.getElementById('sidebar-upload-template').click()} disabled={states.template}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50">
              {states.template ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {states.template ? 'מעלה...' : 'בחרו קובץ'}
            </button>
          </div>

          {/* Font */}
          <div className="border-2 border-dashed border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Type className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">גופן מותאם</p>
                <p className="text-[11px] text-muted-foreground">TTF / OTF / WOFF</p>
              </div>
            </div>
            <input type="file" accept=".ttf,.otf,.woff,.woff2" id="sidebar-upload-font" className="hidden" onChange={handleFontUpload} />
            <button onClick={() => document.getElementById('sidebar-upload-font').click()} disabled={states.font}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50">
              {states.font ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {states.font ? 'מעלה...' : 'בחרו קובץ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}