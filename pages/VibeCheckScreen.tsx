import React, { useState, useEffect } from 'react';
import { RISHIKESH_INTERESTS } from '../constants';
import { generateRishikeshQuiz, matchTravelers } from '../lib/ragBackendService';
import { Question, Match } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';

interface VibeCheckScreenProps {
  onBack: () => void;
  onJoin: () => void;
  destination?: string;
}

type VibeState = 'INTERESTS' | 'LOADING_QUIZ' | 'QUIZ' | 'LOADING_MATCH' | 'RESULTS';

const useCountUp = (target: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeProgress * target));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);
  return count;
};

const ResultsView: React.FC<{ matches: Match[], onReset: () => void, onJoin: () => void }> = ({ matches, onReset, onJoin }) => {
  const averageComp = matches.length > 0 ? Math.round(matches.reduce((a, b) => a + b.compatibility, 0) / matches.length) : 0;
  const animatedAvg = useCountUp(averageComp);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 h-full flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Expedition Tribe</h2>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1.5">Frequency alignment successful</p>
      </div>

      <M3Card variant="elevated" className="mb-6 bg-gradient-to-br from-[#0A3D91] to-[#001A40] p-6 text-white rounded-[2rem]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-blue-300 font-black uppercase tracking-[0.2em] text-[8px] mb-1">Overall Sync</h4>
            <div className="text-4xl font-black flex items-baseline">
              {animatedAvg}<span className="text-lg ml-1 opacity-30">%</span>
            </div>
          </div>
          <div className="flex -space-x-3">
            {matches.slice(0, 4).map((m, i) => (
              <img key={m.id} src={m.avatar} className="w-10 h-10 rounded-full border-2 border-[#0A3D91] shadow-xl" alt="avatar" />
            ))}
          </div>
        </div>
      </M3Card>

      <div className="space-y-3 flex-grow content-start overflow-y-auto no-scrollbar pb-4">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Top Alignment Matches:</p>
        {matches.slice(0, 3).map((match) => (
          <div key={match.id} className="bg-white rounded-[1.5rem] border border-gray-100 p-4 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all group">
            <div className="relative shrink-0">
              <img src={match.avatar} alt={match.name} className="w-14 h-14 rounded-xl border border-gray-50 shadow-inner group-hover:scale-105 transition-transform" />
              <div className="absolute -bottom-1.5 -right-1.5 bg-[#0A3D91] text-white w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                <span className="font-black text-[9px]">{match.compatibility}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-[#0F172A] leading-tight mb-0.5 truncate uppercase">{match.name}</h3>
              <span className="text-[#0A3D91] text-[7px] font-black uppercase tracking-widest mb-1.5 block">{match.travelStyle}</span>
              <div className="flex flex-wrap gap-1">
                {match.interests.slice(0, 2).map((it, i) => (
                  <span key={i} className="bg-gray-50 text-gray-400 text-[6px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">{it}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <M3Button
          fullWidth
          className="!h-14 shadow-xl shadow-blue-900/10"
          onClick={onJoin}
        >
          EXPLORE TRAVEL TRIBE
        </M3Button>
      </div>
    </div>
  );
};

const VibeCheckScreen: React.FC<VibeCheckScreenProps> = ({ onBack, onJoin, destination = 'Rishikesh' }) => {
  const [viewState, setViewState] = useState<VibeState>('INTERESTS');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [matches, setMatches] = useState<Match[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerateQuiz = async () => {
    if (selectedInterests.length < 3) return;
    setViewState('LOADING_QUIZ');
    try {
      const questions = await generateRishikeshQuiz(selectedInterests);
      if (!questions || questions.length === 0) {
        throw new Error('No questions received from RAG service');
      }
      setQuestions(questions);
      setViewState('QUIZ');
    } catch (error) {
     console.error('RAG Quiz Error:', error);
      setQuestions([
        { id: 'f1', text: 'How do you prefer to start your morning in the region?', options: ['Sunrise Yoga by the water', 'Espresso at a local Cafe', 'A silent nature trek', 'A quiet local market walk'] },
        { id: 'f2', text: 'Which element of the trip resonates most with you?', options: ['The rush of adventure', 'The silence of peace', 'The rhythm of culture', 'The energy of the community'] },
        { id: 'f3', text: 'What is your ideal evening ritual?', options: ['Witnessing a local ceremony', 'Live music at a rooftop cafe', 'Sunset hike to a viewpoint', 'Quiet stargazing'] }
      ]);
      setViewState('QUIZ');
    }
  };

  const handleSelectAnswer = (qIdx: number, oIdx: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
    if (qIdx < questions.length - 1) {
      setTimeout(() => setCurrentQuizIdx(qIdx + 1), 400);
    }
  };

  const handleSubmitQuiz = async () => {
    setViewState('LOADING_MATCH');
    try {
      const resultMatches = await matchTravelers(selectedInterests, answers, questions);
      setMatches(resultMatches);
      setTimeout(() => setViewState('RESULTS'), 1500);
    } catch (error) {
      console.error('Match Error:', error);
      setViewState('INTERESTS');
    }
  };

  const InterestsView = () => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 text-center px-4">
        <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Personalize</h2>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Select 3 facets to find your tribe</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 flex-1 content-start overflow-y-auto no-scrollbar pb-4 px-2">
        {RISHIKESH_INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] border transition-all duration-300 aspect-square ${
                isSelected
                  ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-lg shadow-blue-900/10 scale-[1.02]'
                  : 'bg-white border-gray-100 text-gray-400 hover:border-[#0A3D91]/20 hover:bg-blue-50/10'
              }`}
            >
              <span className="text-2xl mb-1.5">{interest.icon}</span>
              <span className="font-black text-[8px] uppercase tracking-widest text-center leading-tight">{interest.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 pb-8 px-4">
        <M3Button
          fullWidth
          disabled={selectedInterests.length < 3}
          className="!h-14 shadow-xl"
          onClick={handleGenerateQuiz}
        >
          GENERATE MY QUIZ
        </M3Button>
      </div>
    </div>
  );

  const LoadingView = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500 text-center px-10">
      <div className="relative size-24 mb-8">
        <div className="absolute inset-0 rounded-full border-[6px] border-[#0A3D91]/5 shadow-inner"></div>
        <div className="absolute inset-0 rounded-full border-[6px] border-[#0A3D91] border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-3xl animate-pulse">✨</span>
        </div>
      </div>
      <h2 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase italic mb-2 leading-none">{title}</h2>
      <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed max-w-[180px] mx-auto">{subtitle}</p>
    </div>
  );

  const QuizView = () => {
    const q = questions[currentQuizIdx];
    if (!q) return null;
    const progress = ((currentQuizIdx + 1) / questions.length) * 100;
    const isLast = currentQuizIdx === questions.length - 1;
    const hasAnswered = answers[currentQuizIdx] !== undefined;

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 px-4">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-end justify-between px-1">
            <p className="text-[#0A3D91] text-[8px] font-black uppercase tracking-[0.2em]">Phase {currentQuizIdx + 1}/{questions.length}</p>
            <p className="text-[#0F172A] text-[8px] font-black uppercase">{Math.round(progress)}%</p>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#0A3D91] transition-all duration-700 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <h2 className="text-xl font-black text-[#0F172A] mb-8 tracking-tighter leading-tight uppercase italic">
          {q.text}
        </h2>

        <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
          {q.options.map((opt, oIdx) => {
            const isSelected = answers[currentQuizIdx] === oIdx;
            return (
              <button
                key={oIdx}
                onClick={() => handleSelectAnswer(currentQuizIdx, oIdx)}
                className={`w-full text-left p-4 rounded-[1.25rem] border transition-all flex items-center gap-4 active:scale-[0.99] ${
                  isSelected 
                    ? 'bg-blue-50 border-[#0A3D91] text-[#0A3D91] shadow-lg shadow-blue-900/5' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-[#0A3D91]/20 shadow-sm'
                }`}
              >
                <div className={`size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  isSelected ? 'bg-[#0A3D91] text-white shadow-lg' : 'bg-gray-50 text-gray-300'
                }`}>
                  {String.fromCharCode(65 + oIdx)}
                </div>
                <span className="font-bold text-xs leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-6 pb-8 flex gap-3">
          {currentQuizIdx > 0 && (
            <button 
              onClick={() => setCurrentQuizIdx(prev => prev - 1)}
              className="px-6 rounded-full border border-gray-100 text-gray-400 font-black text-[9px] active:bg-gray-50 transition-all uppercase tracking-[0.2em]"
            >
              Prev
            </button>
          )}
          {isLast ? (
            <M3Button 
              className="flex-1 !h-14 shadow-xl"
              disabled={!hasAnswered}
              onClick={handleSubmitQuiz}
            >
              ANALYZE RESONANCE
            </M3Button>
          ) : (
             <div className="flex-1 flex items-center justify-center py-4">
                <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Pick an option to advance</p>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#F8FAFF] flex flex-col page-transition overflow-hidden">
      <header className="h-16 shrink-0 flex items-center px-6 justify-between bg-white border-b border-gray-50 shadow-sm relative z-50">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-[#0A3D91] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="text-center">
            <h1 className="text-[9px] font-black uppercase tracking-tighter">AI Vibe Alignment</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
               <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
               <p className="text-[6px] font-black text-blue-600 uppercase tracking-widest">Neural Matching</p>
            </div>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-5 overflow-hidden relative z-10">
        {viewState === 'INTERESTS' && <InterestsView />}
        {viewState === 'LOADING_QUIZ' && <LoadingView title="Crafting" subtitle="RAG engine generating unique questions from facets" />}
        {viewState === 'QUIZ' && <QuizView />}
        {viewState === 'LOADING_MATCH' && <LoadingView title="Resonating" subtitle="Calculating compatibility scores with tribe members" />}
        {viewState === 'RESULTS' && <ResultsView matches={matches} onReset={() => setViewState('INTERESTS')} onJoin={onJoin} />}
      </main>

      <div className="absolute -bottom-24 -left-24 size-48 bg-blue-100 rounded-full blur-[80px] opacity-20 pointer-events-none" />
      <div className="absolute -top-24 -right-24 size-48 bg-blue-100 rounded-full blur-[80px] opacity-20 pointer-events-none" />
    </div>
  );
};

export default VibeCheckScreen;