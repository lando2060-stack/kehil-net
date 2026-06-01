import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Templates() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הצג הכל');

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 100),
  });

  const { data: categoryRecords = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => base44.entities.TemplateCategory.list('order', 100),
  });

  const categories = ['הצג הכל', ...categoryRecords.map((/** @type {any} */ c) => c.name)];

  const q = search.trim().toLowerCase();
  const filtered = templates.filter((/** @type {any} */ t) => {
    if (q && !t.name?.toLowerCase().includes(q) && !t.category?.toLowerCase().includes(q)) return false;
    if (activeCategory !== 'הצג הכל' && t.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">תבניות</h1>
          <p className="text-sm text-muted-foreground mt-1">בחרו תבנית מוכנה והתאימו לצרכים שלכם</p>
        </div>
        <Link to="/create">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="w-4 h-4" />
            תבנית חדשה
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="חיפוש תבניות..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loadingTemplates ? (
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">אין תבניות עדיין</p>
          <Link to="/create">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">צרו את התבנית הראשונה</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((/** @type {any} */ t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/create?template=${t.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-border/50 hover:border-secondary/50">
                  <div className="aspect-[3/4] bg-muted relative">
                    {t.thumbnail_url || t.background_url ? (
                      <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-muted to-border flex items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.category && <Badge variant="outline" className="text-[10px] mt-1">{t.category}</Badge>}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
