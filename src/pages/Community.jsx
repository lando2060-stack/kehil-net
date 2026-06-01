import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { AnnouncementThumbnail } from '@/components/AnnouncementCard';

export default function Community() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['community-announcements'],
    queryFn: () => base44.entities.Announcement.filter({ is_shared: true }, '-created_date', 100),
  });

  const q = search.trim().toLowerCase();
  const filtered = announcements.filter((/** @type {any} */ a) => {
    if (!q) return true;
    return (
      a.title?.toLowerCase().includes(q) ||
      a.synagogue_name?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-7 h-7 text-secondary" />
          <h1 className="text-2xl font-bold">גלריה קהילתית</h1>
        </div>
        <p className="text-sm text-muted-foreground">מודעות ששותפו על ידי בתי כנסת מהקהילה</p>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="חיפוש מודעות..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-3 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">אין מודעות משותפות עדיין</h3>
          <p className="text-muted-foreground">שתפו את המודעות שלכם כדי שיופיעו כאן</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((/** @type {any} */ a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelected(a)}>
                <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                  <AnnouncementThumbnail announcement={a} />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  {a.synagogue_name && <p className="text-xs text-muted-foreground">{a.synagogue_name}</p>}
                  {a.category && <Badge variant="secondary" className="text-[10px] mt-1">{a.category}</Badge>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Dialog — shows full announcement with text elements */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selected?.title}</DialogTitle>
          {selected && (
            <div>
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <AnnouncementThumbnail announcement={selected} />
              </div>
              <div className="p-4 border-t">
                <p className="font-semibold">{selected.title}</p>
                {selected.synagogue_name && <p className="text-sm text-muted-foreground mt-0.5">{selected.synagogue_name}</p>}
                {selected.category && <Badge variant="secondary" className="text-xs mt-2">{selected.category}</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
