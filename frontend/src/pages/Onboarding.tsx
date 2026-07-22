import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { api } from '../lib/api';
import { Plate, BrassRule } from '../components/ui/Plates';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useRole();
  const [consent, setConsent] = useState({ dataSharing: false, mentorAI: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If faculty, they don't need to consent to these, skip
    if (role === 'faculty') {
      navigate('/console');
    }
  }, [role, navigate]);

  const handleToggle = (key: keyof typeof consent) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleComplete = async () => {
    setLoading(true);
    // In a real app we'd get the studentId from auth context
    await api.putConsent('stu_123', consent);
    setLoading(false);
    navigate('/home');
  };

  if (role === 'faculty') return null;

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col items-center pt-24">
      <div className="w-full max-w-lg">
        <h1 className="font-ceremonial text-4xl mb-2 text-ink">Data & Mentorship Consent</h1>
        <p className="font-body text-ink-soft mb-8">
          The Ivy Heritage platform uses your academic data to provide personalized mentorship and risk assessment. Please configure your preferences below.
        </p>

        <Plate className="p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-xl mb-1 text-ink">Academic Data Sharing</h3>
              <p className="font-body text-sm text-ink-soft">
                Allow faculty advisors to view your academic risk components (Attendance, Coursework, Engagement, Wellness) in their cohort overview.
              </p>
            </div>
            <button 
              onClick={() => handleToggle('dataSharing')}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${consent.dataSharing ? 'bg-primary' : 'bg-hairline'}`}
            >
              <span className={`absolute top-1 left-1 bg-surface w-4 h-4 rounded-full transition-transform shadow-sm ${consent.dataSharing ? 'translate-x-6' : 'translate-x-0'} border border-brass`} />
            </button>
          </div>

          <BrassRule />

          <div className="flex items-start justify-between gap-4 mt-6">
            <div>
              <h3 className="font-display text-xl mb-1 text-ink">AI Mentor Interactions</h3>
              <p className="font-body text-sm text-ink-soft">
                Enable the AI Mentor assistant. This allows the system to analyze your coursework patterns to provide personalized study suggestions.
              </p>
            </div>
            <button 
              onClick={() => handleToggle('mentorAI')}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${consent.mentorAI ? 'bg-primary' : 'bg-hairline'}`}
            >
              <span className={`absolute top-1 left-1 bg-surface w-4 h-4 rounded-full transition-transform shadow-sm ${consent.mentorAI ? 'translate-x-6' : 'translate-x-0'} border border-brass`} />
            </button>
          </div>
        </Plate>

        <button 
          onClick={handleComplete}
          disabled={loading}
          className="w-full py-4 bg-primary text-surface font-ceremonial text-xl tracking-widest uppercase rounded shadow-sm foil-shimmer transition-transform active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Enter Student Portal'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
