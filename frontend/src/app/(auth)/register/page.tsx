'use client'

import { RegisterForm } from '@/components/auth/register-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Join the critical thinkers"
      subtitle="Create your free account to start building your knowledge graph."
    >
      <RegisterForm />
    </AuthLayout>
  );
}