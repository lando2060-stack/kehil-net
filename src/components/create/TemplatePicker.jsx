import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, FileText, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function TemplatePicker({ selected, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');

  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => base44.entities.TemplateCategory.list('order', 50),
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates-picker'],
    queryFn: () => base44.entities.Template.list('-created_date', 200),
  });

  const allCategories = ['הכל', ...categories.map(c => c.name)];

  const filtered = templates.filter(t => {
    if (search && !t.name?.includes(search)) return false;
    if (activeCategory !== 'הכל') {
      if (!t.categories?.includes(activeCategory)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0',
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">אין תבניות</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => onSelect(selected?.id === t.id ? null : t)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all text-right',
                  selected?.id === t.id
                    ? 'border-secondary shadow-md'
                    : 'border-transparent hover:border-border'
                )}
              >
                <div className="aspect-[3/4] bg-muted">
                  {t.thumbnail_url || t.background_url ? (
                    <img src={t.thumbnail_url || t.background_url} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-muted to-border">
                      <FileText className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                {selected?.id === t.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{t.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}