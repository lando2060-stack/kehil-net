import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, User, Building2, Phone, Mail, MapPin, Coins, Share2,
  Copy, Check, ChevronDown, ChevronUp, Gift, TrendingUp, FileText,
  Crown, Info, ExternalLink, Loader2, Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(email) {
  const base = (email || '').split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 6);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}

const PLAN_LABELS = {
  free:      { label: 'חינמי', color: 'bg-gray-100 text-gray-700', limit: 'ללא מגבלה (קרדיטים)' },
  basic:     { label: 'בסיסי – 97₪/חודש', color: 'bg-blue-100 text-blue-700', limit: '5 מודעות/חודש' },
  pro:       { label: 'פרו – 167₪/חודש', color: 'bg-purple-100 text-purple-700', limit: '10 מודעות/חודש' },
  unlimited: { label: 'ללא הגבלה – 227₪/חודש', color: 'bg-amber-100 text-amber-700', limit: '15 מודעות/חודש' },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Referral How-It-Works ─────────────────────────────────────────────────────
function HowItWorks() {
  const [open, setOpen] = useState(false);

  const items = [
    { title: 'שיתוף קישור', desc: 'שלח את הקישור האישי שלך לחברי קהילה, גבאים, ורבנים.' },
    { title: 'הרשמה דרך הקישור', desc: 'כל מי שנרשם דרך הקישור שלך — נחשב כהפניה שלך.' },
    { title: 'קבלת קרדיט', desc: 'כל הפניה שהפכה למשתמש פעיל מזכה אותך ב-2 קרדיטים.' },
    { title: 'שיתוף תבנית (20%+)', desc: 'אם שינית תבנית קיימת ביותר מ-20% ושיתפת אותה — קרדיט נוסף.' },
    { title: 'שיתוף מודעה', desc: 'פרסום מודעה לגלריה הקהילתית מחזיר קרדיט שנוצל.' },
    { title: 'לא מקבלים קרדיט כאשר...', desc: 'שינית תבנית בפחות מ-20% (רק שם/טקסט קטן). שיתפת מודעה זהה פעמיים. הפניה לא השלימה הרשמה.', warn: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center justify-between w-full text-right"
        >
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            איך עובד מערכת הקרדיטים?
          </CardTitle>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-3">
          {items.map((item, i) => (
            <div key={i} className={cn('rounded-lg p-3 text-sm', item.warn ? 'bg-red-50 border border-red-100' : 'bg-muted/50')}>
              <p className={cn('font-semibold mb-0.5', item.warn ? 'text-red-700' : 'text-foreground')}>{item.title}</p>
              <p className={cn('text-xs', item.warn ? 'text-red-600' : 'text-muted-foreground')}>{item.desc}</p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ synagogue_name: '', phone: '', synagogue_city: '' });
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.auth.me(),
  });

  useEffect(() => {
    if (profile) {
      setForm({
        synagogue_name: profile.synagogue_name || '',
        phone: profile.phone || '',
        synagogue_city: profile.synagogue_city || '',
      });
      // Generate referral code if missing
      if (!profile.referral_code) {
        apiClient.auth.updateMe({ referral_code: generateCode(profile.email) })
          .then(() => queryClient.invalidateQueries({ queryKey: ['my-profile'] }))
          .catch(() => {});
      }
    }
  }, [profile, queryClient]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.auth.updateMe(form);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('הפרטים נשמרו');
      setEditMode(false);
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/login?ref=${profile.referral_code}`
    : '';

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('הקישור הועתק!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const planInfo = PLAN_LABELS[profile?.plan || 'free'];
  const credits = profile?.credits ?? 0;
  const creditsUsed = profile?.credits_used ?? 0;
  const creditsFromShares = profile?.credits_from_shares ?? 0;
  const creditsFromReferrals = profile?.credits_from_referrals ?? 0;
  const referralClicks = profile?.referral_clicks ?? 0;
  const referralSignups = profile?.referral_signups ?? 0;
  const announcementsThisMonth = profile?.announcements_this_month ?? 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">האזור האישי</h1>
          <p className="text-xs text-muted-foreground">פרטים, קרדיטים וקישור שיתוף</p>
        </div>
        <Link to="/settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          הגדרות
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-20">

        {/* Personal Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                פרטים אישיים
              </CardTitle>
              <button
                onClick={() => setEditMode(e => !e)}
                className="text-xs text-primary hover:underline"
              >
                {editMode ? 'ביטול' : 'עריכה'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editMode ? (
              <>
                <div>
                  <Label className="text-xs">שם בית הכנסת</Label>
                  <Input value={form.synagogue_name} onChange={e => setForm(f => ({ ...f, synagogue_name: e.target.value }))} className="mt-1 h-9" />
                </div>
                <div>
                  <Label className="text-xs">עיר</Label>
                  <Input value={form.synagogue_city} onChange={e => setForm(f => ({ ...f, synagogue_city: e.target.value }))} className="mt-1 h-9" />
                </div>
                <div>
                  <Label className="text-xs">טלפון</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-9" placeholder="05x-xxxxxxx" />
                </div>
                <Button onClick={saveProfile} disabled={saving} size="sm" className="gap-2 mt-1">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  שמור
                </Button>
              </>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-foreground">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{profile?.synagogue_name || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{profile?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{profile?.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{profile?.synagogue_city || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Crown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Badge className={cn('text-xs font-medium border-0', planInfo.color)}>
                    {planInfo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">({planInfo.limit})</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    סוג: {profile?.role === 'admin' ? 'מנהל מערכת' : 'משתמש רגיל'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">מעקב קרדיטים</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Coins} label="קרדיטים זמינים" value={credits} color="text-amber-500" />
            <StatCard icon={TrendingUp} label="קרדיטים שנוצלו" value={creditsUsed} color="text-red-500" />
            <StatCard icon={Gift} label="מקרדיטים שיתוף" value={creditsFromShares} color="text-green-600" />
            <StatCard icon={Share2} label="מהפניות" value={creditsFromReferrals} color="text-blue-500" />
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} label="מודעות החודש" value={announcementsThisMonth} color="text-primary" />
          <StatCard icon={Share2} label="הפניות שנרשמו" value={referralSignups} color="text-purple-600" />
        </div>

        {/* Referral Link */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              קישור שיתוף אישי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link display */}
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate select-all">
                {referralLink || 'נוצר בטעינה...'}
              </div>
              <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'הועתק' : 'העתק'}
              </Button>
            </div>

            {/* Referral stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'כניסות לקישור', value: referralClicks },
                { label: 'נרשמו', value: referralSignups },
                { label: 'קרדיטים שהתקבלו', value: creditsFromReferrals },
              ].map(s => (
                <div key={s.label} className="bg-muted/50 rounded-xl py-3 px-2">
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Share options */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const text = `הי! מצאתי מערכת מעולה ליצירת מודעות לבית הכנסת 🕍\nכנסו והירשמו דרך הקישור שלי:\n${referralLink}`;
                  if (navigator.share) {
                    navigator.share({ title: 'מערכת מודעות קהילה', text, url: referralLink });
                  } else {
                    navigator.clipboard.writeText(text).then(() => toast.success('הטקסט הועתק לשיתוף!'));
                  }
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                שתף ב-WhatsApp / כללי
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <HowItWorks />

      </main>
    </div>
  );
}