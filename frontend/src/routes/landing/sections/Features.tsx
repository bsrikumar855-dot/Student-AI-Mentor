import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Sparkles, TrendingUp, Check } from 'lucide-react';
import { Metric } from '../../../design/primitives';
import { ReviewCard } from '../../../components/components';
import type { TopicMemory } from '../../../api/schemas';

export const Features: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // 1. Spaced Repetition memory state
  const mockMemory: TopicMemory = {
    topic: 'Red-Black Trees Rotation',
    subject: 'Data Structures & Algorithms',
    why: 'Difficulty rating was high on last repetition',
    reps: 3,
    interval: 4,
    ease_factor: 1.8,
    due_date: '2026-07-22',
  };

  const featureVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  return (
    <section id="features" className="py-24 bg-bg overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 space-y-24">
        {/* Section Header */}
        <div className="max-w-xl mx-auto text-center space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-decide block">Product Superpowers</span>
          <h2 className="text-3xl font-display font-medium text-text">
            Explainable <span className="text-decide italic">Features</span>
          </h2>
          <p className="text-sm text-text-dim leading-relaxed">
            Drishta strips away the mystery of machine guidance. We believe transparency builds trust and better learning habits.
          </p>
        </div>

        {/* Feature 1: Spaced Repetition */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={featureVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
            <div className="w-10 h-10 rounded-full bg-decide-lo border border-decide/20 flex items-center justify-center mx-auto lg:mx-0 text-decide">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-medium text-text">Spaced repetition that shows its math</h3>
            <p className="text-sm text-text-dim leading-relaxed">
              Every card lists your exact interval spacing, SM-2 difficulty factor, and reason for insertion. Rate your memory recall on a scale of 0 to 5 and watch your intervals expand or recover automatically.
            </p>
          </div>
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[420px] scale-95 md:scale-100 shadow-[0_10px_40px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-surface border border-line p-1">
              <ReviewCard 
                memory={mockMemory} 
                onGrade={() => {}} 
                isPending={true}
              />
            </div>
          </div>
        </motion.div>

        {/* Feature 2: Career Readiness */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={featureVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Order swapping for alternating layout on desktop */}
          <div className="lg:col-span-6 lg:order-2 space-y-4 text-center lg:text-left">
            <div className="w-10 h-10 rounded-full bg-guard-lo border border-guard/20 flex items-center justify-center mx-auto lg:mx-0 text-guard">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-medium text-text">Career readiness, not empty promises</h3>
            <p className="text-sm text-text-dim leading-relaxed">
              Instead of matching keywords on a resume, Drishta maps your skill level against live Git commits and test grades. We reveal verified skill matches alongside your direct gaps.
            </p>
          </div>
          <div className="lg:col-span-6 lg:order-1 flex justify-center">
            <div className="w-full max-w-[420px] p-6 bg-surface border border-line rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] space-y-4 text-left">
              <div>
                <h4 className="text-sm font-semibold text-text">Systems Engineering Intern</h4>
                <span className="text-[11px] text-text-dim font-medium block">Core Systems Lab</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-text-dim uppercase tracking-wider block">Skill Fit Match Rate</span>
                <div className="w-full h-2 rounded-full bg-line/60 overflow-hidden relative border border-line/50">
                  {/* Fill animation triggered when in view */}
                  <motion.div 
                    className="absolute top-0 left-0 bottom-0 bg-guard"
                    initial={{ width: 0 }}
                    whileInView={{ width: '92%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono font-bold text-guard">
                  <span>Matched Fit</span>
                  <Metric value={92} unit="%" />
                </div>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-line/60">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-guard font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Verified Skills</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-guard-lo border border-guard/30 text-guard px-2 py-0.5 rounded-md">POSIX Threads</span>
                  <span className="text-[10px] bg-guard-lo border border-guard/30 text-guard px-2 py-0.5 rounded-md">Virtual Memory</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature 3: Honest AI Falls Back */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={featureVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
            <div className="w-10 h-10 rounded-full bg-speak-lo border border-speak/20 flex items-center justify-center mx-auto lg:mx-0 text-speak">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-medium text-text">A mentor that admits when it's offline</h3>
            <p className="text-sm text-text-dim leading-relaxed">
              If our AI model encounters ambiguous data or has network difficulties, it drops into an honest fallback offline mode immediately. We flag templated responses explicitly so you know when the LLM is speaking and when it isn't.
            </p>
          </div>
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[420px] p-6 bg-surface border border-line rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] space-y-4 text-left font-sans">
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-surface-2 border border-line rounded-xl p-3 rounded-tr-none text-xs text-text max-w-[80%]">
                    Can you explain how red-black tree rotations work offline?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-speak-lo border border-speak/20 text-text rounded-xl p-3 rounded-tl-none border-l-[3px] border-l-speak max-w-[85%] shadow-sm relative">
                    <span className="inline-flex items-center space-x-1 text-[8.5px] bg-surface border border-line text-speak px-1.5 py-0.5 rounded-md font-mono font-semibold uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                      <span>offline mode — templated reply</span>
                    </span>
                    <p className="text-xs leading-relaxed">
                      Hello there! I am currently running in offline template mode. To learn details on Tree Rotations, consult your daily study board practice questions or speak to Professor H. during office hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature 4: Academic Projections */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={featureVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="lg:col-span-6 lg:order-2 space-y-4 text-center lg:text-left">
            <div className="w-10 h-10 rounded-full bg-decide-lo border border-decide/20 flex items-center justify-center mx-auto lg:mx-0 text-decide">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-medium text-text">Forecasts that know they are projections</h3>
            <p className="text-sm text-text-dim leading-relaxed">
              We estimate your semester course grades and GPA trend based on current syllabus status. Every statistical prediction is labeled with its limitations, warning you that the numbers are forecasts, not promises.
            </p>
          </div>
          <div className="lg:col-span-6 lg:order-1 flex justify-center">
            <div className="w-full max-w-[420px] p-6 bg-surface border border-line rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between gap-6 text-left border-t-4 border-t-decide">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-text-dim block font-mono">Projected GPA</span>
                <div className="flex items-baseline space-x-1">
                  <Metric value="3.42" className="text-3xl font-bold" />
                  <span className="text-[10px] text-text-dim font-mono">on 4.0 scale</span>
                </div>
                <span className="text-[10px] text-speak font-semibold uppercase block pt-1 font-mono">
                  ⚠ projection, not a promise.
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-text-dim block font-mono">Exam Trend</span>
                <span className="text-xs bg-guard-lo border border-guard/25 text-guard px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider block mt-1">
                  Stable
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
