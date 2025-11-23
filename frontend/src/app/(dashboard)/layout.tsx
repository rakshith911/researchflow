// ./frontend/src/app/(dashboard)/layout.tsx

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { GuestBanner } from '@/components/guest/guest-banner';
import { SaveProgressModal } from '@/components/guest/save-progress-modal';
import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/document-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { loadDocuments } = useDocumentStore(); // ✅ FIXED: Changed from loadAllDocuments

  // Load documents once when dashboard mounts
  useEffect(() => {
    loadDocuments(); // ✅ FIXED: Changed from loadAllDocuments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty array is intentional - only load once on mount

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {/* ✅ Guest mode banner */}
          <div className="sticky top-0 z-40 p-4 pb-0">
            <GuestBanner />
          </div>
          
          {children}
          
          {/* ✅ Save progress modal */}
          <SaveProgressModal />
        </main>
      </div>
    </ProtectedRoute>
  );
}