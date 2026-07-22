import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { LivingCrest } from '../components/ui/LivingCrest';
import { api } from '../lib/api';
import { Plate } from '../components/ui/Plates';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simple mock auth logic based on roll number format to demo role switching
    const assignedRole = rollNumber.startsWith('F-') ? 'faculty' : 'student';
    await api.login(rollNumber);
    setRole(assignedRole);
    setLoading(false);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-primary-deep text-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient pattern / texture could go here */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]" />

      <div className="z-10 w-full max-w-lg flex flex-col items-center">
        {/* The Hero Ring / Self-assembling Crest */}
        <div className="mb-12">
          <LivingCrest
            riskBand="medium"
            motto="Sees the student. Shows the reason."
            components={[
              { id: '1', label: '', value: 100, risk: 'low' },
              { id: '2', label: '', value: 100, risk: 'low' },
              { id: '3', label: '', value: 100, risk: 'low' },
              { id: '4', label: '', value: 100, risk: 'low' },
            ]}
            animateOnLoad={true}
          />
        </div>

        <h1 className="font-ceremonial text-5xl md:text-7xl mb-4 text-center tracking-tight">Drishta</h1>
        <p className="font-body text-primary-tint mb-12 text-center max-w-md opacity-80">
          Sees the student. Shows the reason.
        </p>

        <Plate className="p-8 w-full bg-surface text-ink relative">
          <form onSubmit={handleEntry} className="flex flex-col gap-6">
            <div className="flex flex-col">
              <label htmlFor="roll" className="font-ceremonial uppercase tracking-widest text-xs text-ink-soft mb-2">
                Roll Number / Credentials
              </label>
              <input
                id="roll"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. S-1029 or F-990"
                className="bg-transparent border-b-2 border-hairline focus:border-brass py-2 font-mono text-lg outline-none transition-colors"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brass text-primary-deep font-ceremonial text-xl uppercase tracking-widest foil-shimmer transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'Authenticating...' : 'Enter Console'}
            </button>
          </form>

          {/* Demo Chips (Wax pills) */}
          <div className="mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => setRollNumber('S-1234')}
              className="px-3 py-1 rounded-full bg-risk-low text-surface text-xs font-mono shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-risk-low)' }}
            >
              <div className="w-2 h-2 rounded-full bg-white opacity-50" />
              Demo: Student
            </button>
            <button 
              type="button"
              onClick={() => setRollNumber('F-9999')}
              className="px-3 py-1 rounded-full bg-risk-medium text-surface text-xs font-mono shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-risk-medium)' }}
            >
              <div className="w-2 h-2 rounded-full bg-white opacity-50" />
              Demo: Faculty
            </button>
          </div>
        </Plate>
      </div>
    </div>
  );
};

export default Hero;
