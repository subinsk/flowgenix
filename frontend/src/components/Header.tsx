'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-card-foreground">
            🌊 Flowgenix
          </h1>
          <span className="text-sm text-muted-foreground">
            No-Code Workflow Builder
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-card-foreground">
              Welcome, {user.name}
            </span>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
