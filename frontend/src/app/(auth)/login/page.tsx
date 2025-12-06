'use client'

import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your workspace."
    >
      <LoginForm />
    </AuthLayout>
  );
}