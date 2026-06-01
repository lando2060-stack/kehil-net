import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Coins, Plus, Minus, Search,
  Users, Share2, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLAN_LABELS = {
  free:      { label: 'חינמי', color: 'bg-gray-100 text-gray-600' },
  basic:     { label: 'בסיסי', color: 'bg-blue-100 text-blue-700' },
  pro:       { label: 'פרו', color: 'bg-purple-100 text-purple-700' },
  unlimited: { label: 'ללא הגבלה', color: 'bg-amber-100 text-amber-700' },
};

function UserRow({ u, onAdjust, isPending }) {
  const [expanded, setExpanded] = useState(false);
  const plan = PLAN_LABELS[u.plan || 'free'];

  return (
    <Card className="overflow-hidden">
      {/* Main row */}
      <div className="p-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {u.logo_url
            ? <img src={u.logo_url} alt="" className="w-full h-full object-contain" />
            : <span className="text-lg font-bold text-muted-foreground">{(u.synagogue_name || u.email || '?')[0]}</span>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{u.synagogue_name || 'ללא שם'}</p>
            {u.role === 'admin' && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 border">מנהל</Badge>}
            <Badge className={cn('text-[10px] border-0', plan.color)}>{plan.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{u.email}</p>
          {u.synagogue_city && <p className="text-xs text-muted-foreground">{u.synagogue_city}</p>}
        </div>

        {/* Credits control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-1">קרדיטים</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAdjust(u, -1)}
                disabled={isPending}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 h-7 flex items-center justify-center text-sm font-bold border border-border rounded-lg bg-background">
                {u.credits ?? 10}
              </span>
              <button
                onClick={() => onAdjust(u, 1)}
                disabled={isPending}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {[10, 50].map(n => (
              <button
                key={n}
                onClick={() => onAdjust(u, n)}
                disabled={isPending}
                className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium disabled:opacity-50"
              >
                +{n}
              </button>
            ))}
          </div>
          <button onClick={() => setExpanded(e => !e)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-card rounded-lg p-2.5">
              <p className="text-base font-bold">{u.announcements_this_month ?? 0}</p>
              <p className="text-muted-foreground mt-0.5">מודעות החודש</p>
            </div>
            <div className="bg-card rounded-lg p-2.5">
              <p className="text-base font-bold">{u.credits_used ?? 0}</p>
              <p className="text-muted-foreground mt-0.5">קרדיטים שנוצלו</p>
            </div>
            <div className="bg-card rounded-lg p-2.5">
              <p className="text-base font-bold">{u.referral_signups ?? 0}</p>
              <p className="text-muted-foreground mt-0.5">הפניות שנרשמו</p>
            </div>
            <div className="bg-card rounded-lg p-2.5">
              <p className="text-base font-bold">{u.credits_from_referrals ?? 0}</p>
              <p className="text-muted-foreground mt-0.5">קרדיטים מהפניות</p>
            </div>
          </div>
          {u.referral_code && (
            <div className="mt-2.5 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">קישור הפניה:</span>
              <span className="text-xs font-mono text-foreground truncate">
                {window.location.origin}/login?ref={u.referral_code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/login?ref=${u.referral_code}`);
                  toast.success('הועתק');
                }}
                className="text-primary hover:underline text-xs shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
          {u.referred_by && (
            <p className="text-xs text-muted-foreground mt-1.5">
              נרשם דרך קוד: <span className="font-mono">{u.referred_by}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('הכל');

  if (user?.role !== 'admin') {
    return (
      <div className="p-10 text-center" dir="rtl">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">גישה מוגבלת</h2>
        <p className="text-muted-foreground">רק מנהלים יכולים לנהל משתמשים</p>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: (/** @type {{id: string, credits: number}} */ { id, credits }) =>
      base44.entities.User.update(id, { credits }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('קרדיטים עודכנו');
    },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  const adjustCredits = (/** @type {any} */ u, /** @type {number} */ delta) => {
    const cur = u.credits ?? 10;
    updateMutation.mutate({ id: u.id, credits: Math.max(0, cur + delta) });
  };

  const q = search.trim().toLowerCase();
  const filtered = users.filter((/** @type {any} */ u) => {
    if (q && !u.synagogue_name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    if (filterPlan !== 'הכל' && (u.plan || 'free') !== filterPlan) return false;
    return true;
  });

  const totalCredits = users.reduce((sum, /** @type {any} */ u) => sum + (u.credits ?? 0), 0);
  const totalReferrals = users.reduce((sum, /** @type {any} */ u) => sum + (u.referral_signups ?? 0), 0);
  const totalAnnouncements = users.reduce((sum, /** @type {any} */ u) => sum + (u.announcements_this_month ?? 0), 0);

  const PLAN_FILTERS = ['הכל', 'free', 'basic', 'pro', 'unlimited'];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">ניהול משתמשים</h1>
          <p className="text-xs text-muted-foreground">ניהול בתי כנסת, מסלולים וקרדיטים</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'בתי כנסת', value: users.length, icon: Users, color: 'text-blue-600' },
            { label: 'סה"כ קרדיטים', value: totalCredits, icon: Coins, color: 'text-amber-600' },
            { label: 'מודעות החודש', value: totalAnnouncements, icon: Shield, color: 'text-green-600' },
            { label: 'הפניות שנרשמו', value: totalReferrals, icon: Share2, color: 'text-purple-600' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Plan distribution */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['free', 'basic', 'pro', 'unlimited']).map(p => {
            const count = users.filter((/** @type {any} */ u) => (u.plan || 'free') === p).length;
            const pl = PLAN_LABELS[p];
            return (
              <div key={p} className={cn('rounded-xl p-3 text-center border-0', pl.color)}>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-0.5">{pl.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חפש לפי שם / אימייל..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PLAN_FILTERS.map(p => (
              <button
                key={p}
                onClick={() => setFilterPlan(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  filterPlan === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {p === 'הכל' ? 'הכל' : (PLAN_LABELS[p]?.label || p)}
              </button>
            ))}
          </div>
        </div>

        {/* Users list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">אין משתמשים</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((/** @type {any} */ u) => (
              <UserRow key={u.id} u={u} onAdjust={adjustCredits} isPending={updateMutation.isPending} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}