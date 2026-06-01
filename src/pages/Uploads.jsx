import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Type, Image, FileText, Globe, Lock, CheckCircle2, Loader2, ArrowRight, ImagePlus, Square } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import UploadFlyer from '@/components/create/UploadFlyer';

const UPLOAD_TYPES = [
  {
    id: 'font',
    label: 'גופן',
    desc: 'TTF, OTF — יישמר בספריית הגופנים',
    icon: Type,
    accept: '.ttf,.otf,.woff,.woff2',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    iconBg: 'bg-violet-100',
  },
  {
    id: 'announcement',
    label: 'מודעה מוכנה',
    desc: 'PNG, JPG — פירוק אוטומטי לשכבות',
    icon: FileText,
    accept: 'image/*',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'background',
    label: 'רקע / תמונה',
    desc: 'PNG, JPG, SVG — לספריית הרקעים',
    icon: Image,
    accept: 'image/*',
    color: 'bg-green-50 border-green-200 text-green-700',
    iconBg: 'bg-green-100',
  },
  {
    id: 'logo',
    label: 'לוגו בית הכנסת',
    desc: 'PNG/SVG עם רקע שקוף — ישמר בספריה שלך',
    icon: ImagePlus,
    accept: 'image/*',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconBg: 'bg-amber-100',
  },
  {
    id: 'blank',
    label: 'בלנק (מודעה ריקה)',
    desc: 'פתיחת עורך עם קנבס ריק — ללא רקע',
    icon: Square,
    accept: null, // no file needed
    color: 'bg-gray-50 border-gray-200 text-gray-700',
    iconBg: 'bg-gray-100',
  },
];

export default function Uploads() {
  const [activeType, setActiveType] = useState(null);
  const [privacy, setPrivacy] = useState('private');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(null);
  const [showFlyerUpload, setShowFlyerUpload] = useState(false);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const selectType = (type) => {
    setActiveType(type);
    setDone(null);

    if (type.id === 'announcement') {
      setShowFlyerUpload(true);
    } else if (type.id === 'blank') {
      // Open editor with blank canvas
      navigate('/create');
    } else if (type.id === 'logo' || type.id === 'background' || type.id === 'font') {
      // Trigger file picker immediately
      setTimeout(() => fileRef.current?.click(), 50);
    }
  };

  const triggerFile = () => {
    if (!activeType) return;
    fileRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;
    e.target.value = '';
    setUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    if (activeType.id === 'background') {
      const isShared = privacy === 'public';
      await base44.entities.Background.create({
        name: file.name.replace(/\.[^.]+$/, ''),
        image_url: file_url,
        is_shared: isShared,
        categories: [],
        tags: [],
      });
      queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
      queryClient.invalidateQueries({ queryKey: ['syn-backgrounds'] });
    } else if (activeType.id === 'logo') {
      // Save logo as a special Background record tagged as logo (private, for this user's synagogue)
      await base44.entities.Background.create({
        name: file.name.replace(/\.[^.]+$/, '') + ' (לוגו)',
        image_url: file_url,
        is_shared: false,
        categories: ['logo'],
        tags: ['logo'],
      });
      queryClient.invalidateQueries({ queryKey: ['syn-backgrounds'] });
    }
    // font — just upload for now

    setDone({ name: file.name, url: file_url, type: activeType });
    setUploading(false);
    toast.success('הועלה בהצלחה!');
  };

  const reset = () => {
    setDone(null);
    setActiveType(null);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-base font-bold">מרכז העלאות</h1>
          <p className="text-xs text-muted-foreground">גופנים, רקעים, מודעות</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">מעלה קובץ...</p>
          </div>
        ) : done ? (
          <SuccessState done={done} onReset={reset} privacy={privacy} />
        ) : (
          <>
            {/* Upload type */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">מה תרצו להעלות?</p>
              <div className="space-y-2.5">
                {UPLOAD_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => selectType(type)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-right transition-all',
                      activeType?.id === type.id
                        ? `${type.color} border-current shadow-sm scale-[1.01]`
                        : 'bg-card border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    )}
                  >
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', activeType?.id === type.id ? type.iconBg : 'bg-muted')}>
                      <type.icon className={cn('w-5 h-5', activeType?.id === type.id ? '' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                    </div>
                    {activeType?.id === type.id && <CheckCircle2 className="w-5 h-5 flex-shrink-0 opacity-70" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Privacy — only for background uploads */}
            {activeType && activeType.id === 'background' && (
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">פרטיות</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrivacy('private')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                      privacy === 'private' ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/30'
                    )}
                  >
                    <Lock className="w-5 h-5" />
                    <p className="text-sm font-semibold">פרטי</p>
                    <p className="text-[11px] text-center leading-snug">רק לבית הכנסת שלי</p>
                  </button>
                  <button
                    onClick={() => setPrivacy('public')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                      privacy === 'public' ? 'bg-secondary/10 border-secondary text-secondary-foreground' : 'bg-card border-border text-muted-foreground hover:bg-muted/30'
                    )}
                  >
                    <Globe className="w-5 h-5" />
                    <p className="text-sm font-semibold">ציבורי</p>
                    <p className="text-[11px] text-center leading-snug">כל הקהילות יוכלו להשתמש</p>
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        <input
          key={activeType?.id}
          ref={fileRef}
          type="file"
          accept={activeType?.accept || '*/*'}
          className="hidden"
          onChange={handleFile}
        />
      </main>

      {showFlyerUpload && (
        <UploadFlyer
          onClose={() => { setShowFlyerUpload(false); setActiveType(null); }}
          onDone={(template, background) => {
            setShowFlyerUpload(false);
            setActiveType(null);
            setDone({ name: template.name, url: background.image_url, type: UPLOAD_TYPES.find(t => t.id === 'announcement') });
          }}
        />
      )}
    </div>
  );
}

function SuccessState({ done, onReset, privacy }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <p className="font-bold text-lg">הועלה בהצלחה!</p>
        <p className="text-sm text-muted-foreground mt-1">{done.name}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
          {privacy === 'public' ? <><Globe className="w-3 h-3" /> ציבורי לכל הקהילות</> : <><Lock className="w-3 h-3" /> פרטי לבית הכנסת שלך</>}
        </p>
      </div>
      {done.type?.id === 'background' && (
        <p className="text-xs bg-green-50 text-green-700 rounded-xl px-4 py-2.5 inline-block">
          הרקע נוסף לספריית הרקעים ✓
        </p>
      )}
      {done.type?.id === 'announcement' && (
        <p className="text-xs bg-blue-50 text-blue-700 rounded-xl px-4 py-2.5 inline-block">
          נפתח כטיוטה לעריכה בעורך ✓
        </p>
      )}
      {done.type?.id === 'logo' && (
        <p className="text-xs bg-amber-50 text-amber-700 rounded-xl px-4 py-2.5 inline-block">
          הלוגו נשמר בספריית הבית כנסת שלך ✓
        </p>
      )}
      <div className="flex gap-3 justify-center pt-2">
        <button onClick={onReset} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          העלאה נוספת
        </button>
        <Link to="/" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          חזרה לבית
        </Link>
      </div>
    </div>
  );
}