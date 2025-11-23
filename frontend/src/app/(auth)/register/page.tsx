import { RegisterForm } from '@/components/auth/register-form';
import { Brain } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md rounded-lg bg-card border border-border p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ResearchFlow</span>
          </Link>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}