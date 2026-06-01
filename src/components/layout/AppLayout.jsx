import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <main className="min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}