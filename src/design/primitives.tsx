import React from 'react';

// 1. Metric component - only component allowed to render IBM Plex Mono font-mono
interface MetricProps {
  value: string | number;
  unit?: string;
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({ value, unit, className = '' }) => {
  return (
    <span className={`font-mono tracking-tight text-text ${className}`}>
      {value}
      {unit && <span className="text-[0.75em] text-text-dim ml-0.5">{unit}</span>}
    </span>
  );
};

// 2. WhyChip component - requires source, drives color of border glow
interface WhyChipProps {
  source: 'decide' | 'speak';
  children: React.ReactNode;
  className?: string;
}

export const WhyChip: React.FC<WhyChipProps> = ({ source, children, className = '' }) => {
  const borderBgClass = source === 'decide'
    ? 'border-l-[3px] border-decide bg-decide-lo'
    : 'border-l-[3px] border-speak bg-speak-lo';

  return (
    <div className={`inline-flex items-center text-[13px] py-3 px-4 rounded-r-[10px] rounded-l-[4px] ${borderBgClass} ${className}`}>
      <span className="text-text font-normal">{children}</span>
    </div>
  );
};

// 3. RiskBand component - derives level, score, and color
interface RiskBandProps {
  score: number;
  className?: string;
}

export const RiskBand: React.FC<RiskBandProps> = ({ score, className = '' }) => {
  let text = 'Low';
  let colorClass = 'text-risk-low border-risk-low/20 bg-risk-low/5';

  if (score > 70) {
    text = 'High';
    colorClass = 'text-risk-high border-risk-high/20 bg-risk-high/5';
  } else if (score > 40) {
    text = 'Medium';
    colorClass = 'text-risk-med border-risk-med/20 bg-risk-med/5';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClass} ${className}`}>
      {text}
    </span>
  );
};

// 4. KindTag component - maps kind enum to a small tag
export type MissionKind = 'review' | 'practice' | 'academic' | 'career' | 'recovery' | 'stretch';

interface KindTagProps {
  kind: MissionKind;
  className?: string;
}

export const KindTag: React.FC<KindTagProps> = ({ kind, className = '' }) => {
  const map: Record<MissionKind, { label: string; style: string }> = {
    review:   { label: 'Review',   style: 'bg-decide-lo text-decide border-decide/20' },
    practice: { label: 'Practice', style: 'bg-speak-lo text-speak border-speak/20' },
    academic: { label: 'Academic', style: 'bg-decide-lo/50 text-decide border-decide/20' },
    career:   { label: 'Career',   style: 'bg-guard-lo text-guard border-guard/20' },
    recovery: { label: 'Recovery', style: 'bg-risk-high/10 text-risk-high border-risk-high/20' },
    stretch:  { label: 'Stretch',  style: 'bg-accent-2/10 text-accent-2 border-accent-2/20' },
  };

  const current = map[kind] || { label: kind, style: 'bg-surface-2 text-text-dim border-line' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${current.style} ${className}`}>
      {current.label}
    </span>
  );
};

// 5. GlassPanel component - tiered depth levels (DEPRECATED - Use BentoCard instead)
interface GlassPanelProps {
  depth: 'shell' | 'card' | 'modal';
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', id, onClick }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-surface border border-line p-5 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] ${onClick ? 'cursor-pointer hover:-translate-y-[2px] transition-all duration-200 hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// 6. StatusBadge - reusable pill for general state labels
interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    neutral: 'bg-surface-2 border-line text-text-dim',
    success: 'bg-guard-lo border-guard/20 text-guard',
    warning: 'bg-speak-lo border-speak/20 text-speak',
    error: 'bg-risk-high/10 border-risk-high/20 text-risk-high',
    info: 'bg-decide-lo border-decide/20 text-decide',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// 7. SegmentedBar - richer premium stacked bar for vectors
interface SegmentedBarProps {
  components: {
    score_gap: number;
    syllabus_behind: number;
    activity_recency: number;
    trend: number;
  };
  className?: string;
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({ components, className = '' }) => {
  const { score_gap, syllabus_behind, activity_recency, trend } = components;
  const total = score_gap + syllabus_behind + activity_recency + trend || 1;

  const segments = [
    { label: 'Score Gap', value: score_gap, color: 'bg-decide', width: (score_gap / total) * 100 },
    { label: 'Syllabus Lags', value: syllabus_behind, color: 'bg-speak', width: (syllabus_behind / total) * 100 },
    { label: 'Recency Gap', value: activity_recency, color: 'bg-risk-high', width: (activity_recency / total) * 100 },
    { label: 'Trend Deficit', value: trend, color: 'bg-accent-2', width: (trend / total) * 100 },
  ];

  return (
    <div className={`space-y-4 w-full ${className}`}>
      <div className="w-full h-5 bg-surface-2 rounded-full overflow-hidden flex shadow-inner">
        {segments.map((seg, idx) => (
          seg.width > 0 ? (
            <div
              key={idx}
              className={`${seg.color} h-full transition-all duration-700 ease-out`}
              style={{ width: `${seg.width}%` }}
              title={`${seg.label}: ${seg.value}%`}
            />
          ) : null
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${seg.color} shrink-0`} />
              <span className="text-xs text-text-dim truncate">{seg.label}</span>
            </div>
            <span className="font-mono text-text font-semibold text-lg ml-4">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
