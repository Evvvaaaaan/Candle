import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { useState, useEffect } from 'react';

export function StatusCard() {
  const [timeLeft, setTimeLeft] = useState('02:14:59');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let [h, m, s] = prev.split(':').map(Number);
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
          }
        }
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="px-5 w-full mb-8 relative z-10"
    >
      <div className="bg-slate-50 rounded-[20px] p-6 relative z-10 flex flex-col items-center text-center shadow-sm border border-slate-200">
        <div className="text-slate-900 font-semibold mb-1 font-['Pretendard']">오늘의 예측 미완료</div>
        <div className="text-slate-500 text-sm mb-6 flex items-center justify-center gap-1.5 font-['Pretendard']">
          마감까지 <span className="font-['DM_Mono'] text-blue-600 font-semibold tracking-wider">{timeLeft}</span>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-sm font-['Pretendard'] hover:bg-blue-700 transition-colors"
        >
          <Play fill="currentColor" size={20} />
          광고 보고 예측하기
        </motion.button>
      </div>
    </motion.div>
  );
}