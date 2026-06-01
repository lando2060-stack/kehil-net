import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2, FileText, Search, X as CloseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AnnouncementPreview from '@/components/AnnouncementPreview';
import AnnouncementCard from '@/components/AnnouncementCard';

export default function MyAnnouncements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('published');
  const [previewAnnouncement, setPreviewAnnouncement] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['my-announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (/** @type {string} */ id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-announcements'] });
      toast.success('המודעה נמחקה');
      setDeleteTarget(null);
    },
  });

  const toggleShareMutation = useMutation({
    mutationFn: (/** @type {any} */ a) => base44.entities.Announcement.update(a.id, { is_shared: !a.is_shared }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-announcements'] }); toast.success('עודכן'); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (/** @type {any} */ announcement) => {
      const { id, created_date, updated_date, created_by, ...data } = announcement;
      return base44.entities.Announcement.create({ ...data, title: `${data.title} (עותק)` });
    },
    onSuccess: (newAnnouncement) => {
      queryClient.invalidateQueries({ queryKey: ['my-announcements'] });
      navigate(`/create?edit=${newAnnouncement.id}`);
    },
  });

  const drafts = announcements.filter((/** @type {any} */ a) => a.is_draft);
  const published = announcements.filter((/** @type {any} */ a) => !a.is_draft);
  const tabAnnouncements = tab === 'drafts' ? drafts : published;

  const allCategories = useMemo(() => {
    const cats = new Set();
    announcements.forEach((/** @type {any} */ a) => { if (a.category) cats.add(a.category); });
    return Array.from(cats).sort();
  }, [announcements]);

  const shown = useMemo(() => {
    return tabAnnouncements.filter((/** @type {any} */ a) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || a.title?.toLowerCase().includes(q);
      const matchesCategory = !selectedCategory || a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tabAnnouncements, searchQuery, selectedCategory]);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">המודעות שלי</h1>
          <p className="text-sm text-muted-foreground mt-1">{announcements.length} מודעות</p>
        </div>
        <Link to="/create">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="w-4 h-4" /> מודעה חדשה
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        {[
          { id: 'published', label: `פורסמו (${published.length})` },
          { id: 'drafts', label: `טיוטות (${drafts.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearchQuery(''); setSelectedCategory(null); }}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חפש לפי שם..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-9 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              הכל
            </button>
            {allCategories.map(cat => (
              <button
                key={String(cat)}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
              >
                {String(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-3 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{tab === 'drafts' ? 'אין טיוטות' : 'אין מודעות'}</h3>
          <Link to="/create">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 mt-4">
              <Plus className="w-4 h-4" /> יצירת מודעה
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {shown.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <AnnouncementCard
                announcement={a}
                onPreview={setPreviewAnnouncement}
                onNavigate={navigate}
                onDuplicate={duplicateMutation.mutate}
                onDelete={setDeleteTarget}
                onToggleShare={toggleShareMutation.mutate}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAnnouncement} onOpenChange={() => setPreviewAnnouncement(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {previewAnnouncement && (
            <AnnouncementPreview
              announcement={previewAnnouncement}
              onEdit={() => { navigate(`/create?edit=${previewAnnouncement.id}`); setPreviewAnnouncement(null); }}
              onClose={() => setPreviewAnnouncement(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מודעה</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את "{deleteTarget?.title}"? לא ניתן לשחזר את הפעולה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
