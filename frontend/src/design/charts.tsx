import React from 'react';

// 1. Sparkline chart - draws a small trend line
interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ points, width = 80, height = 30 }) => {
  if (!points || points.length === 0) return null;
  
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min === 0 ? 1 : max - min;
  
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const isDownward = points[points.length - 1] < points[0];
  // Using theme color variables: risk-high (declining), risk-low (improving)
  const strokeColor = isDownward ? 'var(--risk-high)' : 'var(--risk-low)';

  return (
    <svg width={width} height={height} className="overflow-visible" aria-label="Trend sparkline">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};

// 2. CompletionRing - draws a circular radial progress ring
interface CompletionRingProps {
  completion: number;
  size?: number;
}

export const CompletionRing: React.FC<CompletionRingProps> = ({ completion, size = 44 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - completion * circumference;
  
  // Theme color variable assignments: risk-low (high), risk-med (mid), risk-high (low)
  const color = completion >= 0.75 ? 'var(--risk-low)' : completion >= 0.4 ? 'var(--risk-med)' : 'var(--risk-high)';

  return (
    <div className="inline-flex items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--line)"
          strokeWidth="3"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute font-mono text-[10px] text-text font-bold">
        {Math.round(completion * 100)}%
      </span>
    </div>
  );
};

// 3. ComponentBars - horizontal risk vector indicators
interface ComponentBarsProps {
  components: {
    score_gap: number;
    syllabus_behind: number;
    activity_recency: number;
    trend: number;
  };
}

export const ComponentBars: React.FC<ComponentBarsProps> = ({ components }) => {
  // Using theme color variables: decide (Indigo), risk-med (Ochre), risk-high (Clay)
  const data = [
    { label: 'Score Gap', value: components.score_gap, color: 'var(--decide)' },
    { label: 'Syllabus Lags', value: components.syllabus_behind, color: 'var(--risk-med)' },
    { label: 'Activity Recency', value: components.activity_recency, color: 'var(--risk-high)' },
    { label: 'Trend Deficit', value: components.trend, color: 'var(--decide)' }
  ];

  return (
    <div className="space-y-3 w-full">
      {data.map((bar, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-text-dim">{bar.label}</span>
            <span className="font-mono text-text">{bar.value}%</span>
          </div>
          <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden border border-line">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// 4. MatchMeter - horizontal internship readiness indicator
interface MatchMeterProps {
  value: number;
}

export const MatchMeter: React.FC<MatchMeterProps> = ({ value }) => {
  const percent = Math.round(value * 100);
  const color = value >= 0.75 ? 'var(--risk-low)' : value >= 0.5 ? 'var(--risk-med)' : 'var(--risk-high)';

  return (
    <div className="flex items-center space-x-3 w-full">
      <div className="flex-1 bg-surface-2 h-2.5 rounded-full relative border border-line overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
};

// 5. ContributionStrip - 12 small square cells showing recent git commits
interface ContributionWeek {
  week_start: string;
  commit_count: number;
}

interface ContributionStripProps {
  weeks: ContributionWeek[];
}

export const ContributionStrip: React.FC<ContributionStripProps> = ({ weeks }) => {
  return (
    <div className="flex items-center space-x-1" role="img" aria-label="LeetCode & Git contribution history over the past 12 weeks">
      {weeks.map((w, i) => {
        // Color mapping: 0 = --line (bg-line); <= 3 = --guard-lo (bg-guard-lo); > 3 = --guard (bg-guard)
        let bgClass = 'bg-line';
        if (w.commit_count > 3) {
          bgClass = 'bg-guard';
        } else if (w.commit_count > 0) {
          bgClass = 'bg-guard-lo border border-guard/10';
        }
        
        return (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-sm transition-transform duration-100 hover:scale-110 ${bgClass}`}
            title={`Week of ${w.week_start}: ${w.commit_count} commits`}
            aria-label={`Week of ${w.week_start}: ${w.commit_count} commits`}
          />
        );
      })}
    </div>
  );
};
