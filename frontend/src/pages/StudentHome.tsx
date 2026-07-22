import React, { useState, useEffect } from 'react';
import { api, type StudentState, type StudentPlan, type ReviewTopic, type InternshipMatch, type Prediction } from '../lib/api';
import { Plate, EngravedText, BrassRule } from '../components/ui/Plates';
import { LivingCrest } from '../components/ui/LivingCrest';
import { WaxSeal } from '../components/ui/WaxSeal';
import { Sparkline } from '../components/ui/Sparkline';
import { MentorDrawer } from '../components/student/MentorDrawer';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['Today', 'Me', 'Reviews', 'Internships', 'Predictions'] as const;
type Tab = typeof TABS[number];

const StudentHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Today');
  
  // Data states
  const [state, setState] = useState<StudentState | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  
  // Tab-specific data
  const [reviews, setReviews] = useState<ReviewTopic[]>([]);
  const [internships, setInternships] = useState<InternshipMatch[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const fetchStudentData = () => {
    api.getState('STU_HERO').then(setState);
    api.getPlan('STU_HERO').then(setPlan);
  };

  useEffect(() => {
    fetchStudentData();
    window.addEventListener('api-refresh', fetchStudentData);
    return () => window.removeEventListener('api-refresh', fetchStudentData);
  }, []);

  const loadTabData = async (tab: Tab) => {
    if (tab === 'Reviews' && reviews.length === 0) setReviews(await api.getReviewsDueToday('stu_123'));
    if (tab === 'Internships' && internships.length === 0) setInternships(await api.getInternships('stu_123'));
    if (tab === 'Predictions' && predictions.length === 0) setPredictions(await api.getPredictions('stu_123'));
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  if (!state || !plan) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-ceremonial text-xl text-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-ink-soft">Loading student profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-hairline pt-8 px-6 pb-0 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-ceremonial text-4xl text-ink mb-6">Welcome, {state.name.split(' ')[0]}</h1>
          <div className="flex space-x-6 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-display text-lg relative whitespace-nowrap transition-colors ${activeTab === tab ? 'text-primary' : 'text-ink-soft hover:text-ink'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'Today' && <TodayTab plan={plan} />}
            {activeTab === 'Me' && <MeTab state={state} />}
            {activeTab === 'Reviews' && <ReviewsTab reviews={reviews} />}
            {activeTab === 'Internships' && <InternshipsTab internships={internships} />}
            {activeTab === 'Predictions' && <PredictionsTab predictions={predictions} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <MentorDrawer studentId="stu_123" />
    </div>
  );
};

// --- Tab Components ---

const TodayTab = ({ plan }: { plan: StudentPlan }) => {
  const [tasks, setTasks] = useState(plan.tasks);

  const handleComplete = async (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: true } : t));
    await api.completeTask('stu_123', id);
  };

  if (tasks.length === 0 && plan.interventions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60">
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4">
          <path d="M 10 20 L 90 20 L 90 80 C 90 110 50 120 50 120 C 50 120 10 110 10 80 Z" />
        </svg>
        <EngravedText className="text-xl">The slate is clear today.</EngravedText>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {plan.interventions.map(int => (
        <Plate key={int.id} className="p-4 bg-primary-tint border-primary/20 flex gap-4">
          <div className="w-1 bg-primary rounded-full shrink-0" />
          <div>
            <h3 className="font-ceremonial text-xl text-primary-deep">{int.title}</h3>
            <p className="font-body text-ink mt-1">{int.description}</p>
          </div>
        </Plate>
      ))}

      <h2 className="font-ceremonial text-2xl uppercase tracking-widest text-brass mt-8 mb-4">Missions</h2>
      <div className="space-y-3">
        {tasks.map(task => (
          <Plate key={task.id} className="p-4 flex items-center justify-between group">
            <div className={`transition-all duration-500 ${task.completed ? 'opacity-60 grayscale' : ''}`}>
              <h4 className={`font-display text-lg ${task.completed ? 'line-through decoration-brass' : ''}`}>{task.title}</h4>
              <span className="text-xs font-mono text-ink-soft bg-surface px-2 py-0.5 rounded border border-hairline mt-2 inline-block">
                Why: Customized study task
              </span>
            </div>
            
            <button 
              onClick={() => handleComplete(task.id)}
              disabled={task.completed}
              className="relative w-12 h-12 flex items-center justify-center"
            >
              {task.completed ? (
                <WaxSeal show={true} size="md" color="brass" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-brass group-hover:bg-brass/10 transition-colors" />
              )}
            </button>
          </Plate>
        ))}
      </div>
    </div>
  );
};

const MeTab = ({ state }: { state: StudentState }) => {
  const [coding, setCoding] = useState<any>(null);
  const [loadingCoding, setLoadingCoding] = useState(true);

  useEffect(() => {
    api.getCoding(state.id).then(profile => {
      setCoding(profile);
      setLoadingCoding(false);
    });
  }, [state.id]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <LivingCrest riskBand={state.riskBand} components={state.components} motto={state.motto} animateOnLoad={false} />
        
        {state.whyCopy && (
          <div className="mt-8 p-4 bg-surface rounded border-l-4 border-brass">
            <EngravedText>{state.whyCopy}</EngravedText>
          </div>
        )}

        <div className="mt-8 p-6 bg-surface rounded border border-hairline">
          <h3 className="font-ceremonial text-2xl uppercase tracking-widest text-brass mb-4">Coding Profile</h3>
          {loadingCoding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-brass border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-sm text-ink-soft">Loading profile...</span>
            </div>
          ) : coding ? (
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between border-b border-hairline/50 pb-1">
                <span className="text-ink-soft">Handle</span>
                <span className="text-ink font-semibold">{coding.handle}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/50 pb-1">
                <span className="text-ink-soft">Rating</span>
                <span className="text-ink font-semibold">{coding.rating || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/50 pb-1">
                <span className="text-ink-soft">Max Rating</span>
                <span className="text-ink font-semibold">{coding.max_rating || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/50 pb-1">
                <span className="text-ink-soft">Rank</span>
                <span className="text-ink font-semibold capitalize">{coding.rank || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/50 pb-1">
                <span className="text-ink-soft">Solved Count</span>
                <span className="text-ink font-semibold">{coding.solved_count !== undefined ? coding.solved_count : "N/A"}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-ink-soft">Inactive Days</span>
                <span className="text-ink font-semibold">{coding.last_active_days !== undefined ? coding.last_active_days : "N/A"} days</span>
              </div>
            </div>
          ) : (
            <div className="text-ink-soft font-body text-sm py-2">
              No coding profile linked.
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <h2 className="font-ceremonial text-2xl uppercase tracking-widest text-brass mb-4">Components</h2>
        {state.components.map(c => (
          <div key={c.id} className="mb-4">
            <div className="flex justify-between font-mono text-sm mb-1">
              <span>{c.label}</span>
              <span className="text-ink-soft">{c.value}%</span>
            </div>
            <div className="h-2 bg-hairline rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${c.value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewsTab = ({ reviews }: { reviews: ReviewTopic[] }) => {
  const [graded, setGraded] = useState<Record<string, number>>({});
  
  if (reviews.length === 0) return <div>Loading...</div>;
  
  const unsealed = reviews.filter(r => graded[r.id] === undefined);
  
  if (unsealed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60">
        <WaxSeal show={true} size="lg" color="brass" />
        <EngravedText className="text-xl mt-6">All reviews sealed for today.</EngravedText>
      </div>
    );
  }

  const topic = unsealed[0]; // Show one at a time for page-flip

  return (
    <div className="max-w-md mx-auto relative perspective-[1000px]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={topic.id}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Plate className="p-8 aspect-square flex flex-col items-center justify-center text-center">
            <h3 className="font-ceremonial text-3xl mb-8">{topic.title}</h3>
            <p className="font-mono text-sm text-ink-soft mb-8 uppercase tracking-widest">How well do you recall this?</p>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(grade => (
                <button
                  key={grade}
                  onClick={() => {
                    api.gradeReview('stu_123', topic.id, grade);
                    setGraded(prev => ({ ...prev, [topic.id]: grade }));
                  }}
                  className="w-12 h-12 rounded-full border border-brass font-mono flex items-center justify-center hover:bg-brass hover:text-surface transition-colors active:scale-95"
                >
                  {grade}
                </button>
              ))}
            </div>
          </Plate>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const InternshipsTab = ({ internships }: { internships: InternshipMatch[] }) => (
  <div className="space-y-6">
    {internships.map(match => (
      <Plate key={match.id} className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-2xl">{match.title}</h3>
            <p className="font-ceremonial text-xl text-primary">{match.company}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-3xl text-brass">{match.matchScore}%</span>
            <span className="text-xs uppercase tracking-widest text-ink-soft">Match</span>
          </div>
        </div>
        
        <BrassRule />
        <p className="font-body text-ink-soft italic mb-6">"{match.whyCopy}"</p>
        
        <div className="flex gap-2 flex-wrap">
          {match.haveSkills.map(s => (
            <span key={s} className="px-3 py-1 bg-primary-tint text-primary-deep text-xs font-mono rounded-full border border-primary/20">✓ {s}</span>
          ))}
          {match.missingSkills.map(s => (
            <span key={s} className="px-3 py-1 bg-transparent text-ink-soft text-xs font-mono rounded-full border border-dashed border-hairline">○ {s}</span>
          ))}
        </div>
      </Plate>
    ))}
  </div>
);

const PredictionsTab = ({ predictions }: { predictions: Prediction[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {predictions.map(pred => (
      <Plate key={pred.id} className="p-6 flex flex-col justify-between">
        <h3 className="font-ceremonial text-xl text-ink-soft mb-6">{pred.metric}</h3>
        <div className="flex items-end justify-between">
          <span className="font-mono text-4xl text-ink">{pred.forecast}</span>
          <Sparkline data={pred.history} trend={pred.trend} width={100} height={40} />
        </div>
      </Plate>
    ))}
  </div>
);

export default StudentHome;
