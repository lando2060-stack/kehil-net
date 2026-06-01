import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Upload, Settings, ChevronLeft, Image, FileText, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementPreview from '@/components/AnnouncementPreview';
import AnnouncementCard from '@/components/AnnouncementCard';
import ReadyMadeAnnouncements from '@/components/ReadyMadeAnnouncements';

const QUICK_ACTIONS = [
  { id: 'create', label: 'יצירת מודעה', icon: Plus, href: '/create', color: 'bg-primary text-primary-foreground' },
  { id: 'my', label: 'המודעות שלי', icon: FolderOpen, href: '/my-announcements', color: 'bg-card text-foreground border border-border' },
  { id: 'upload', label: 'העלאות', icon: Upload, href: '/uploads', color: 'bg-card text-foreground border border-border' },
  { id: 'manage', label: 'ניהול', icon: Shield, href: '/admin-manage', color: 'bg-card text-foreground border border-border' },
];

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [synagogueName, setSynagogueName] = useState('');
  const [previewAnnouncement, setPreviewAnnouncement] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setSynagogueName(u?.synagogue_name || '')).catch(() => {});
  }, []);

  const { data: allAnnouncements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['home-recent'],
    queryFn: () => base44.entities.Announcement.list('-updated_date', 100),
  });

  const { data: recentTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['home-recent-templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 6),
  });

  const { data: recentBackgrounds = [], isLoading: loadingBackgrounds } = useQuery({
    queryKey: ['home-recent-backgrounds'],
    queryFn: () => base44.entities.Background.list('-created_date', 6),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (/** @type {any} */ announcement) => {
      const { id, created_date, updated_date, created_by, ...data } = announcement;
      return base44.entities.Announcement.create({ ...data, title: `${data.title} (עותק)` });
    },
    onSuccess: (newAnnouncement) => {
      queryClient.invalidateQueries({ queryKey: ['home-recent'] });
      navigate(`/create?edit=${newAnnouncement.id}`);
    },
  });

  const recentAnnouncements = allAnnouncements.filter(a => !a.is_draft).slice(0, 6);
  const drafts = allAnnouncements.filter(a => a.is_draft).slice(0, 6);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">
            {synagogueName || 'מודעות קהילה'}
          </h1>
          <p className="text-xs text-muted-foreground">ברוכים הבאים</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="w-9 h-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors" title="האזור האישי">
            <User className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link to="/settings" className="w-9 h-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors" title="הגדרות">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Quick Actions */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">פעולות מהירות</p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div key={action.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={action.href} className="block">
                  <div className={`rounded-2xl p-3 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${action.color}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.id === 'create' ? 'bg-white/15' : 'bg-muted'}`}>
                      <action.icon className={`w-5 h-5 ${action.id === 'create' ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <p className="text-[11px] font-semibold leading-tight">{action.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Ready-Made Announcements */}
        <ReadyMadeAnnouncements />

        {/* Recent Templates */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">תבניות אחרונות</p>
            </div>
            <Link to="/templates" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              הכל <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {loadingTemplates ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-2.5 mt-1.5 mx-1 w-3/4" />
                </div>
              ))}
            </div>
          ) : recentTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-xs text-muted-foreground mb-2">אין תבניות עדיין</p>
              <Link to="/admin-manage" className="text-xs text-primary hover:underline">העלה תבנית ראשונה</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {recentTemplates.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/create?template=${t.id}`}>
                    <div className="rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer">
                      <div className="aspect-[3/4] bg-muted">
                        {t.thumbnail_url || t.background_url ? (
                          <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] truncate font-medium text-muted-foreground">{t.name}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Backgrounds */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">רקעים אחרונים</p>
            </div>
            <Link to="/backgrounds" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              הכל <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {loadingBackgrounds ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-2.5 mt-1.5 mx-1 w-3/4" />
                </div>
              ))}
            </div>
          ) : recentBackgrounds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-xs text-muted-foreground mb-2">אין רקעים עדיין</p>
              <Link to="/admin-manage" className="text-xs text-primary hover:underline">העלה רקע ראשון</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {recentBackgrounds.map((bg, i) => (
                <motion.div key={bg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/create?background=${bg.image_url}`}>
                    <div className="rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer">
                      <div className="aspect-[3/4] bg-muted">
                        <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] truncate font-medium text-muted-foreground">{bg.name}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* My recent announcements */}
        {loadingAnnouncements && (
          <section>
            <Skeleton className="h-3 w-24 mb-3" />
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-2.5 mt-1.5 mx-1 w-3/4" />
                </div>
              ))}
            </div>
          </section>
        )}

        {!loadingAnnouncements && recentAnnouncements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">מודעות אחרונות</p>
              <Link to="/my-announcements" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                הכל <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {recentAnnouncements.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  compact
                  onPreview={setPreviewAnnouncement}
                  onNavigate={navigate}
                  onDuplicate={duplicateMutation.mutate}
                />
              ))}
            </div>
          </section>
        )}

        {!loadingAnnouncements && drafts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">טיוטות</p>
              <Link to="/my-announcements" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                הכל <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {drafts.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  compact
                  onPreview={setPreviewAnnouncement}
                  onNavigate={navigate}
                  onDuplicate={duplicateMutation.mutate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state — only if nothing at all */}
        {!loadingAnnouncements && !loadingTemplates && !loadingBackgrounds &&
          recentAnnouncements.length === 0 && drafts.length === 0 &&
          recentTemplates.length === 0 && recentBackgrounds.length === 0 && (
          <section className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <Plus className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">ברוכים הבאים!</p>
            <p className="text-sm text-muted-foreground mb-4">התחילו ביצירת מודעה ראשונה</p>
            <Link to="/create" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              יצירת מודעה
            </Link>
          </section>
        )}

        {/* Preview Dialog */}
        {previewAnnouncement && (
          <Dialog open={!!previewAnnouncement} onOpenChange={() => setPreviewAnnouncement(null)}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
              <AnnouncementPreview
                announcement={previewAnnouncement}
                onEdit={() => {
                  navigate(`/create?edit=${previewAnnouncement.id}`);
                  setPreviewAnnouncement(null);
                }}
                onClose={() => setPreviewAnnouncement(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
