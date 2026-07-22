import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { Features } from './sections/Features';
import { Trust } from './sections/Trust';
import { CtaFooter } from './sections/CtaFooter';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('drishta_auth_token');

  // State to track scroll depth for transparent-to-glass nav transition
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight - 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCta = () => {
    if (token) {
      navigate({ to: '/app/today' });
    } else {
      navigate({ to: '/app/login' });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans relative">
      {/* 1. Transparent-to-Glass Sticky Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${
          scrolled 
            ? 'bg-white/90 border-b border-line shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md translate-y-0 opacity-100' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate({ to: '/' })}>
          <div className="w-2.5 h-2.5 rounded-full bg-decide" />
          <span className="text-xl font-display italic font-bold text-text tracking-tight">Drishta</span>
        </div>

        {/* Desktop Anchor Links */}
        <div className="hidden sm:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-text-dim">
          <a href="#how-it-works" className="hover:text-decide transition-colors">How it works</a>
          <a href="#features" className="hover:text-decide transition-colors">Features</a>
          <a href="#platform" className="hover:text-decide transition-colors">Platform</a>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCta}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-decide hover:bg-decide/90 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-decide/20 cursor-pointer"
          >
            <span>{token ? 'See your plan' : 'Sign in'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* 2. Page Sections */}
      <Hero />
      <HowItWorks />
      <Features />
      <Trust />
      <CtaFooter />
    </div>
  );
};
export default LandingPage;
