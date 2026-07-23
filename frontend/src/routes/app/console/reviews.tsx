import React from 'react';
import { useInterventions, useReviewIntervention } from '../../../api/hooks';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { EmptyState, useToast } from '../../../components/components';
import { ShieldCheck } from 'lucide-react';

export const ConsoleReviewsPage: React.FC = () => {
  const { data: interventions, isLoading, error } = useInterventions();
  const reviewMutation = useReviewIntervention();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'pending' | 'audit'>('pending');
  const [selectedInterventionId, setSelectedInterventionId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [isApproving, setIsApproving] = React.useState(true); // true = Approve, false = Override/Deny

  const handleSubmitReview = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      await reviewMutation.mutateAsync({
        id,
        approved: isApproving,
        note: note.trim() || undefined
      });

      toast(
        isApproving ? 'Intervention Approved' : 'Intervention Overridden',
        isApproving 
          ? 'Recommendation has been dispatched to student pathway.' 
          : 'Safety check dismissed. Records updated.',
        isApproving ? 'guard' : 'speak'
      );

      setSelectedInterventionId(null);
      setNote('');
    } catch (err) {
      toast('Review Failed', 'Failed to submit override credentials.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Parsing governance queue...</span>
      </div>
    );
  }

  if (error || !interventions) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Oversight Pipeline Failed"
          description="Failed to resolve active interventions registry from the backend."
        />
      </div>
    );
  }

  // Filter lists:
  // Pending: manual (auto == false) AND not reviewed/approved yet
  const pendingInterventions = interventions.filter(
    (i) => !i.auto && i.approved === false
  );

  // Audit list: automatic (auto == true) OR already approved/dismissed manual ones
  const auditInterventions = interventions.filter(
    (i) => i.auto || i.approved !== false
  );

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-1">
        <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
          GOVERNANCE SAFETY LAYER
        </span>
        <h1 className="text-3xl font-display font-medium text-text flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-guard" />
          <span>Oversight Control Console</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line">
        <button
          onClick={() => { setActiveTab('pending'); setSelectedInterventionId(null); }}
          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'pending'
              ? 'border-guard text-guard'
              : 'border-transparent text-text-dim hover:text-text'
          }`}
        >
          Pending Safety Reviews ({pendingInterventions.length})
        </button>
        <button
          onClick={() => { setActiveTab('audit'); setSelectedInterventionId(null); }}
          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'audit'
              ? 'border-guard text-guard'
              : 'border-transparent text-text-dim hover:text-text'
          }`}
        >
          Automatic Audit Log ({auditInterventions.length})
        </button>
      </div>

      {/* Main content queue */}
      <BentoGrid className="!grid-cols-1 md:!grid-cols-2 lg:!grid-cols-2">
        {activeTab === 'pending' ? (
          pendingInterventions.length === 0 ? (
            <EmptyState
              title="All queues clear"
              description="No manual interventions are pending faculty review. Pathways are clear."
              action={
                <div className="flex items-center justify-center gap-2 text-guard text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Safety gates aligned</span>
                </div>
              }
            />
          ) : (
            pendingInterventions.map((item) => {
              const isSelected = selectedInterventionId === item.id;
              
              return (
                <BentoCard key={item.id} size="none" className="space-y-4 flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-text">{item.student_name || 'Generic Student'}</span>
                        <span className="text-[9px] bg-surface-2 border border-line px-1.5 py-0.2 rounded font-mono uppercase tracking-wider text-text-dim">
                          ID: {item.student_id}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-text mt-1">{item.action}</h4>
                      <p className="text-xs text-text-dim leading-snug">
                        Risk Factor: <strong className="text-text-dim">{item.why}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-line mt-4">
                      <button
                        onClick={() => { setSelectedInterventionId(isSelected ? null : item.id); setIsApproving(true); }}
                        className="px-3 py-1.5 bg-guard text-white hover:bg-guard/90 rounded text-xs font-bold transition cursor-pointer"
                      >
                        Approve Target
                      </button>
                      <button
                        onClick={() => { setSelectedInterventionId(isSelected ? null : item.id); setIsApproving(false); }}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-line border border-line text-text rounded text-xs font-bold transition cursor-pointer"
                      >
                        Override / Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Expansion note form */}
                  {isSelected && (
                    <form 
                      onSubmit={(e) => handleSubmitReview(e, item.id)}
                      className="p-4 bg-surface-2 border border-line rounded-lg space-y-3 animate-slide-in"
                    >
                      <div className="space-y-1">
                        <label className="text-xs text-text-dim font-bold block" htmlFor="note-area">
                          Reasoning Note ({isApproving ? 'Approval Audit log' : 'Override justification'}):
                        </label>
                        <textarea
                          id="note-area"
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Provide context explaining this oversight decision..."
                          className="w-full bg-surface border border-line rounded-md py-2 px-3 text-xs text-text focus:border-guard focus:outline-none transition-colors"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInterventionId(null)}
                          className="px-3 py-1.5 bg-surface-2 hover:bg-line border border-line text-text-dim hover:text-text rounded text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={reviewMutation.isPending}
                          className={`px-4 py-1.5 rounded text-xs font-bold text-white transition cursor-pointer ${
                            isApproving ? 'bg-guard hover:bg-guard/90' : 'bg-speak hover:bg-speak/90'
                          }`}
                        >
                          {reviewMutation.isPending ? 'Logging review...' : 'Commit Decision'}
                        </button>
                      </div>
                    </form>
                  )}
                </BentoCard>
              )
            })
          )
        ) : (
          /* Audit Tab: automatic + reviewed ones */
          auditInterventions.length === 0 ? (
            <EmptyState
              title="Audit trail empty"
              description="No interventions have been triggered or reviewed in this session."
            />
          ) : (
            auditInterventions.map((item) => {
              const isApproved = item.approved;
              const isAuto = item.auto;

              return (
                <BentoCard key={item.id} size="none" className="p-5 space-y-3 border-t-[3px] border-t-line flex flex-col justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-text">{item.student_name}</span>
                      <span className="text-[10px] text-text-dim font-mono">ID: {item.student_id}</span>
                    </div>
                    <div className="shrink-0">
                      {isAuto ? (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-decide-lo border border-decide/20 text-decide px-2 py-0.5 rounded font-mono font-semibold uppercase">
                          Auto-Dispatched
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-guard/10 border border-guard/20 text-guard px-2 py-0.5 rounded font-mono font-semibold uppercase">
                          Faculty Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-surface-2 border border-line text-text-dim px-2 py-0.5 rounded font-mono font-semibold uppercase">
                          Faculty Dismissed
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text">{item.action}</h4>
                    <p className="text-xs text-text-dim mt-1">Trigger: {item.why}</p>
                    
                    {item.note && (
                      <div className="mt-3 text-xs text-text-dim italic bg-surface-2 p-3 rounded-lg border border-line">
                        Decision Note: {item.note}
                      </div>
                    )}
                  </div>
                  </div>
                </BentoCard>
              )
            })
          )
        )}
      </BentoGrid>
    </div>
  );
};
