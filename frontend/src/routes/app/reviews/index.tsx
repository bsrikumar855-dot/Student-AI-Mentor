import React from 'react';
import { useReviews, useGradeReview } from '../../../api/hooks';
import { Metric } from '../../../design/primitives';
import { ReviewCard, EmptyState, useToast } from '../../../components/components';
import { Brain, CheckCircle } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const studentId = localStorage.getItem('drishta_student_id') || 'student_1';
  const { data: reviews, isLoading, error } = useReviews(studentId);
  const gradeMutation = useGradeReview(studentId);
  const { toast } = useToast();

  const handleGrade = async (topic: string, grade: number) => {
    try {
      const result = await gradeMutation.mutateAsync({ topic, grade });
      
      const isPassing = grade >= 3;
      const toastType = isPassing ? 'guard' : 'speak';
      const toastMsg = isPassing 
        ? `Recall verified. Next review in ${result.interval} days (Rep #${result.reps}).`
        : `Recall low. Resetting interval to ${result.interval} day. Keep practicing!`;
        
      toast(
        `Grade ${grade} Logged`,
        toastMsg,
        toastType
      );
    } catch (err: any) {
      toast('Grading Failed', 'Could not sync grading metrics to SM-2 core. Reverted.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Fetching memory model status...</span>
      </div>
    );
  }

  if (error || !reviews) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Memory Retrieval Failed"
          description="Could not establish contact with the SM-2 Spaced Repetition engine. Ensure MSW is online."
        />
      </div>
    );
  }

  const pendingReviews = reviews;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-medium text-text flex items-center gap-2">
            <Brain className="w-7 h-7 text-decide" />
            <span>Memory Reviews</span>
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-dim block">Topics due today</span>
          <Metric value={pendingReviews.length} className="text-2xl font-bold text-decide" />
        </div>
      </div>

      {/* Reviews Queue list */}
      <div className="space-y-4">
        {pendingReviews.length === 0 ? (
          <EmptyState
            title="Nothing due today"
            description="Your memory's on track. All active subject keywords are safely within their calculated recall boundaries."
            action={
              <div className="flex items-center justify-center gap-2 text-guard text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>0 decay flags detected</span>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviews.map((memory, idx) => (
              <ReviewCard
                key={idx}
                memory={memory}
                onGrade={(grade) => handleGrade(memory.topic, grade)}
                isPending={gradeMutation.isPending && gradeMutation.variables?.topic === memory.topic}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
