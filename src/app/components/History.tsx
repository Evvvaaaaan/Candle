import { motion } from 'motion/react';

export function History({ streak = 7 }: { streak?: number }) {
  const history = Array(10).fill(null).map((_, i) => {
    if (i < streak) return 'O';
    return null;
  });

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="px-6 w-full mb-10 relative z-10"
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-slate-900 font-semibold text-sm font-['Pretendard']">최근 10일 기록</h3>
        <span className="text-slate-400 text-xs font-['DM_Mono'] font-medium tracking-wider">WIN RATE 70%</span>
      </div>
      
      <div className="flex justify-between items-center w-full">
        {history.map((status, index) => {
          const isToday = index === streak;
          
          return (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <div 
                className={`
                  w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold font-['DM_Mono']
                  transition-all duration-300 shadow-sm
                  ${status === 'O' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                  ${status === 'X' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                  ${status === null && !isToday ? 'bg-slate-50 border border-slate-200 text-transparent' : ''}
                  ${status === null && isToday ? 'bg-white border-2 border-blue-400 border-dashed text-transparent' : ''}
                `}
              >
                {status || '-'}
              </div>
              <div className="h-1 flex items-center justify-center">
                {isToday && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full" 
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}