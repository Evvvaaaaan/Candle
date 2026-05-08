import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Lock, Unlock, Play, X, ChevronLeft } from 'lucide-react';

export function AdWatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'before' | 'watching' | 'success'>('before');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (step === 'watching') {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setStep('success');
      }
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (step === 'success') {
      const unlockTimer = setTimeout(() => setIsUnlocked(true), 300);
      const redirectTimer = setTimeout(() => navigate('/stock-search'), 1100);
      return () => {
        clearTimeout(unlockTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [step, navigate]);

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 15) * circumference;

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-slate-200">
        
        <AnimatePresence mode="wait">
          
          {/* 1. 광고 시청 전 화면 */}
          {step === 'before' && (
            <motion.div 
              key="before"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center px-5 py-4 relative z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center pt-8 px-6">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-sm"
                >
                  <Lock size={36} className="text-blue-600" />
                </motion.div>
                
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-2xl font-bold mb-3 text-center text-slate-900"
                >
                  예측에 참여하려면
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-slate-500 text-[15px] mb-8 text-center"
                >
                  15초 광고를 시청하면<br />오늘의 예측권이 생겨요
                </motion.p>

                {/* Ad Preview Box */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center mb-10 overflow-hidden relative shadow-sm"
                >
                  <Play size={32} className="text-slate-300 mb-3" />
                  <span className="text-slate-400 font-medium">광고 로딩 중</span>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-full mt-auto mb-12 flex flex-col items-center"
                >
                  <button 
                    onClick={() => setStep('watching')}
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-[16px] shadow-sm mb-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    광고 보고 예측하기 
                    <span className="font-bold">→</span>
                  </button>
                  <p className="text-xs text-slate-500">
                    오늘의 예측권 <span className="font-['DM_Mono'] text-blue-600 font-semibold ml-1">0/1</span>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 2. 광고 시청 중 화면 */}
          {step === 'watching' && (
            <motion.div 
              key="watching"
              initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col bg-slate-900"
            >
              {/* Dummy Ad Video Area */}
              <div className="absolute inset-0 bg-slate-800 overflow-hidden flex items-center justify-center">
                <div className="text-slate-600 font-bold text-3xl tracking-widest pointer-events-none select-none">
                  ADVERTISEMENT
                </div>
              </div>

              {/* Timer UI */}
              <div className="absolute top-12 right-6 flex items-center gap-3">
                <div className="bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white border border-slate-700">
                  리워드까지
                </div>
                <div className="relative w-10 h-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-md rounded-full border border-slate-700">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <motion.circle 
                      cx="20" cy="20" r={radius} fill="none" stroke="#2563EB" strokeWidth="3"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-['DM_Mono'] text-sm font-bold text-white z-10">{timeLeft}</span>
                </div>
              </div>

              {/* Unskippable indicator */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700">
                  <X size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">광고를 건너뛸 수 없습니다</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. 성공 화면 (예측권 획득) */}
          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-50"
            >
              <div className="relative flex flex-col items-center">
                
                {/* Lock Icon Wrapper */}
                <motion.div 
                  className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-sm"
                  animate={isUnlocked ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <AnimatePresence mode="wait">
                    {!isUnlocked ? (
                      <motion.div key="lock" exit={{ scale: 0, opacity: 0 }}>
                        <Lock size={40} className="text-blue-600" />
                      </motion.div>
                    ) : (
                      <motion.div key="unlock" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Unlock size={40} className="text-blue-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Popup Text */}
                <AnimatePresence>
                  {isUnlocked && (
                    <motion.h2 
                      initial={{ y: 10, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      className="text-2xl font-bold text-slate-900 tracking-wide"
                    >
                      예측권 획득!
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}} />
      </div>
    </div>
  );
}