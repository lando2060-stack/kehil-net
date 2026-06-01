import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Pencil, Check, X, Loader2,
  Globe, Lock, Search, Plus, Tag, Image, FileText, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Shared: Upload Modal ──
function UploadModal({ open, onClose, entityType, categories, onDone }) {
  const [files, setFiles] = useState([]);
  const [isShared, setIsShared] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    setFiles(dropped);
  };

  const toggleCat = (cat) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const results = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const name = file.name.replace(/\.[^.]+$/, '');
        let record;
        if (entityType === 'background') {
          record = await base44.entities.Background.create({
            name, image_url: file_url, is_shared: isShared, categories: selectedCats, tags: [],
          });
        } else {
          record = await base44.entities.Template.create({
            name, background_url: file_url, thumbnail_url: file_url,
            is_shared: isShared, categories: selectedCats, text_elements: [],
          });
        }
        results.push(record);
      } catch {
        toast.error(`שגיאה בהעלאת ${file.name}`);
      }
    }
    setUploading(false);
    toast.success(`${results.length} פריטים הועלו בהצלחה`);
    setFiles([]);
    setSelectedCats([]);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>העלאת {entityType === 'background' ? 'רקעים' : 'תבניות'}</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {files.slice(0, 6).map((f, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded-lg">{f.name}</span>
                ))}
                {files.length > 6 && <span className="text-xs text-muted-foreground">+{files.length - 6} נוספים</span>}
              </div>
              <p className="text-xs text-muted-foreground">{files.length} קבצים נבחרו • לחצו לשינוי</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">גרור קבצים לכאן או לחץ לבחירה</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG — ניתן לבחור מספר קבצים</p>
            </>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">קטגוריות</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.name)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                    selectedCats.includes(cat.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shared toggle */}
        <div className="flex items-center justify-between py-2 border-t">
          <div>
            <p className="text-sm font-medium">שתף עם הקהילה</p>
            <p className="text-xs text-muted-foreground">גלוי לכל המשתמשים</p>
          </div>
          <Switch checked={isShared} onCheckedChange={setIsShared} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="bg-primary text-primary-foreground gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? `מעלה... (0/${files.length})` : `העלה ${files.length || ''} קבצים`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared: Item Card ──
function ItemCard({ item, entityType, categories, onDelete, onUpdate }) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(item.name || '');
  const [editingCats, setEditingCats] = useState(false);
  const [selectedCats, setSelectedCats] = useState(item.categories || []);

  const imageUrl = entityType === 'background' ? item.image_url : (item.thumbnail_url || item.background_url);

  const saveName = () => {
    if (nameVal.trim() !== item.name) onUpdate(item.id, { name: nameVal.trim() });
    setEditingName(false);
  };

  const toggleCat = (cat) => {
    const updated = selectedCats.includes(cat)
      ? selectedCats.filter(c => c !== cat)
      : [...selectedCats, cat];
    setSelectedCats(updated);
    onUpdate(item.id, { categories: updated });
  };

  return (
    <Card className="overflow-hidden group relative">
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onUpdate(item.id, { is_shared: !item.is_shared })}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
            title={item.is_shared ? 'הפוך לפרטי' : 'שתף'}
          >
            {item.is_shared ? <Globe className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <button
            onClick={() => onDelete(item)}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
            title="מחק"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
        {/* Badges */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {item.is_shared && (
            <span className="text-[9px] bg-green-500/90 text-white px-1.5 py-0.5 rounded-full font-medium">ציבורי</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1.5">
        {/* Name */}
        {editingName ? (
          <div className="flex gap-1">
            <Input
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              className="h-6 text-xs flex-1"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
            />
            <button onClick={saveName} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group/name">
            <p className="text-xs font-medium truncate flex-1">{item.name || 'ללא שם'}</p>
            <button
              onClick={() => { setNameVal(item.name || ''); setEditingName(true); }}
              className="opacity-0 group-hover/name:opacity-100 transition-opacity"
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-1 items-center">
          {selectedCats.map(cat => (
            <Badge key={cat} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 cursor-pointer" onClick={() => toggleCat(cat)}>
              {cat} ×
            </Badge>
          ))}
          <button
            onClick={() => setEditingCats(p => !p)}
            className="w-4 h-4 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
            title="ערוך קטגוריות"
          >
            <Tag className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </div>

        {/* Category picker */}
        {editingCats && (
          <div className="flex flex-wrap gap-1 border-t pt-1.5 mt-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.name)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border',
                  selectedCats.includes(cat.name)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Tab: Manage Items ──
function ManageTab({ entityType, entityName, categoryEntityName, categoryQueryKey, queryKey }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('הכל');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => base44.entities[entityName].list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: [categoryQueryKey],
    queryFn: () => base44.entities[categoryEntityName].list('order', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (/** @type {string} */ id) => base44.entities[entityName].delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); toast.success('נמחק'); setDeleteTarget(null); },
  });

  const updateMutation = useMutation({
    mutationFn: (/** @type {{id: string, data: any}} */ { id, data }) => base44.entities[entityName].update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const q = search.trim().toLowerCase();
  const filtered = items.filter((/** @type {any} */ item) => {
    if (q && !item.name?.toLowerCase().includes(q)) return false;
    if (filterCat !== 'הכל' && !item.categories?.includes(filterCat)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-primary text-primary-foreground gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          העלאה
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['הכל', ...categories.map((/** @type {any} */ c) => c.name)].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filterCat === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} פריטים
        {filtered.length !== items.length && ` (מתוך ${items.length})`}
        {' · '}{items.filter((/** @type {any} */ i) => i.is_shared).length} ציבוריים
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-3 mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">אין פריטים עדיין</p>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="w-4 h-4" /> העלה ראשון
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
              <ItemCard
                item={item}
                entityType={entityType}
                categories={categories}
                onDelete={setDeleteTarget}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        entityType={entityType}
        categories={categories}
        onDone={() => {
          setShowUpload(false);
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          queryClient.invalidateQueries({ queryKey: ['backgrounds-picker'] });
          queryClient.invalidateQueries({ queryKey: ['templates-picker'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקה</AlertDialogTitle>
            <AlertDialogDescription>למחוק את "{deleteTarget?.name}"? לא ניתן לשחזר.</AlertDialogDescription>
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

// ── Main Page ──
const TABS = [
  { id: 'backgrounds', label: 'רקעים', icon: Image, entityName: 'Background', entityType: 'background', categoryEntityName: 'BackgroundCategory', categoryQueryKey: 'bg-categories-admin', queryKey: 'admin-backgrounds' },
  { id: 'templates', label: 'תבניות', icon: FileText, entityName: 'Template', entityType: 'template', categoryEntityName: 'TemplateCategory', categoryQueryKey: 'template-categories-admin', queryKey: 'admin-templates' },
];

export default function AdminManage() {
  const [activeTab, setActiveTab] = useState('backgrounds');
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">ניהול תוכן</h1>
          <p className="text-xs text-muted-foreground">ניהול רקעים, תבניות ואלמנטים</p>
        </div>
        <Link to="/admin-categories" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" />
          ניהול קטגוריות
        </Link>
      </header>

      {/* Tab Bar */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab && (
          <ManageTab
            key={tab.id}
            entityType={tab.entityType}
            entityName={tab.entityName}
            categoryEntityName={tab.categoryEntityName}
            categoryQueryKey={tab.categoryQueryKey}
            queryKey={tab.queryKey}
          />
        )}
      </main>
    </div>
  );
}
