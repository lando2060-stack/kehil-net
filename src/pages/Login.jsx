import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Check, Crown, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'חינמי',
    price: '',
    priceLabel: 'ללא תשלום',
    desc: 'צבירת קרדיטים דרך שיתופים',
    features: ['קרדיטים דרך שיתוף תבניות', 'קרדיטים דרך הפניות', 'גישה לגלריה קהילתית'],
    color: 'border-border',
    badge: null,
  },
  {
    id: 'basic',
    name: 'בסיסי',
    price: '97',
    priceLabel: '97 ₪ / חודש',
    desc: '5 מודעות בחודש',
    features: ['5 מודעות בחודש', 'כל תבניות הקהילה', 'הורדת PDF ו-PNG', 'תמיכה במייל'],
    color: 'border-blue-300',
    badge: null,
  },
  {
    id: 'pro',
    name: 'פרו',
    price: '167',
    priceLabel: '167 ₪ / חודש',
    desc: '10 מודעות בחודש',
    features: ['10 מודעות בחודש', 'כל תבניות הקהילה', 'כלי AI ליצירת טקסטים', 'תמיכה מועדפת'],
    color: 'border-purple-400',
    badge: 'מומלץ',
  },
  {
    id: 'unlimited',
    name: 'ללא הגבלה',
    price: '227',
    priceLabel: '227 ₪ / חודש',
    desc: '15 מודעות בחודש',
    features: ['15 מודעות בחודש', 'כל תבניות הקהילה', 'כלי AI מלאים', 'ניהול מרובה בתי כנסת'],
    color: 'border-amber-400',
    badge: 'הכי שלם',
  },
];

function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(plan.id)}
      className={cn(
        'relative w-full rounded-xl border-2 p-3 text-right transition-all',
        selected ? `${plan.color} bg-primary/5 shadow-sm` : 'border-border hover:border-border/80 bg-card',
      )}
    >
      {plan.badge && (
        <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          {plan.badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-1.5">
        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5', selected ? 'border-primary bg-primary' : 'border-border')}>
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">{plan.name}</p>
          <p className="text-xs text-primary font-semibold">{plan.priceLabel}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1.5">{plan.desc}</p>
      <ul className="space-y-0.5">
        {plan.features.map((f, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'plans'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [synagogueName, setSynagogueName] = useState('');
  const [city, setCity] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);

  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';
  const refCode = new URLSearchParams(window.location.search).get('ref') || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('נא למלא אימייל וסיסמה'); return; }
    setLoading(true);
    try {
      await apiClient.auth.login(email, password);
      toast.success('התחברת בהצלחה');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInfo = (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('נא למלא אימייל וסיסמה'); return; }
    if (!synagogueName) { toast.error('נא להזין שם בית הכנסת'); return; }
    setMode('plans');
  };

  const handleRegisterComplete = async () => {
    setLoading(true);
    try {
      await apiClient.auth.register({
        email,
        password,
        synagogue_name: synagogueName,
        synagogue_city: city,
        plan: selectedPlan,
        referred_by: refCode || undefined,
      });
      toast.success('נרשמת בהצלחה! ברוכים הבאים 🎉');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'שגיאה ברישום');
      setMode('register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-5">
        {/* Logo / title */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">מודעות קהילה</h1>
          <p className="text-sm text-muted-foreground mt-1">מערכת ניהול מודעות לבתי כנסת</p>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">כניסה למערכת</CardTitle>
              <CardDescription>הכנס את פרטי הכניסה שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>אימייל</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" autoComplete="email" />
                </div>
                <div>
                  <Label>סיסמה</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  כניסה
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setMode('register')} className="text-sm text-primary hover:underline">
                  אין לך חשבון? הירשם כאן
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── REGISTER – step 1: info ── */}
        {mode === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הרשמה — פרטים בסיסיים</CardTitle>
              <CardDescription>שלב 1 מתוך 2 — פרטי בית הכנסת</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterInfo} className="space-y-4">
                <div>
                  <Label>שם בית הכנסת *</Label>
                  <Input value={synagogueName} onChange={e => setSynagogueName(e.target.value)} placeholder="בית הכנסת..." className="mt-1" />
                </div>
                <div>
                  <Label>עיר</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="ירושלים, תל אביב..." className="mt-1" />
                </div>
                <div>
                  <Label>אימייל *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" autoComplete="email" />
                </div>
                <div>
                  <Label>סיסמה *</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 8 תווים" className="mt-1" autoComplete="new-password" />
                </div>
                {refCode && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    <Gift className="w-4 h-4" />
                    נרשם דרך הפניה — תקבל קרדיטים בונוס!
                  </div>
                )}
                <Button type="submit" className="w-full">
                  המשך לבחירת מסלול
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setMode('login')} className="text-sm text-primary hover:underline">
                  יש לך חשבון? התחבר
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── REGISTER – step 2: plan ── */}
        {mode === 'plans' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="font-semibold text-foreground">שלב 2 מתוך 2 — בחר מסלול</p>
              <p className="text-xs text-muted-foreground mt-0.5">תוכל לשנות את המסלול בכל עת</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {PLANS.map(plan => (
                <PlanCard key={plan.id} plan={plan} selected={selectedPlan === plan.id} onSelect={setSelectedPlan} />
              ))}
            </div>
            <div className="space-y-2">
              <Button onClick={handleRegisterComplete} disabled={loading} className="w-full gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {selectedPlan === 'free' ? 'הירשם בחינם' : `הירשם למסלול ${PLANS.find(p => p.id === selectedPlan)?.name}`}
              </Button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                חזרה לפרטים
              </button>
            </div>
            {selectedPlan !== 'free' && (
              <p className="text-[11px] text-center text-muted-foreground">
                * פרטי תשלום יוזנו לאחר ההרשמה · ניתן לבטל בכל עת
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}