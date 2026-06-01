import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Image, Upload, Loader2, ImagePlus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SynagogueLibrary({ backgroundUrl, onBackgroundChange, onAddText, logoUrl, onLogoChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myTemplates = [], isLoading: loadingT } = useQuery({
    queryKey: ['syn-templates', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Template.list('-created_date', 200);
      return all.filter(t => t.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: myBackgrounds = [], isLoading: loadingB } = useQuery({
    queryKey: ['syn-backgrounds', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Background.list('-created_date', 200);
      return all.filter(b => b.created_by === user?.email && !b.categories?.includes('logo'));
    },
    enabled: !!user,
  });

  const { data: savedLogos = [] } = useQuery({
    queryKey: ['syn-logos', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Background.list('-created_date', 200);
      return all.filter(b => b.created_by === user?.email && b.categories?.includes('logo'));
    },
    enabled: !!user,
  });

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-3 space-y-5">
      <p className="text-xs text-muted-foreground">חומרים שהועלו על ידך לשימוש אישי</p>

      {/* Logo upload */}
      <LogoSection logoUrl={logoUrl} onLogoChange={onLogoChange} savedLogos={savedLogos} />

      {/* Blank canvas */}
      <BlankSection onBackgroundChange={onBackgroundChange} />

      {/* My Templates */}
      <Section title="תבניות שלי" icon={FileText} loading={loadingT} empty={myTemplates.length === 0} emptyText="לא הועלו תבניות עדיין">
        <div className="grid grid-cols-2 gap-2">
          {myTemplates.map(t => (
            <button key={t.id} onClick={() => t.background_url && onBackgroundChange(t.background_url)}
              className="rounded-lg overflow-hidden border hover:border-primary transition-colors text-right">
              <div className="aspect-[2/3] bg-muted">
                {t.thumbnail_url || t.background_url
                  ? <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground/40" /></div>}
              </div>
              <p className="text-xs text-center p-1.5 truncate font-medium">{t.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* My Backgrounds */}
      <Section title="רקעים שלי" icon={Image} loading={loadingB} empty={myBackgrounds.length === 0} emptyText="לא הועלו רקעים עדיין">
        <div className="grid grid-cols-2 gap-2">
          {myBackgrounds.map(bg => (
            <button key={bg.id} onClick={() => onBackgroundChange(backgroundUrl === bg.image_url ? '' : bg.image_url)}
              className={cn('relative rounded-lg overflow-hidden border-2 transition-all',
                backgroundUrl === bg.image_url ? 'border-primary shadow-md' : 'border-transparent hover:border-border'
              )}>
              <div className="aspect-[2/3]">
                <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-center p-1.5 truncate">{bg.name}</p>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Logo Upload Section ──
function LogoSection({ logoUrl, onLogoChange, savedLogos = [] }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onLogoChange?.(file_url);
    setUploading(false);
    toast.success('הלוגו הועלה');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ImagePlus className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold flex-1 text-right">לוגו הבית כנסת</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {logoUrl ? (
        <div className="flex gap-2 items-center">
          <div className="w-16 h-16 rounded-lg border overflow-hidden bg-checkered flex-shrink-0">
            <img src={logoUrl} alt="לוגו" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-xs text-muted-foreground"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              החלף לוגו
            </button>
            <button onClick={() => onLogoChange?.('')} className="text-xs text-destructive/70 hover:text-destructive transition-colors text-center">
              הסר לוגו
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
        >
          {uploading
            ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            : <Upload className="w-5 h-5 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">העלה לוגו (PNG/SVG עם רקע שקוף)</span>
        </button>
      )}

      {/* Saved logos from library */}
      {savedLogos.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-muted-foreground mb-1.5">לוגואים שהועלו:</p>
          <div className="flex gap-2 flex-wrap">
            {savedLogos.map(logo => (
              <button
                key={logo.id}
                onClick={() => onLogoChange?.(logo.image_url)}
                title={logo.name}
                className={cn(
                  'w-14 h-14 rounded-lg border-2 overflow-hidden bg-checkered transition-all',
                  logoUrl === logo.image_url ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                )}
              >
                <img src={logo.image_url} alt={logo.name} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Blank Canvas Section ──
function BlankSection({ onBackgroundChange }) {
  const BLANKS = [
    { label: 'לבן', color: '#ffffff', border: '#e2e8f0' },
    { label: 'שמנת', color: '#fffdf5', border: '#e2e8f0' },
    { label: 'כחול בהיר', color: '#eff6ff', border: '#bfdbfe' },
    { label: 'זהב בהיר', color: '#fffbeb', border: '#fde68a' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Plus className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold flex-1 text-right">בלנק (ללא רקע)</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BLANKS.map(b => (
          <button
            key={b.label}
            onClick={() => onBackgroundChange('')}
            className="flex flex-col items-center gap-1 group"
            title={b.label}
          >
            <div
              className="w-full aspect-[2/3] rounded-lg border-2 transition-all group-hover:border-primary"
              style={{ backgroundColor: b.color, borderColor: b.border }}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, loading, empty, emptyText, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 w-full mb-2 group">
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold flex-1 text-right">{title}</span>
        <span className="text-muted-foreground text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        loading ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        : empty ? <p className="text-center text-xs text-muted-foreground py-3">{emptyText}</p>
        : children
      )}
    </div>
  );
}