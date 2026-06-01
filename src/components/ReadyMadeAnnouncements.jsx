import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Static ready-made announcements data ─────────────────────────────────────
const READY_MADE = [
  {
    id: 'silence',
    bg: 'from-blue-900 to-blue-700',
    title: 'קדושת התפילה',
    subtitle: 'נא לשמור על שקט',
    body: 'מבקשים בנועם מכל המתפללים לשמור על שקט מוחלט בשעת התפילה\nהשיחה תמתין — הקב"ה מחכה',
    accent: '#ffffff',
    emoji: '🙏',
  },
  {
    id: 'phones',
    bg: 'from-gray-900 to-gray-700',
    title: 'כיבוי פלאפונים',
    subtitle: 'בבקשה לפני הכניסה',
    body: 'נא לכבות את הטלפון הנייד\nאו להעבירו למצב שקט\nלפני כניסתכם לבית הכנסת',
    accent: '#fbbf24',
    emoji: '📵',
  },
  {
    id: 'clean',
    bg: 'from-green-800 to-green-600',
    title: 'שמירת ניקיון',
    subtitle: 'בית הכנסת — ביתנו',
    body: 'אנא שמרו על ניקיון בית הכנסת\nהשאירו את המקום נקי לאחריכם\nתודה על שיתוף הפעולה',
    accent: '#ffffff',
    emoji: '✨',
  },
  {
    id: 'order',
    bg: 'from-amber-800 to-amber-600',
    title: 'שמירת הסדר',
    subtitle: 'לכבוד הציבור',
    body: 'נא לשמור על סדר ונימוס\nלא לעבור לפני המתפלל\nלא לדחוף ולא להפריע',
    accent: '#ffffff',
    emoji: '📋',
  },
  {
    id: 'children',
    bg: 'from-purple-900 to-purple-700',
    title: 'ילדים בתפילה',
    subtitle: 'הנחיות לקהל',
    body: 'ילדים מתחת לגיל 6 מתבקשים\nלהישאר עם הוריהם\nלא לרוץ בתוך בית הכנסת',
    accent: '#f9a8d4',
    emoji: '👶',
  },
  {
    id: 'tzniut',
    bg: 'from-rose-900 to-rose-700',
    title: 'הלבשה צנועה',
    subtitle: 'בקשה מנכבדי הציבור',
    body: 'כניסה לבית הכנסת\nמותנית בלבוש צנוע בלבד\nתודה על הבנתכם',
    accent: '#fecdd3',
    emoji: '👔',
  },
];

// ── Single announcement renderer (DOM-based, used for capture) ────────────────
function AnnouncementDOM({ item, innerRef }) {
  return (
    <div
      ref={innerRef}
      style={{ width: 400, height: 560, fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}
      className={`bg-gradient-to-b ${item.bg} flex flex-col items-center justify-center p-8 rounded-2xl`}
    >
      <div style={{ fontSize: 64, marginBottom: 12 }}>{item.emoji}</div>
      <p style={{ color: item.accent, fontSize: 30, fontWeight: 800, textAlign: 'center', lineHeight: 1.2, marginBottom: 8 }}>
        {item.title}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>
        {item.subtitle}
      </p>
      <div style={{ width: 48, height: 3, background: item.accent, borderRadius: 2, marginBottom: 20, opacity: 0.6 }} />
      {item.body.split('\n').map((line, i) => (
        <p key={i} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
          {line}
        </p>
      ))}
    </div>
  );
}

// ── Card shown in Home ────────────────────────────────────────────────────────
function ReadyCard({ item }) {
  const domRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    const el = domRef.current;
    if (!el) return null;
    return html2canvas(el, { useCORS: true, scale: 2, backgroundColor: null, logging: false });
  };

  const downloadPNG = async () => {
    setLoading(true);
    const canvas = await capture();
    if (canvas) {
      const a = document.createElement('a');
      a.download = `${item.title}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('המודעה הורדה בהצלחה');
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
    setLoading(true);
    const canvas = await capture();
    if (canvas) {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' });
      const imgW = 180;
      const imgH = (canvas.height / canvas.width) * imgW;
      const y = Math.max((297 - imgH) / 2, 5);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 15, y, imgW, imgH);
      pdf.save(`${item.title}.pdf`);
      toast.success('PDF הורד בהצלחה');
    }
    setLoading(false);
  };

  const share = async () => {
    setLoading(true);
    const canvas = await capture();
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (navigator.share && blob) {
          try {
            const file = new File([blob], `${item.title}.png`, { type: 'image/png' });
            await navigator.share({ title: item.title, files: [file] });
          } catch {
            toast.error('שגיאה בשיתוף');
          }
        } else {
          toast.error('השיתוף אינו נתמך בדפדפן זה');
        }
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="aspect-[5/7] overflow-hidden relative">
        <div className="scale-[0.5] origin-top-right absolute top-0 right-0" style={{ width: '200%', height: '200%' }}>
          <AnnouncementDOM item={item} innerRef={domRef} />
        </div>
      </div>

      {/* Info + actions */}
      <div className="p-3 border-t border-border">
        <p className="text-xs font-semibold text-foreground truncate mb-2">{item.title}</p>
        <div className="flex gap-1.5">
          <button
            onClick={downloadPNG}
            disabled={loading}
            title="הורד PNG"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PNG
          </button>
          <button
            onClick={downloadPDF}
            disabled={loading}
            title="הורד PDF"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            <Printer className="w-3 h-3" />
            PDF
          </button>
          <button
            onClick={share}
            disabled={loading}
            title="שתף"
            className="flex items-center justify-center w-8 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
          >
            <Share2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section exported to Home ──────────────────────────────────────────────────
export default function ReadyMadeAnnouncements() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">מודעות מוכנות להורדה</p>
        <span className="text-[10px] text-muted-foreground">ללא צורך בעריכה</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {READY_MADE.map(item => (
          <ReadyCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}