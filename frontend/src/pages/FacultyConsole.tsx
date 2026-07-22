import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { api, type StudentSummary, type Intervention, type IngestJob } from '../lib/api';
import { Plate } from '../components/ui/Plates';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['Cohort', 'Pending Reviews'] as const;
type Tab = typeof TABS[number];

const FacultyConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Cohort');
  const [isIngesting, setIsIngesting] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-12">
      <div className="bg-bg border-b border-hairline px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="font-ceremonial text-4xl text-ink mb-6">Faculty Console</h1>
            <div className="flex space-x-6">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-display text-lg relative whitespace-nowrap transition-colors ${activeTab === tab ? 'text-primary' : 'text-ink-soft hover:text-ink'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="facultyTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setIsIngesting(true)}
            className="mb-3 px-4 py-2 bg-brass text-ink font-mono uppercase text-sm tracking-widest rounded-sm hover:opacity-90 transition-opacity foil-shimmer"
          >
            Run Ingest
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Cohort' && <CohortTab />}
            {activeTab === 'Pending Reviews' && <PendingReviewsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <IngestModal isOpen={isIngesting} onClose={() => setIsIngesting(false)} />
      
      {/* Renders the slide-over */}
      <Outlet />
    </div>
  );
};

const CohortTab = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getStudents('all').then(setStudents);
  }, []);

  return (
    <Plate className="overflow-hidden bg-bg">
      <table className="w-full text-left font-body">
        <thead>
          <tr className="border-b border-hairline bg-surface/50 text-ink-soft uppercase text-xs font-mono tracking-widest">
            <th className="py-4 px-6 font-normal">Student</th>
            <th className="py-4 px-6 font-normal">Segment</th>
            <th className="py-4 px-6 font-normal">Status</th>
            <th className="py-4 px-6 font-normal text-right">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {students.map((stu, i) => (
            <motion.tr 
              key={stu.id}
              onClick={() => navigate(`/console/${stu.id}`, { state: { backgroundLocation: location } })}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-hairline/50 hover:bg-surface/50 cursor-pointer transition-colors"
            >
              <td className="py-4 px-6 font-display text-lg">{stu.name}</td>
              <td className="py-4 px-6 text-ink-soft capitalize">{stu.segment}</td>
              <td className="py-4 px-6">
                <span className={`inline-block px-3 py-1 text-xs font-mono rounded-full text-surface bg-risk-${stu.riskBand}`}
                      style={{ backgroundColor: `var(--color-risk-${stu.riskBand})` }}>
                  {stu.riskBand.toUpperCase()}
                </span>
              </td>
              <td className="py-4 px-6 text-right font-mono text-ink-soft text-sm">{stu.lastActive}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </Plate>
  );
};

const PendingReviewsTab = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getInterventions('pending').then(setInterventions);
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    await api.reviewIntervention(id, action, notes[id]);
    setInterventions(prev => prev.filter(i => i.id !== id));
  };

  if (interventions.length === 0) return <div className="text-center py-20 font-body text-ink-soft">No pending interventions.</div>;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {interventions.map(int => (
          <motion.div key={int.id} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}>
            <Plate className="p-6 bg-bg flex gap-6 items-start">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <h3 className="font-display text-xl">{int.studentName}</h3>
                  <span className="font-mono text-xs text-ink-soft">{int.date}</span>
                </div>
                <h4 className="font-ceremonial text-lg text-primary mb-2">{int.title}</h4>
                <p className="font-body text-ink-soft mb-4">{int.description}</p>
                <input
                  type="text"
                  placeholder="Add a faculty note (optional)"
                  value={notes[int.id] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [int.id]: e.target.value }))}
                  className="w-full bg-surface border border-hairline p-2 font-body text-sm rounded outline-none focus:border-brass mb-4"
                />
              </div>
              <div className="flex flex-col gap-2 w-32 shrink-0">
                <button 
                  onClick={() => handleReview(int.id, 'approve')}
                  className="w-full py-2 bg-primary text-surface font-mono text-sm uppercase tracking-widest rounded foil-shimmer hover:opacity-90"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReview(int.id, 'reject')}
                  className="w-full py-2 bg-transparent text-ink-soft border border-hairline font-mono text-sm uppercase tracking-widest rounded hover:bg-surface"
                >
                  Override
                </button>
              </div>
            </Plate>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Ingest Modal Component ---

const IngestModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [job, setJob] = useState<IngestJob | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJob(null);
      const run = async () => {
        const { jobId } = await api.startIngest();
        // Simulate polling
        let currentJob = await api.pollIngest(jobId);
        setJob(currentJob);
        // We'll just set it to completed right away for the mock, but we can animate rows
      };
      run();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={job?.status === 'completed' ? onClose : undefined}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="relative bg-bg p-8 rounded-lg shadow-2xl max-w-md w-full border border-hairline overflow-hidden"
          >
            <h2 className="font-ceremonial text-3xl mb-6">SIS Data Ingestion</h2>
            
            {!job ? (
              <div className="flex items-center gap-4 py-8">
                <div className="w-6 h-6 border-2 border-brass border-t-transparent rounded-full animate-spin" />
                <span className="font-mono uppercase tracking-widest text-sm">Connecting to SIS...</span>
              </div>
            ) : (
              <div>
                {/* Ledger filing motion representation */}
                <div className="h-32 relative border-y border-hairline bg-surface overflow-hidden mb-6 flex flex-col justify-end">
                  {[1,2,3,4,5].map(i => (
                    <motion.div 
                      key={i}
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="h-6 border-b border-hairline/50 w-full flex items-center px-4"
                    >
                      <div className="w-3/4 h-2 bg-hairline rounded" />
                    </motion.div>
                  ))}
                  
                  {job.status === 'completed' && (
                    <motion.div 
                      initial={{ scale: 2, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: -15 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-4xl text-risk-medium border-4 border-risk-medium p-2 uppercase opacity-40 font-bold"
                    >
                      PROCESSED
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between font-mono text-sm mb-6">
                  <span>{job.processedRows} / {job.totalRows} Rows</span>
                  <span className="text-risk-high">{job.skippedRows} Skipped</span>
                </div>
                
                {job.skippedRows > 0 && (
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="bg-surface border-l-2 border-risk-high p-3 mb-6 relative overflow-hidden"
                  >
                    {/* Dog-eared corner */}
                    <div className="absolute top-0 right-0 border-l-[16px] border-b-[16px] border-l-transparent border-b-bg" />
                    <p className="font-body text-xs text-ink-soft">Notice: {job.skippedRows} records skipped due to missing prerequisite maps.</p>
                  </motion.div>
                )}

                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-brass text-ink font-mono uppercase tracking-widest rounded hover:bg-brass-bright transition-colors"
                >
                  Close Ledger
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FacultyConsole;
