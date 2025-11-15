'use client';

import { useAuth } from '@/lib/AuthContext';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
}
