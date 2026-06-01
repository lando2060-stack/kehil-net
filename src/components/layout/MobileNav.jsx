import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Plus, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'ראשי', icon: LayoutDashboard },
  { path: '/create', label: 'יצירת מודעה', icon: Plus },
  { path: '/my-announcements', label: 'המודעות שלי', icon: FolderOpen },
  { path: '/community', label: 'גלריה קהילתית', icon: Users },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <div className="fixed top-0 right-0 left-0 h-16 bg-primary text-primary-foreground z-50 flex items-center justify-between px-4 shadow-lg">
        <h1 className="text-lg font-frank font-bold text-secondary">מודעות קהילה</h1>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-0 left-0 bg-primary z-40 shadow-xl"
          >
            <nav className="p-3 space-y-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-primary-foreground/80 hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}