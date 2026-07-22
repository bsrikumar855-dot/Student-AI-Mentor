import React from 'react';
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { WhyChip } from '../../../design/primitives';

export const Trust: React.FC = () => {
  return (
    <section id="platform" className="py-24 bg-surface-2 border-y border-line relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 space-y-16 text-center">
        {/* Section Header */}
        <div className="max-w-xl mx-auto space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-text-dim block">Platform Safeguards</span>
          <h2 className="text-3xl font-display font-medium text-text">
            Our Honesty <span className="text-decide italic">Commitments</span>
          </h2>
          <p className="text-sm text-text-dim leading-relaxed">
            Drishta operates on student-first design principles. We hold ourselves to absolute transparency rules in every calculation.
          </p>
        </div>

        {/* Safeguard Grid (Visual Double of WhyChips) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-line hover:border-decide/35 transition-colors p-6 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="p-2 w-10 h-10 rounded-full bg-decide-lo border border-decide/20 text-decide flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Explainable Calculations</h3>
              <p className="text-xs text-text-dim leading-relaxed">
                We never hide calculations behind closed logic matrices. Every metric standing number shown in Drishta is accompanied by its underlying explanation reasons.
              </p>
            </div>
            <div className="pt-2">
              <WhyChip source="decide" className="w-full text-left py-1.5 text-[10.5px]">
                Every number shows its explanation reasons.
              </WhyChip>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-line hover:border-guard/35 transition-colors p-6 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="p-2 w-10 h-10 rounded-full bg-guard-lo border border-guard/20 text-guard flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Faculty Governance</h3>
              <p className="text-xs text-text-dim leading-relaxed">
                Academic intervention recommendations require a manual sign-off. High-priority interventions are checked and approved by human academic advisors.
              </p>
            </div>
            <div className="pt-2">
              <WhyChip source="speak" className="w-full text-left py-1.5 text-[10.5px]">
                Human faculty retains final override powers.
              </WhyChip>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-line hover:border-speak/35 transition-colors p-6 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="p-2 w-10 h-10 rounded-full bg-speak-lo border border-speak/20 text-speak flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Student Data Ownership</h3>
              <p className="text-xs text-text-dim leading-relaxed">
                Drishta is gated by strict student consent tokens. You control precisely what feeds are integrated, and can revoke connection access tokens at any time.
              </p>
            </div>
            <div className="pt-2">
              <WhyChip source="decide" className="w-full text-left py-1.5 text-[10.5px]">
                Complete data connection control.
              </WhyChip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
