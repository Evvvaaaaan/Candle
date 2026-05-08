import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function Hero({ streak = 7 }: { streak?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const interval = 30;
    const step = streak / (duration / interval);
    
    const timer = setInterval(() => {
      start += step;
      if (start >= streak) {
        setCount(streak);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [streak]);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[300px] z-0">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="font-['DM_Mono'] text-[140px] font-bold leading-none tracking-tighter text-blue-600 mb-2 drop-shadow-sm">
          {count}
        </div>
        <div className="text-xl font-semibold text-slate-900 tracking-wide mb-8 font-['Pretendard']">
          연속 예측 성공
        </div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm"
        >
          <span className="text-sm text-slate-600 font-['Pretendard']">
            10연승까지 <strong className="text-blue-600 font-['DM_Mono'] text-base ml-1">{10 - streak}일</strong> 남았어요!
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}