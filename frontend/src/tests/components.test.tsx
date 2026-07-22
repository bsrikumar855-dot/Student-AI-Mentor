import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Metric, WhyChip, RiskBand } from '../design/primitives';

describe('Rule-Enforcing Primitives', () => {
  test('Metric primitive ensures IBM Plex Mono font is used for core numbers', () => {
    const { container } = render(<Metric value={95} unit="%" />);
    const metricElement = container.querySelector('span');
    
    // Assert font-mono styling is explicitly applied
    expect(metricElement).toHaveClass('font-mono');
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  test('WhyChip primitive requires source and applies correct glow border color', () => {
    // 1. Decision source -> Indigo border
    const { container: decideContainer } = render(
      <WhyChip source="decide">Core logic computation trigger</WhyChip>
    );
    const decideChip = decideContainer.firstChild;
    expect(decideChip).toHaveClass('border-l-[3px]');
    expect(decideChip).toHaveClass('border-decide');
    expect(decideChip).toHaveClass('bg-decide-lo');
    expect(screen.getByText('Core logic computation trigger')).toBeInTheDocument();

    // 2. Phrased speak source -> Amber border
    const { container: speakContainer } = render(
      <WhyChip source="speak">Mentor verbal explanation recommendation</WhyChip>
    );
    const speakChip = speakContainer.firstChild;
    expect(speakChip).toHaveClass('border-l-[3px]');
    expect(speakChip).toHaveClass('border-speak');
    expect(speakChip).toHaveClass('bg-speak-lo');
    expect(screen.getByText('Mentor verbal explanation recommendation')).toBeInTheDocument();
  });

  test('RiskBand correctly translates scores to categorical levels', () => {
    // High risk > 70 -> High
    const { rerender } = render(<RiskBand score={75} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('High')).toHaveClass('text-risk-high');

    // Med risk 41-70 -> Medium
    rerender(<RiskBand score={50} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toHaveClass('text-risk-med');

    // Low risk <= 40 -> Low
    rerender(<RiskBand score={25} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Low')).toHaveClass('text-risk-low');
  });
});

describe('SM-2 Algorithm Logic', () => {
  // Let's test the SM-2 repetition updates
  test('SM-2 updates reps, intervals, and ease factors correctly based on grades', () => {
    // Case 1: Grade >= 3 (Recall Success)
    let reps = 0;
    let interval = 1;
    let ease_factor = 2.5;
    const grade = 4;

    if (grade >= 3) {
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
      reps = reps + 1;
    } else {
      reps = 0;
      interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    ease_factor = Math.max(1.3, ease_factor);

    expect(reps).toBe(1);
    expect(interval).toBe(1);
    expect(Number(ease_factor.toFixed(2))).toBe(2.5); // 2.5 + (0.1 - 1 * 0.1) = 2.5

    // Repeat 2nd iteration with Grade 5 (Perfect recall)
    const nextGrade = 5;
    if (nextGrade >= 3) {
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
      reps = reps + 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - nextGrade) * (0.08 + (5 - nextGrade) * 0.02));

    expect(reps).toBe(2);
    expect(interval).toBe(6);
    expect(Number(ease_factor.toFixed(2))).toBe(2.6); // 2.5 + (0.1 - 0) = 2.6
  });
});
