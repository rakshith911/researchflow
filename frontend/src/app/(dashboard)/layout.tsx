// frontend/src/app/(dashboard)/layout.tsx

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/document-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { loadAllDocuments } = useDocumentStore();

  // Load documents once when dashboard mounts
  useEffect(() => {
    loadAllDocuments();
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}