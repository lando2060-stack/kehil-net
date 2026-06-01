import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Check, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export default function BackgroundPicker({ selected, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['bg-categories'],
    queryFn: () => base44.entities.BackgroundCategory.list('order', 50),
  });

  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: ['backgrounds-picker'],
    queryFn: () => base44.entities.Background.list('-created_date', 200),
  });

  const allCategories = ['הכל', ...categories.map(c => c.name)];

  const filtered = backgrounds.filter(bg => {
    if (search && !bg.name?.includes(search)) return false;
    if (activeCategory !== 'הכל') {
      if (!bg.categories?.includes(activeCategory)) return false;
    }
    return true;
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newBg = await base44.entities.Background.create({
      name: file.name.replace(/\.[^.]+$/, ''),
      image_url: file_url,
      is_shared: true,
      categories: [],
    });
    queryClient.invalidateQueries({ queryKey: ['backgrounds-picker'] });
    onSelect(newBg);
    setUploading(false);
    toast.success('הרקע הועלה');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search + upload */}
      <div className="px-3 pt-3 pb-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 h-8 text-sm"
          />
        </div>
        <input type="file" accept="image/*" id="bg-quick-upload" className="hidden" onChange={handleUpload} />
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 flex-shrink-0"
          onClick={() => document.getElementById('bg-quick-upload').click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </Button>
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
          <div className="text-center py-10 text-muted-foreground text-sm">אין רקעים</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(bg => (
              <button
                key={bg.id}
                onClick={() => onSelect(selected?.id === bg.id ? null : bg)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all',
                  selected?.id === bg.id
                    ? 'border-secondary shadow-md'
                    : 'border-transparent hover:border-border'
                )}
              >
                <div className="aspect-[3/4]">
                  <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
                </div>
                {selected?.id === bg.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{bg.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}