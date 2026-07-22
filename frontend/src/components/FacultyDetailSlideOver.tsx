import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type StudentState, type StudentPlan } from '../lib/api';
import { LivingCrest } from './ui/LivingCrest';
import { BrassRule } from './ui/Plates';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyDetailSlideOver: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<StudentState | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      api.getState(id).then(setState);
      api.getPlan(id).then(setPlan);
    }
  }, [id]);

  const handleRegenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    const res = await api.generatePlan(id);
    if (res.success) {
      setPlan(prev => prev ? { ...prev, freshness: res.freshness } : null);
    }
    setIsGenerating(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => navigate('/console')}
      />
      
      <motion.div 
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-surface border-l border-hairline shadow-2xl z-50 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="p-6 border-b border-hairline flex justify-between items-center bg-bg relative">
          <h2 className="font-display text-2xl">{state ? state.name : 'Loading...'}</h2>
          <button 
            onClick={() => navigate('/console')} 
            className="text-ink-soft hover:text-ink font-mono text-sm tracking-widest uppercase transition-colors"
          >
            [ Close ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-surface space-y-8">
          {!state || !plan ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-64 bg-hairline rounded" />
              <div className="h-32 bg-hairline rounded" />
            </div>
          ) : (
            <>
              {/* Clinical Crest Variant */}
              <div className="relative">
                <LivingCrest 
                  riskBand={state.riskBand} 
                  components={state.components} 
                  motto={state.motto}
                  variant="clinical" 
                />
              </div>
              
              <BrassRule />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-ceremonial text-xl text-primary-deep mb-4 uppercase tracking-widest">Component Readings</h3>
                  <div className="space-y-4">
                    {state.components.map(c => (
                      <div key={c.id} className="flex justify-between items-center border-b border-hairline/50 pb-2">
                        <span className="font-body text-ink-soft">{c.label}</span>
                        <span className="font-mono text-ink">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-ceremonial text-xl text-primary-deep mb-4 uppercase tracking-widest">Active Plan</h3>
                  <div className="bg-bg border border-hairline rounded p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-ink-soft uppercase tracking-widest">Status</span>
                      <span className="font-mono text-xs text-risk-low uppercase tracking-widest">{plan.freshness || 'Current'}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 font-body text-sm text-ink-soft">
                      {plan.tasks.map(t => <li key={t.id}>{t.title}</li>)}
                    </ul>
                  </div>

                  <button 
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="w-full py-2 border border-brass text-brass hover:bg-brass hover:text-surface transition-colors font-mono uppercase text-xs tracking-widest rounded disabled:opacity-50"
                  >
                    {isGenerating ? 'Recalculating...' : 'Regenerate Plan'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FacultyDetailSlideOver;
