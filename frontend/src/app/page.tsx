'use client';

import React from 'react';
import { Features, Footer, Hero, Navbar } from '@/sections';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-accent-background">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
