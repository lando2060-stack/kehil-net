import React, { useState } from 'react';
import { Download, Loader2, Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function DownloadButton({ canvasRef, title }) {
  const [loading, setLoading] = useState(false);

  const download = async (withBackground) => {
    if (!canvasRef?.current) return;
    setLoading(true);

    const html2canvas = (await import('html2canvas')).default;

    // Temporarily hide background image if downloading without it
    const bgImg = canvasRef.current.querySelector('.canvas-bg');
    if (bgImg && !withBackground) {
      bgImg.style.display = 'none';
    }

    const canvas = await html2canvas(canvasRef.current, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: withBackground ? null : '#ffffff',
      logging: false,
    });

    if (bgImg && !withBackground) {
      bgImg.style.display = '';
    }

    const link = document.createElement('a');
    link.download = `${title || 'מודעה'}_${withBackground ? 'עם_רקע' : 'ללא_רקע'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading} className="gap-2 h-8 px-3 text-sm">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          הורדה
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => download(true)} className="gap-2 cursor-pointer">
          <Image className="w-4 h-4 text-primary" />
          הורד עם רקע
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => download(false)} className="gap-2 cursor-pointer">
          <FileImage className="w-4 h-4 text-muted-foreground" />
          הורד ללא רקע (על לבן)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}