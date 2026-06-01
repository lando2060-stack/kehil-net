import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Settings, FolderOpen, X, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import UploadPanel from '@/components/sidebar/UploadPanel';

const navItems = [
  { path: '/', label: 'ראשי', icon: LayoutDashboard },
  { path: '/create', label: 'יצירת מודעה', icon: Plus, highlight: true },
  { path: '/my-announcements', label: 'המודעות שלי', icon: FolderOpen },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-primary text-primary-foreground z-40 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-frank font-bold text-secondary">מודעות קהילה</h1>
        <p className="text-xs mt-1 opacity-70">יצירת מודעות לבתי כנסת</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-secondary text-secondary-foreground shadow-md"
                  : item.highlight
                  ? "bg-secondary/20 text-primary-foreground hover:bg-secondary/30"
                  : "text-primary-foreground/80 hover:bg-sidebar-accent hover:text-primary-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}


      </nav>

      {/* Bottom buttons */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => { setShowUpload(!showUpload); setShowSettings(false); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-all w-full"
        >
          <Upload className="w-5 h-5" />
          <span>העלאה</span>
        </button>
        <button
          onClick={() => { setShowSettings(!showSettings); setShowUpload(false); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-all w-full"
        >
          <Settings className="w-5 h-5" />
          <span>הגדרות</span>
        </button>
      </div>

      {showSettings && (
        <div className="absolute bottom-0 right-0 w-full bg-white text-foreground shadow-2xl rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}
      {showUpload && (
        <UploadPanel onClose={() => setShowUpload(false)} />
      )}
    </aside>
  );
}

function SettingsPanel({ onClose }) {
  const queryClient = useQueryClient();
  const [synagogueName, setSynagogueName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['settings-user'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setSynagogueName(user.synagogue_name || '');
      setLogoUrl(user.logo_url || '');
      return user;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ synagogue_name: synagogueName, logo_url: logoUrl }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings-user'] }); toast.success('ההגדרות נשמרו'); onClose(); },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url);
    setUploading(false);
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">הגדרות</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">שם בית הכנסת</Label>
          <Input value={synagogueName} onChange={e => setSynagogueName(e.target.value)} className="mt-1 h-8 text-sm" placeholder="הזינו את שם בית הכנסת" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">לוגו</Label>
          <div className="mt-1 flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="לוגו" className="w-12 h-12 object-contain rounded border" />}
            <input type="file" accept="image/*" id="sidebar-logo-upload" className="hidden" onChange={handleLogoUpload} />
            <Button variant="outline" size="sm" className="text-xs h-8"
              onClick={() => document.getElementById('sidebar-logo-upload').click()}
              disabled={uploading}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'העלאת לוגו'}
            </Button>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full h-8 text-sm">
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'שמור הגדרות'}
        </Button>
      </div>
    </div>
  );
}