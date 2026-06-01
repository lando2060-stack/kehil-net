import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Globe, Lock, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Backgrounds() {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUserId(u?.id || u?.email || null)).catch(() => {});
  }, []);

  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: ['backgrounds'],
    queryFn: () => base44.entities.Background.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (/** @type {string} */ id) => base44.entities.Background.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
      toast.success('הרקע נמחק');
      setDeleteTarget(null);
    },
  });

  const toggleShareMutation = useMutation({
    mutationFn: (/** @type {any} */ bg) => base44.entities.Background.update(bg.id, { is_shared: !bg.is_shared }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backgrounds'] }),
  });

  const handleUpload = async (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Background.create({
        name: file.name.replace(/\.[^.]+$/, ''),
        image_url: file_url,
        is_shared: true,
      });
      queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
      toast.success(`"${file.name.replace(/\.[^.]+$/, '')}" הועלה בהצלחה`);
    } catch {
      toast.error('שגיאה בהעלאת הרקע');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = backgrounds.filter((/** @type {any} */ bg) => {
    if (q && !bg.name?.toLowerCase().includes(q)) return false;
    if (showMine && currentUserId && bg.created_by !== currentUserId) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">רקעים ומסגרות</h1>
          <p className="text-sm text-muted-foreground mt-1">העלו רקעים ומסגרות ושתפו עם הקהילה</p>
        </div>
        <div>
          <input type="file" accept="image/*" id="bg-upload" className="hidden" onChange={handleUpload} />
          <Button
            onClick={() => document.getElementById('bg-upload').click()}
            disabled={uploading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת רקע חדש
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש רקעים..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="mine" checked={showMine} onCheckedChange={setShowMine} />
          <Label htmlFor="mine" className="text-sm cursor-pointer">הצג רק שלי</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-2.5 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {showMine ? 'לא העלית רקעים עדיין.' : 'אין רקעים עדיין. העלו את הרקע הראשון!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((/** @type {any} */ bg, i) => (
            <motion.div key={bg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className="overflow-hidden group relative">
                <div className="aspect-[3/4] bg-muted">
                  <img
                    src={bg.image_url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => toggleShareMutation.mutate(bg)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
                    title={bg.is_shared ? 'הפוך לפרטי' : 'שתף'}
                  >
                    {bg.is_shared ? <Globe className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(bg)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium truncate">{bg.name}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{bg.is_shared ? 'משותף' : 'פרטי'}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת רקע</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את "{deleteTarget?.name}"? לא ניתן לשחזר את הפעולה.
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
