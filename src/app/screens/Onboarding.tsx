import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Play, Target, Coins, Unlock, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/login');
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -100 && currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else if (swipe > 100 && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-slate-200">
        
        {/* Swiper Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={1} mode="wait">
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-10 pb-32"
            >
              {currentSlide === 0 && <Slide1 />}
              {currentSlide === 1 && <Slide2 />}
              {currentSlide === 2 && <Slide3 />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20 bg-gradient-to-t from-white via-white/90 to-transparent pt-12">
          {/* Indicators */}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>

          {/* Next / Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleNext}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm
              ${currentSlide === 2 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
          >
            {currentSlide === 2 ? '시작하기' : '다음'}
            {currentSlide !== 2 && <ChevronRight size={20} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Slide1() {
  return (
    <div className="flex flex-col items-center text-center w-full relative h-full justify-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
        className="font-['DM_Mono'] text-[160px] font-bold leading-none tracking-tighter text-blue-600 mb-6"
      >
        10
      </motion.div>
      <motion.h2 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-slate-900 mb-4"
      >
        10일 연속 예측 성공
      </motion.h2>
      <motion.p 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-slate-500 text-lg"
      >
        매일 상승/하락을 맞히세요
      </motion.p>
    </div>
  );
}

function Slide2() {
  return (
    <div className="flex flex-col items-center text-center w-full h-full justify-center">
      <div className="flex items-center gap-3 mb-12 relative">
        <motion.div 
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-sm"
        >
          <Play className="text-slate-400" size={24} fill="currentColor" />
        </motion.div>
        
        <div className="w-6 h-[2px] bg-slate-200" />

        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center z-10"
        >
          <Target className="text-blue-600" size={30} strokeWidth={2.5} />
        </motion.div>

        <div className="w-6 h-[2px] bg-slate-200" />

        <motion.div 
          initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shadow-sm"
        >
          <Coins className="text-green-600" size={24} />
        </motion.div>
      </div>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium mb-6 shadow-sm">
          <Unlock size={16} /> 리스크 0%
        </div>
      </motion.div>

      <motion.h2 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
        className="text-2xl font-bold text-slate-900 mb-4 leading-snug"
      >
        광고 시청 <span className="text-slate-300 mx-1">→</span> 예측 <span className="text-slate-300 mx-1">→</span> <span className="text-blue-600">40만원</span>
      </motion.h2>
      <motion.p 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
        className="text-slate-500 text-lg leading-relaxed"
      >
        잃을 게 없어요.<br />광고 15초만 보면 참여 가능
      </motion.p>
    </div>
  );
}

function Slide3() {
  return (
    <div className="flex flex-col items-center text-center w-full h-full justify-center">
      
      <div className="w-full max-w-[280px] grid grid-cols-2 gap-4 mb-14">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
          className="aspect-square rounded-3xl bg-green-50 border border-green-200 flex flex-col items-center justify-center gap-3 relative overflow-hidden shadow-sm"
        >
          <TrendingUp className="text-green-600" size={40} />
          <span className="text-green-700 font-bold text-lg">상승</span>
        </motion.div>

        <motion.div 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="aspect-square rounded-3xl bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-3 relative overflow-hidden shadow-sm"
        >
          <TrendingDown className="text-red-600" size={40} />
          <span className="text-red-700 font-bold text-lg">하락</span>
        </motion.div>
      </div>

      <motion.h2 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-slate-900 mb-4"
      >
        오늘 종가, 오를까요 내릴까요?
      </motion.h2>
      <motion.p 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-slate-500 text-base leading-relaxed"
      >
        매일 저녁 6시부터<br />다음날 오전 9시까지
      </motion.p>
    </div>
  );
}