'use client';

import { useAuth } from '@/lib/AuthContext';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();

  console.log('🏠 Home page - Loading:', loading, 'User:', user?.email || 'none');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#91d2f4]/10 to-[#cba2ea]/10">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  console.log('🏠 Rendering:', user ? 'Dashboard' : 'LandingPage');
  return user ? <Dashboard /> : <LandingPage />;
}
