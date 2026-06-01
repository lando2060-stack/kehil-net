import React, { useState } from 'react';
import { Plus, Trash2, Clock, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const HALACHIC_ANCHORS = [
  { value: 'alot_hashachar', label: 'עלות השחר' },
  { value: 'sunrise', label: 'נץ החמה' },
  { value: 'sof_zman_shma_gra', label: 'סוף זמן ק"ש (גר"א)' },
  { value: 'sof_zman_shma_mga', label: 'סוף זמן ק"ש (מג"א)' },
  { value: 'chatzot', label: 'חצות היום' },
  { value: 'mincha_gedola', label: 'מנחה גדולה' },
  { value: 'mincha_ketana', label: 'מנחה קטנה' },
  { value: 'plag_hamincha', label: 'פלג המנחה' },
  { value: 'sunset', label: 'שקיעת החמה' },
  { value: 'tzet_hakochavim', label: 'צאת הכוכבים' },
  { value: 'shabbat_start', label: 'כניסת שבת' },
  { value: 'shabbat_end', label: 'צאת שבת' },
];

const DAYS_OF_WEEK = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const DAY_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const DEFAULT_PRAYERS = [
  { id: 'shacharit', name: 'שחרית', type: 'fixed', fixed_time: '07:00', every_day: true, days: [0,1,2,3,4,5,6] },
  { id: 'mincha', name: 'מנחה', type: 'relative', relative_anchor: 'sunset', relative_offset_minutes: 20, relative_direction: 'before', every_day: true, days: [0,1,2,3,4,5,6] },
  { id: 'arvit', name: 'ערבית', type: 'relative', relative_anchor: 'tzet_hakochavim', relative_offset_minutes: 10, relative_direction: 'after', every_day: true, days: [0,1,2,3,4,5,6] },
];

export default function PrayerTimesSettings({ prayerTimes = [], onChange }) {
  const [prayers, setPrayers] = useState(prayerTimes.length > 0 ? prayerTimes : DEFAULT_PRAYERS);

  const update = (updatedPrayers) => {
    setPrayers(updatedPrayers);
    onChange(updatedPrayers);
  };

  const updatePrayer = (id, field, value) => {
    update(prayers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleDay = (prayerId, dayIndex) => {
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;
    const days = prayer.days || [];
    const newDays = days.includes(dayIndex) ? days.filter(d => d !== dayIndex) : [...days, dayIndex];
    const every_day = newDays.length === 7;
    update(prayers.map(p => p.id === prayerId ? { ...p, days: newDays, every_day } : p));
  };

  const addPrayer = () => {
    const newP = {
      id: `prayer-${Date.now()}`,
      name: 'תפילה חדשה',
      type: 'fixed',
      fixed_time: '08:00',
      every_day: true,
      days: [0,1,2,3,4,5,6],
    };
    update([...prayers, newP]);
  };

  const deletePrayer = (id) => {
    update(prayers.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {prayers.map((prayer) => (
        <div key={prayer.id} className="border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <Input
              value={prayer.name}
              onChange={e => updatePrayer(prayer.id, 'name', e.target.value)}
              className="h-8 text-sm font-medium flex-1"
              placeholder="שם התפילה"
            />
            <button onClick={() => deletePrayer(prayer.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => updatePrayer(prayer.id, 'type', 'fixed')}
              className={cn('flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors',
                prayer.type === 'fixed' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              שעה קבועה
            </button>
            <button
              onClick={() => updatePrayer(prayer.id, 'type', 'relative')}
              className={cn('flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors',
                prayer.type === 'relative' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <Sunrise className="w-3 h-3 inline ml-1" />
              לפי זמן הלכתי
            </button>
          </div>

          {prayer.type === 'fixed' ? (
            <div>
              <Label className="text-xs text-muted-foreground">שעה</Label>
              <Input
                type="time"
                value={prayer.fixed_time || '07:00'}
                onChange={e => updatePrayer(prayer.id, 'fixed_time', e.target.value)}
                className="h-8 text-sm mt-1 w-32"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">עוגן הלכתי</Label>
                <Select value={prayer.relative_anchor || 'sunset'} onValueChange={v => updatePrayer(prayer.id, 'relative_anchor', v)}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HALACHIC_ANCHORS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">דקות</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={prayer.relative_offset_minutes ?? 0}
                    onChange={e => updatePrayer(prayer.id, 'relative_offset_minutes', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div className="flex gap-1 mb-0.5">
                  {['before', 'after'].map(dir => (
                    <button key={dir}
                      onClick={() => updatePrayer(prayer.id, 'relative_direction', dir)}
                      className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                        prayer.relative_direction === dir ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {dir === 'before' ? 'לפני' : 'אחרי'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                {prayer.relative_offset_minutes > 0
                  ? `${prayer.relative_offset_minutes} דקות ${prayer.relative_direction === 'before' ? 'לפני' : 'אחרי'} ${HALACHIC_ANCHORS.find(a => a.value === prayer.relative_anchor)?.label || ''}`
                  : `בזמן ${HALACHIC_ANCHORS.find(a => a.value === prayer.relative_anchor)?.label || ''}`
                }
              </p>
            </div>
          )}

          {/* Days */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">ימים</Label>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(prayer.id, i)}
                  title={DAY_FULL[i]}
                  className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    (prayer.days || []).includes(i)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addPrayer} className="w-full gap-2 border-dashed">
        <Plus className="w-4 h-4" />
        הוספת תפילה
      </Button>
    </div>
  );
}