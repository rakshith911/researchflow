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
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Floating Sidebar */}
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative z-0">
          {/* Background Gradients */}
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Guest Banner */}
          <div className="flex-none px-6 pt-6 z-10">
            <GuestBanner />
          </div>

          {/* Scrollable Page Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-border/50">
            {children}
          </div>

          <SaveProgressModal />
        </main>
      </div>
    </ProtectedRoute>
  );
}