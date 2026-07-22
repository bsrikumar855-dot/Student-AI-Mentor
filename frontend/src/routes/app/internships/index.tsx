import React from 'react';
import { useInternships } from '../../../api/hooks';
import { useConsentStore } from '../../../features/consent/consentStore';
import { WhyChip } from '../../../design/primitives';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { MatchMeter } from '../../../design/charts';
import { EmptyState, useToast } from '../../../components/components';
import { Briefcase, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Github = GithubIcon;

export const InternshipsPage: React.FC<{
  onNavigateToConsent?: () => void;
  onNavigateToMissions?: () => void;
}> = ({ onNavigateToConsent, onNavigateToMissions }) => {
  const studentId = localStorage.getItem('drishta_student_id') || 'student_1';
  const hasGithubConsent = useConsentStore((state) => state.github);
  const { setConsent } = useConsentStore();
  const { data: matches, isLoading, error } = useInternships(studentId);
  const { toast } = useToast();

  const handleEnableGithub = () => {
    setConsent('github', true);
    toast(
      'GitHub Connector Enabled',
      'Integration established. Analyzing code repository index.',
      'guard'
    );
  };

  // 1. Gated State: Consent is disabled
  if (!hasGithubConsent) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-0">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
            INTEGRATED MATCHING
          </span>
          <h1 className="text-3xl font-display font-medium text-text">Career Readiness</h1>
        </div>

        <BentoCard size="wide" className="border-t-2 border-t-risk-high p-6 space-y-4 text-center">
          <div className="inline-flex p-3 bg-risk-high/10 border border-risk-high/20 rounded-full text-risk-high mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-text">Connector Access Required</h3>
            <p className="text-xs text-text-dim leading-relaxed">
              Drishta analyzes your real-world coding commits to confirm skill proficiencies. Let Drishta read your GitHub activity to unlock internship alignment matches.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={handleEnableGithub}
              className="w-full sm:w-auto px-4 py-2 bg-guard text-gray-950 hover:bg-guard/90 rounded font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>Let Drishta read your GitHub activity</span>
            </button>
            {onNavigateToConsent && (
              <button
                onClick={onNavigateToConsent}
                className="w-full sm:w-auto px-4 py-2 bg-surface-2 hover:bg-line border border-line text-text rounded text-xs font-semibold transition cursor-pointer"
              >
                Configure Toggles
              </button>
            )}
          </div>
        </BentoCard>
      </div>
    );
  }

  // 2. Loading and Error states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Parsing repository skill arrays...</span>
      </div>
    );
  }

  if (error || !matches) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Career Engine Sync Error"
          description="Failed to retrieve internship match profiles. Verify MSW handlers status."
        />
      </div>
    );
  }

  // Sort by match descending
  const sortedMatches = [...matches].sort((a, b) => b.match - a.match);

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-1">
        <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
          INTEGRATED MATCHING
        </span>
        <h1 className="text-3xl font-display font-medium text-text flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-decide" />
          <span>Internship Alignment</span>
        </h1>
      </div>

      <BentoGrid>
        {sortedMatches.map((role, idx) => (
          <BentoCard size="md" key={idx} className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-text leading-tight">{role.title}</h3>
                <span className="text-xs text-text-dim font-medium">{role.company}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-dim uppercase tracking-wider block">Skill Fit</span>
                <div className="mt-1 w-20">
                  <MatchMeter value={role.match} />
                </div>
              </div>
            </div>

            {/* Have skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-guard/80 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Verified Skills (Found in commits)</span>
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 p-2.5 bg-surface-2/50 rounded-lg border border-line">
                {role.have_skills.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center space-x-1.5 text-xs text-text font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-guard shrink-0 animate-pulse" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing skills */}
            {role.missing_skills.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-text-dim flex items-center gap-1">
                  <X className="w-3.5 h-3.5 text-risk-high" />
                  <span>Unverified / Missing Gaps</span>
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-2 p-2.5 bg-surface-2/50 rounded-lg border border-line">
                  {role.missing_skills.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center space-x-1.5 text-xs text-text-dim font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-risk-high shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explainable Why Chip */}
            <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto">
              <WhyChip source="decide" className="text-[10px] py-1">
                {role.why}
              </WhyChip>
              {onNavigateToMissions && role.missing_skills.length > 0 && (
                <button
                  onClick={onNavigateToMissions}
                  className="inline-flex items-center space-x-1 text-xs text-brand hover:underline font-semibold shrink-0 cursor-pointer text-left transition-colors"
                >
                  <span>How to close the gap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </BentoCard>
        ))}
      </BentoGrid>
    </div>
  );
};
