import React from 'react';
import { Shield, Download, Trash2 } from 'lucide-react';
import { GlassPanel } from '../../../design/primitives';
import { useConsentStore } from '../../../features/consent/consentStore';
import { useToast } from '../../../components/components';

export const ConsentPage: React.FC = () => {
  const { toast } = useToast();
  const { lms, github, wellness, setConsent, resetAll } = useConsentStore();

  const handleToggle = (key: 'lms' | 'github' | 'wellness', currentVal: boolean) => {
    setConsent(key, !currentVal);
    toast(
      'Consent Preferences Updated',
      `Data collection for ${key.toUpperCase()} has been ${!currentVal ? 'enabled' : 'disabled'}.`,
      'guard'
    );
  };

  const handleExportData = () => {
    const data = {
      user_id: 'STU_HERO',
      consents: { lms, github, wellness },
      timestamp: new Date().toISOString(),
      collected_records: {
        discrete_math_grade: '62%',
        platform_active_streak: '5 days',
        github_profile_status: github ? 'Connected (Last commit 8d ago)' : 'Disconnected (Access Revoked)',
        wellness_heartbeat: wellness ? 'Connected (0.43 variance)' : 'Disconnected (Data Shield Active)'
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drishta-student-profile-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast('Data Profile Exported', 'All collected telemetry downloaded successfully.', 'guard');
  };

  const handleDeleteProfile = () => {
    if (window.confirm('WARNING: This will permanently delete your Drishta student database records and cancel active recommendations. This action is irreversible. Proceed?')) {
      resetAll();
      localStorage.clear();
      toast('Profile Deleted', 'All personal identifiers and records purged from system.', 'error');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-guard/10 border border-guard/20 text-guard rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-medium text-text">Privacy Governance</h1>
            <p className="text-xs text-text-dim">DPDP-Compliant Data Sharing Agreements</p>
          </div>
        </div>
      </div>

      <GlassPanel depth="card" className="space-y-6 border-t-2 border-t-guard shadow-[0_-4px_12px_rgba(79,207,151,0.05)]">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-text">How Drishta Utilizes Your Telemetry</h2>
          <p className="text-xs text-text-dim leading-relaxed">
            Drishta is built around data transparency. The core decision engines compute suggestions only using information you explicitly approve. You have granular authority to grant or revoke pipeline access instantly.
          </p>
        </div>

        <div className="space-y-4 pt-3 border-t border-line">
          {/* LMS Consent */}
          <div className="flex items-start justify-between space-x-4 p-3 bg-surface-2 rounded border border-line">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                University Learning Management (LMS)
                <span className="text-[9px] bg-guard/25 text-guard px-1.5 py-0.2 rounded border border-guard/30">Required for core</span>
              </span>
              <p className="text-xs text-text-dim leading-snug">
                Let Drishta read your quiz marks, homework submissions, and syllabus progress.
              </p>
            </div>
            <button
              onClick={() => handleToggle('lms', lms)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${lms ? 'bg-guard' : 'bg-line'}`}
              aria-label="Toggle LMS access"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${lms ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* GitHub/Leetcode Consent */}
          <div className="flex items-start justify-between space-x-4 p-3 bg-surface-2 rounded border border-line">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                GitHub & LeetCode Integrations
              </span>
              <p className="text-xs text-text-dim leading-snug">
                Let Drishta read your external commit active calendar and solved problems. Revoking this blocks job readiness score metrics.
              </p>
            </div>
            <button
              onClick={() => handleToggle('github', github)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${github ? 'bg-guard' : 'bg-line'}`}
              aria-label="Toggle GitHub access"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${github ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Wellness signals Consent */}
          <div className="flex items-start justify-between space-x-4 p-3 bg-surface-2 rounded border border-line">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                Platform Activity Duration (Wellness Signals)
              </span>
              <p className="text-xs text-text-dim leading-snug">
                Let Drishta monitor active study session timings and duration gaps to detect focus burnouts or prolonged absence flags.
              </p>
            </div>
            <button
              onClick={() => handleToggle('wellness', wellness)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${wellness ? 'bg-guard' : 'bg-line'}`}
              aria-label="Toggle wellness telemetry"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${wellness ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text">Your Data Rights</span>
            <p className="text-[11px] text-text-dim">Download your profile audit logs or delete your database records completely.</p>
          </div>
          <div className="flex space-x-2 shrink-0">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 bg-surface-2 hover:bg-line border border-line text-text rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export logs</span>
            </button>
            <button
              onClick={handleDeleteProfile}
              className="px-3 py-1.5 bg-risk-high/10 hover:bg-risk-high/20 border border-risk-high/20 text-risk-high rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Data</span>
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
