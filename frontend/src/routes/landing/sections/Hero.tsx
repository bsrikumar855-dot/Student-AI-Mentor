import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Moon, Sun, ArrowRight, Flame, Square, CheckSquare } from 'lucide-react';
import { useTheme } from '../../../app/ThemeContext';
import './Hero.css';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('drishta_auth_token');
  const { theme, toggleTheme } = useTheme();

  const handleCta = () => {
    if (token) {
      navigate({ to: '/app/today' });
    } else {
      navigate({ to: '/app/login' });
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-container">
      {/* Top Navigation */}
      <nav className="hero-nav">
        <div className="nav-logo" onClick={() => navigate({ to: '/' })} style={{cursor: 'pointer'}}>
          <span className="logo-dot"></span>
          <span className="logo-text">Drishta</span>
        </div>
        <div className="nav-links">
          <a href="#how-it-works">HOW IT WORKS</a>
          <a href="#features">FEATURES</a>
          <a href="#platform">PLATFORM</a>
        </div>
        <div className="nav-actions">
          <button className="moon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? (
              <Moon size={20} strokeWidth={1.5} />
            ) : (
              <Sun size={20} strokeWidth={1.5} />
            )}
          </button>
          <button className="see-plan-btn nav-see-plan" onClick={handleCta}>
            See your plan <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-content">
        {/* Left Column */}
        <div className="hero-left">
          <div className="platform-pill">
            DRISHTA MENTOR PLATFORM
          </div>
          <h1 className="hero-title">
            A mentor that<br />
            <span className="hero-title-italic">shows its work.</span>
          </h1>
          <p className="hero-description">
            Understand the <strong>why</strong> behind your study targets. Drishta uses explainable logic to build custom checklists, reviews, and forecasts with professional faculty guidance.
          </p>
          <div className="hero-buttons">
            <button className="see-plan-btn main-see-plan" onClick={handleCta}>See your plan</button>
            <button className="see-how-btn" onClick={scrollToHowItWorks}>See how it works</button>
          </div>
        </div>

        {/* Right Column */}
        <div className="hero-right">
          <div className="target-board">
            <div className="board-header">
              <div className="board-title">
                <span className="title-dot"></span> DAILY TARGET BOARD
              </div>
              <div className="days-pill">
                <Flame size={14} className="flame-icon" /> 6 DAYS
              </div>
            </div>

            {/* Task 1 */}
            <div className="task-item task-done">
              <div className="task-icon">
                <CheckSquare size={22} className="check-icon-done" />
              </div>
              <div className="task-details">
                <div className="task-name done-text">Solve 3 Graph Isomorphism practice proofs</div>
                <div className="task-meta">
                  <span className="meta-pill recovery">RECOVERY</span>
                  <span className="meta-desc">Graph accuracy is currently 42% and inactive 6d</span>
                </div>
              </div>
            </div>

            {/* Task 2 */}
            <div className="task-item task-active relative-task">
              <div className="task-icon">
                <Square size={22} className="check-icon-empty" />
              </div>
              <div className="task-details">
                <div className="task-name">Complete Spaced Repetition cards for Trees & Traversals</div>
                <div className="task-meta">
                  <span className="meta-pill review">REVIEW</span>
                  <span className="meta-desc">Decaying recall: Red-Black Trees (reps: 3, interval: 4d)</span>
                </div>
              </div>
              <div className="task-tooltip">
                Triggered by Syllabus Lag alert
              </div>
            </div>

            <div className="board-footer">
              <div className="footer-left">
                <span className="footer-bar">|</span> Interactive Sandbox Preview
              </div>
              <div className="footer-right">Synced live</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
