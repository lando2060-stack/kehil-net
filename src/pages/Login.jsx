import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [synagogueName, setSynagogueName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('נא למלא אימייל וסיסמה'); return; }
    if (mode === 'register' && !synagogueName) { toast.error('נא להזין שם בית הכנסת'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await apiClient.auth.login(email, password);
        toast.success('התחברת בהצלחה');
      } else {
        await apiClient.auth.register({ email, password, synagogue_name: synagogueName, synagogue_city: city });
        toast.success('נרשמת בהצלחה');
      }
      navigate(returnUrl, { replace: true });
    } catch (err) {
      const msg = err?.message || err?.error || (mode === 'login' ? 'שגיאה בהתחברות' : 'שגיאה ברישום');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">מודעות קהילה</h1>
          <p className="text-muted-foreground mt-2">מערכת ניהול מודעות לבתי כנסת</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{mode === 'login' ? 'כניסה' : 'הרשמה'}</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'הכנס את פרטי הכניסה שלך' : 'צור חשבון חדש לבית הכנסת שלך'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <Label>שם בית הכנסת *</Label>
                    <Input
                      value={synagogueName}
                      onChange={e => setSynagogueName(e.target.value)}
                      placeholder="בית הכנסת..."
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>עיר</Label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="ירושלים, תל אביב..."
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>אימייל *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label>סיסמה *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="לפחות 8 תווים"
                  className="mt-1"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'כניסה' : 'הרשמה'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'login' ? 'אין לך חשבון? הירשם כאן' : 'יש לך חשבון? התחבר'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
