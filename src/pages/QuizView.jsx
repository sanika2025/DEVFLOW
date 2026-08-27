import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import { Card } from '../components/Card';

export default function QuizView() {
  const { dayNumber } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayId = searchParams.get('dayId');
  const { user } = useAuthStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz', dayNumber],
    queryFn: () => lessonService.getDayQuiz(dayNumber),
    enabled: !!dayNumber
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!quizData?.success || !quizData.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">No Quiz Found for Day {dayNumber}</h2>
        <button onClick={() => navigate('/learning')} className="mt-4 text-indigo-600 hover:underline">
          Return to Learning Hub
        </button>
      </div>
    );
  }

  const { title, description, questions } = quizData.data;
  
  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-10">
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <BrainCircuit size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 mb-2">Quiz Completed!</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">You scored {score} out of {questions.length}.</p>
          
          <button 
            onClick={() => navigate('/learning')}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
          >
            Return to Learning Hub
          </button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === currentQuestion.correct_index;

  const handleNext = async () => {
    let finalScore = score;
    if (isCorrect) {
      finalScore += 1;
      setScore(finalScore);
    }
    
    if (currentIdx === questions.length - 1) {
      setIsSaving(true);
      if (user?.id) {
        let res;
        if (dayId) {
          res = await progressService.markDayComplete(user.id, dayId);
        } else {
          res = await progressService.markDayCompleteByNumber(user.id, dayNumber);
        }
        if (!res.success) {
          alert('Error saving progress: ' + res.error);
        }
      }
      setIsSaving(false);
      setIsFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/learning')}
        className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Learning Hub
      </button>

      <header className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-zinc-50">{title}</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2">{description}</p>
        <div className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </header>

      <Card className="p-8">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-50 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let optionStyles = "border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 dark:text-zinc-300";
            
            if (isAnswered) {
              if (idx === currentQuestion.correct_index) {
                optionStyles = "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400";
              } else if (idx === selectedOption) {
                optionStyles = "border-rose-500 dark:border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-400";
              } else {
                optionStyles = "border-slate-100 dark:border-zinc-800 opacity-50 dark:text-zinc-500";
              }
            } else if (selectedOption === idx) {
              optionStyles = "border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionStyles}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isAnswered && idx === currentQuestion.correct_index && <CheckCircle2 className="text-emerald-500" />}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.correct_index && <XCircle className="text-rose-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-400'}`}>
            <h4 className="font-bold mb-1">{isCorrect ? 'Correct!' : 'Incorrect'}</h4>
            <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            disabled={!isAnswered || isSaving}
            onClick={handleNext}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors flex items-center gap-2"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </Card>
    </div>
  );
}
