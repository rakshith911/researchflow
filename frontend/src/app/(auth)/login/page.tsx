'use client'

import { LoginForm } from '@/components/auth/login-form';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter()
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md">
        {/* ✅ Back button with proper navigation */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="rounded-lg bg-card border border-border p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">ResearchFlow</span>
            </Link>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}