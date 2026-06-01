import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Save, MapPin, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import PrayerTimesSettings from '@/components/settings/PrayerTimesSettings';

const TIMEZONES = [
  { value: 'Asia/Jerusalem', label: 'ירושלים (UTC+2/+3)' },
  { value: 'America/New_York', label: 'ניו יורק (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'שיקגו (UTC-6/-5)' },
  { value: 'America/Los_Angeles', label: 'לוס אנג\'לס (UTC-8/-7)' },
  { value: 'Europe/London', label: 'לונדון (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'פריז (UTC+1/+2)' },
  { value: 'Australia/Sydney', label: 'סידני (UTC+10/+11)' },
];

const CALC_METHODS = [
  { value: 'GRA', label: 'גר"א / בעל התניא' },
  { value: 'MGA', label: 'מג"א (72 דקות)' },
  { value: 'FIXED_LOCAL', label: 'שעות קבועות (מנהג מקומי)' },
];

export default function Settings() {
  const navigate = useNavigate();

  const [synagogueName, setSynagogueName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jerusalem');
  const [calcMethod, setCalcMethod] = useState('GRA');
  const [savingLocation, setSavingLocation] = useState(false);

  const [prayerTimes, setPrayerTimes] = useState([]);
  const [savingPrayers, setSavingPrayers] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setSynagogueName(user?.synagogue_name || '');
      setLogoUrl(user?.logo_url || '');
      setCity(user?.synagogue_city || '');
      setTimezone(user?.synagogue_timezone || 'Asia/Jerusalem');
      setCalcMethod(user?.prayer_calculation_method || 'GRA');
      setPrayerTimes(user?.prayer_times || []);
    }).catch(() => {});
  }, []);

  const handleLogoUpload = async (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } catch {
      toast.error('שגיאה בהעלאת הלוגו');
    } finally {
      setUploading(false);
    }
  };

  const saveInfo = async () => {
    if (!synagogueName.trim()) { toast.error('שם בית הכנסת לא יכול להיות ריק'); return; }
    setSavingInfo(true);
    try {
      await base44.auth.updateMe({ synagogue_name: synagogueName, logo_url: logoUrl });
      toast.success('פרטי בית הכנסת נשמרו');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSavingInfo(false);
    }
  };

  const saveLocation = async () => {
    setSavingLocation(true);
    try {
      await base44.auth.updateMe({ synagogue_city: city, synagogue_timezone: timezone, prayer_calculation_method: calcMethod });
      toast.success('הגדרות מיקום נשמרו');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSavingLocation(false);
    }
  };

  const savePrayers = async () => {
    setSavingPrayers(true);
    try {
      await base44.auth.updateMe({ prayer_times: prayerTimes });
      toast.success('זמני תפילות נשמרו');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSavingPrayers(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">הגדרות</h1>
      </div>

      {/* Synagogue Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי בית הכנסת</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>שם בית הכנסת</Label>
            <Input value={synagogueName} onChange={e => setSynagogueName(e.target.value)} className="mt-1" placeholder="הכניסו את שם בית הכנסת" />
          </div>
          <div>
            <Label>לוגו בית הכנסת</Label>
            <div className="mt-2">
              {logoUrl && (
                <div className="mb-3 p-4 bg-muted rounded-lg inline-block">
                  <img src={logoUrl} alt="לוגו" className="max-h-20 object-contain" />
                </div>
              )}
              <input type="file" accept="image/*" id="settings-logo" className="hidden" onChange={handleLogoUpload} />
              <Button variant="outline" onClick={() => document.getElementById('settings-logo').click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {logoUrl ? 'החלפת לוגו' : 'העלאת לוגו'}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={saveInfo} disabled={savingInfo} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 mr-auto">
            {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
        </CardFooter>
      </Card>

      {/* Location & Zmanim */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            זמני בית הכנסת
          </CardTitle>
          <p className="text-sm text-muted-foreground">הגדרות מיקום לחישוב זמנים הלכתיים אוטומטי</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>עיר</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1" placeholder="לדוגמה: ירושלים, תל אביב, ניו יורק" />
          </div>
          <div>
            <Label>אזור זמן</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>שיטת חישוב זמנים</Label>
            <Select value={calcMethod} onValueChange={setCalcMethod}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALC_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={saveLocation} disabled={savingLocation} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 mr-auto">
            {savingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
        </CardFooter>
      </Card>

      {/* Prayer Times */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            זמני תפילות
          </CardTitle>
          <p className="text-sm text-muted-foreground">הגדירו שעות קבועות או זמנים יחסיים לזמנים הלכתיים</p>
        </CardHeader>
        <CardContent>
          <PrayerTimesSettings prayerTimes={prayerTimes} onChange={setPrayerTimes} />
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={savePrayers} disabled={savingPrayers} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 mr-auto">
            {savingPrayers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
