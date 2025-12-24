// ./frontend/src/app/(dashboard)/layout.tsx

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { GuestBanner } from '@/components/guest/guest-banner';
import { SaveProgressModal } from '@/components/guest/save-progress-modal';
import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/document-store';
import { usePathname } from 'next/navigation'; // ✅ Import usePathname
import { AnimatePresence, motion } from 'framer-motion'; // ✅ Import Framer Motion

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { loadDocuments } = useDocumentStore();
  const pathname = usePathname(); // ✅ Get current path

  // Load documents once when dashboard mounts
  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-[-1]" />
          <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-[-1]" />

          {/* Guest Banner */}
          <div className="flex-none px-6 pt-6 z-10">
            <GuestBanner />
          </div>

          {/* Scrollable Page Content with Transitions */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }} // Slide up slightly
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-border/50"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <SaveProgressModal />
        </main>
      </div>
    </ProtectedRoute>
  );
}