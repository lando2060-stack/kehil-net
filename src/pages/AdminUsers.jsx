import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Coins, Plus, Minus, Search, Loader2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

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

  const setCredits = (/** @type {any} */ u, /** @type {number} */ val) => {
    updateMutation.mutate({ id: u.id, credits: Math.max(0, val) });
  };

  const q = search.trim().toLowerCase();
  const filtered = users.filter((/** @type {any} */ u) =>
    !q || u.synagogue_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  );

  const totalCredits = users.reduce((sum, /** @type {any} */ u) => sum + (u.credits ?? 0), 0);
  const totalAnnouncements = users.reduce((sum, /** @type {any} */ u) => sum + (u.announcement_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">ניהול משתמשים</h1>
          <p className="text-xs text-muted-foreground">ניהול בתי כנסת וקרדיטים</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'בתי כנסת', value: users.length, icon: Users, color: 'text-blue-600' },
            { label: 'סה"כ קרדיטים', value: totalCredits, icon: Coins, color: 'text-amber-600' },
            { label: 'מודעות', value: totalAnnouncements, icon: Shield, color: 'text-green-600' },
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

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="חפש לפי שם / אימייל..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>

        {/* Credits system explainer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800">
          <strong>מערכת קרדיטים:</strong> פרסום מודעה עולה קרדיט אחד · שיתוף עם הקהילה מחזיר קרדיט · כל בית כנסת חדש מקבל 10 קרדיטים
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
              <Card key={u.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Logo/Avatar */}
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
                      {u.role === 'admin' && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">מנהל</Badge>}
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
                          onClick={() => adjustCredits(u, -1)}
                          disabled={updateMutation.isPending}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={u.credits ?? 10}
                          onChange={e => setCredits(u, parseInt(e.target.value) || 0)}
                          className="w-12 h-7 text-center text-sm font-bold border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                          min="0"
                        />
                        <button
                          onClick={() => adjustCredits(u, 1)}
                          disabled={updateMutation.isPending}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick add buttons */}
                    <div className="flex flex-col gap-1">
                      {[10, 50].map(n => (
                        <button
                          key={n}
                          onClick={() => adjustCredits(u, n)}
                          disabled={updateMutation.isPending}
                          className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium disabled:opacity-50"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
