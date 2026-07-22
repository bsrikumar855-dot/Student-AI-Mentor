import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Shield } from 'lucide-react';

export const CtaFooter: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('drishta_auth_token');

  const handleCta = () => {
    if (token) {
      navigate({ to: '/app/today' });
    } else {
      navigate({ to: '/app/login' });
    }
  };

  return (
    <footer className="bg-bg py-16">
      <div className="max-w-4xl mx-auto px-6 space-y-12 text-center">
        {/* Warm CTA Block */}
        <div className="bg-surface rounded-3xl border border-line p-10 md:p-14 space-y-8 max-w-2xl mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h2 className="text-3xl md:text-4xl font-display font-medium text-text">
            Ready to study with <span className="text-decide italic">clarity?</span>
          </h2>
          <p className="text-sm text-text-dim max-w-md mx-auto leading-relaxed">
            Gain a complete, transparent view of your targets. Log in with your university directory credentials to unlock your personalized plan today.
          </p>
          <div className="pt-4">
            <button
              onClick={handleCta}
              className="px-8 py-3.5 bg-decide hover:bg-decide/90 text-white rounded-full font-bold text-sm tracking-wide shadow-lg shadow-decide/20 transition-all hover:scale-105 cursor-pointer"
            >
              {token ? 'Go to dashboard' : 'Enter your credentials'}
            </button>
          </div>
        </div>

        {/* Minimal Footer Links */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-dim">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-decide" />
            <span className="font-semibold text-text font-display italic text-lg">Drishta</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => navigate({ to: '/app/consent' })}
              className="hover:text-decide hover:underline transition cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Data Settings & Consent</span>
            </button>
            <a href="mailto:support@drishta.edu" className="hover:text-decide hover:underline transition">
              Support Core Desk
            </a>
          </div>

          <p className="font-mono text-[10px] text-text-dim/80">
            © {new Date().getFullYear()} Drishta Core Academic. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
