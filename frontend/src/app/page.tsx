'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Features, Footer, Hero, Navbar } from '@/sections';

export default function LandingPage() {
  // hooks
  const router = useRouter();

  return (
    <div className="min-h-screen bg-accent-background">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
