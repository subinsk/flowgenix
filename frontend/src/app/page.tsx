'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { Button, Card } from '../shared/components';
import { ANIMATIONS } from '../shared/constants';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: '🎯',
      title: 'Visual Workflow Builder',
      description: 'Drag and drop components to build powerful AI workflows without coding',
    },
    {
      icon: '🤖',
      title: 'AI Integration',
      description: 'Seamlessly integrate with GPT, Claude, and other leading AI models',
    },
    {
      icon: '📚',
      title: 'Knowledge Base',
      description: 'Upload documents and create intelligent knowledge retrieval systems',
    },
    {
      icon: '🔍',
      title: 'Web Search',
      description: 'Connect to real-time web search APIs for up-to-date information',
    },
    {
      icon: '💬',
      title: 'Interactive Chat',
      description: 'Chat with your workflows and get intelligent responses',
    },
    {
      icon: '⚡',
      title: 'Real-time Execution',
      description: 'See your workflows execute in real-time with live progress tracking',
    },
  ];

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ANIMATIONS.SPRING_SMOOTH}
        className="relative z-50 px-6 py-4 border-b border-border"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
              F
            </div>
            <span className="text-xl font-bold text-foreground">Flowgenix</span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/register')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, ...ANIMATIONS.SPRING_SMOOTH }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium border border-border">
                🚀 Now in Beta - Try it free!
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...ANIMATIONS.SPRING_SMOOTH }}
              className="text-4xl md:text-6xl font-bold text-foreground mb-6"
            >
              Build AI Workflows
              <br />
              <span className="text-muted-foreground">
                Visually
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...ANIMATIONS.SPRING_SMOOTH }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Create powerful AI workflows without coding. Drag, drop, and connect components 
              to build intelligent systems that understand your data and respond to your users.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ...ANIMATIONS.SPRING_SMOOTH }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                variant="primary"
                size="lg"
                loading={isLoading}
                onClick={handleGetStarted}
                className="min-w-[200px]"
              >
                Start Building Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  // Scroll to features section
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to build AI workflows
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make building AI workflows simple and intuitive
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, ...ANIMATIONS.SPRING_SMOOTH }}
                viewport={{ once: true }}
              >
                <Card hover padding="lg" className="h-full">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            viewport={{ once: true }}
          >
            <Card padding="lg" className="text-center bg-primary text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start building?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of builders creating the future with AI workflows
              </p>
              <Button
                variant="secondary"
                size="lg"
                loading={isLoading}
                onClick={handleGetStarted}
                className="bg-white text-primary hover:bg-gray-50"
              >
                Get Started Today
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="font-semibold text-foreground">Flowgenix</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Flowgenix. Building the future of AI workflows.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
