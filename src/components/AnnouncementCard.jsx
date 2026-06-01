import React from 'react';
import { FileText, Eye, Pencil, Copy, Trash2, Globe, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function AnnouncementThumbnail({ announcement }) {
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: announcement.background_url ? `url(${announcement.background_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {announcement.text_elements?.map(el => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${(el.x / 595) * 100}%`,
            top: `${(el.y / 842) * 100}%`,
            width: `${(el.width / 595) * 100}%`,
            fontSize: `${Math.max(el.fontSize * 0.35, 6)}px`,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            color: el.color,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight,
            direction: 'rtl',
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
          }}
        >
          {el.content}
        </div>
      ))}
      {!announcement.background_url && !announcement.text_elements?.length && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-muted to-border">
          <FileText className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

export default function AnnouncementCard({
  announcement,
  onPreview = undefined,
  onNavigate = undefined,
  onDuplicate = undefined,
  onDelete = undefined,
  onToggleShare = undefined,
  compact = false,
}) {
  return (
    <Card className="overflow-hidden group relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={`${compact ? 'aspect-[3/4]' : 'aspect-[3/4]'} bg-muted cursor-pointer relative overflow-hidden`}>
            <AnnouncementThumbnail announcement={announcement} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" dir="rtl">
          {onNavigate && (
            <DropdownMenuItem onClick={() => onNavigate(`/create?edit=${announcement.id}`)}>
              <Pencil className="w-4 h-4 ml-2" /> ערוך
            </DropdownMenuItem>
          )}
          {onPreview && (
            <DropdownMenuItem onClick={() => onPreview(announcement)}>
              <Eye className="w-4 h-4 ml-2" /> תצוגה מקדימה
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(announcement)}>
              <Copy className="w-4 h-4 ml-2" /> ערוך עותק
            </DropdownMenuItem>
          )}
          {onToggleShare && !announcement.is_draft && (
            <DropdownMenuItem onClick={() => onToggleShare(announcement)}>
              {announcement.is_shared ? <Lock className="w-4 h-4 ml-2" /> : <Globe className="w-4 h-4 ml-2" />}
              {announcement.is_shared ? 'הפוך לפרטי' : 'שתף עם הקהילה'}
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(announcement)}>
              <Trash2 className="w-4 h-4 ml-2" /> מחק
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {announcement.is_draft && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">טיוטה</Badge>
        </div>
      )}

      <div className={compact ? 'p-1.5' : 'p-3'}>
        <p className={`${compact ? 'text-[10px]' : 'text-sm'} truncate font-medium ${compact ? 'text-muted-foreground' : ''}`}>
          {announcement.title}
        </p>
        {!compact && (
          <Badge variant="outline" className="text-[10px] mt-1">
            {announcement.is_shared ? 'משותף' : 'פרטי'}
          </Badge>
        )}
      </div>
    </Card>
  );
}
