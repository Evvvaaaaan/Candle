import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Star } from 'lucide-react';

export type DayState = 'success' | 'fail' | 'pending' | 'future';

export interface HistoryDay {
  date: string;
  state: DayState;
}

export interface StreakVisualizationProps {
  streak: number;
  history: HistoryDay[];
  numberSize?: 'large' | 'normal';
}

export function StreakVisualization({ 
  streak, 
  history, 
  numberSize = 'large' 
}: StreakVisualizationProps) {
  const [displayStreak, setDisplayStreak] = useState(0);

  // Count-up animation for the streak number
  useEffect(() => {
    let start = displayStreak;
    const end = streak;
    if (start === end) return;
    
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      setDisplayStreak(Math.round(start + (end - start) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [streak]);

  // Determine styles based on streak level
  const getStreakStyles = (s: number) => {
    if (s >= 10) {
      return {
        textClass: 'text-transparent bg-clip-text bg-gradient-to-r from-[#22C55E] via-[#00C896] to-[#22C55E]',
        containerClass: 'relative',
        glow: 'drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]'
      };
    }
    if (s === 9) {
      return {
        textClass: 'text-[#2563EB]',
        containerClass: 'relative',
        glow: 'drop-shadow-[0_0_24px_rgba(37,99,235,0.6)]'
      };
    }
    if (s >= 6) {
      return {
        textClass: 'text-[#2563EB]',
        containerClass: '',
        glow: 'drop-shadow-[0_0_12px_rgba(37,99,235,0.4)]'
      };
    }
    if (s >= 3) {
      return {
        textClass: 'text-[#2563EB]',
        containerClass: '',
        glow: ''
      };
    }
    return {
      textClass: 'text-[#0F172A]',
      containerClass: '',
      glow: ''
    };
  };

  const { textClass, containerClass, glow } = getStreakStyles(displayStreak);

  // Calculate Milestones
  const milestones = [3, 5, 7, 10];
  const nextMilestone = milestones.find(m => m > streak) || 10;
  const prevMilestone = [...milestones].reverse().find(m => m <= streak) || 0;
  
  // Progress calculation
  let progressPercent = 0;
  if (streak >= 10) {
    progressPercent = 100;
  } else {
    // Progress between prev and next milestone
    const range = nextMilestone - prevMilestone;
    const current = streak - prevMilestone;
    progressPercent = (current / range) * 100;
  }
  
  const daysUntilNext = nextMilestone - streak;

  return (
    <div className="flex flex-col items-center w-full bg-white">
      {/* 1. Main Streak Number */}
      <div className={`flex flex-col items-center mb-10 ${containerClass}`}>
        <motion.div 
          key={displayStreak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className={`font-['DM_Mono'] font-bold leading-none tracking-tighter ${glow} ${textClass} ${numberSize === 'large' ? 'text-[120px]' : 'text-[80px]'}`}
        >
          {displayStreak}
        </motion.div>
        <span className="text-[16px] font-medium text-[#64748B] mt-2">연속 예측 성공</span>
        
        {/* Particles Effect for high streaks */}
        {displayStreak === 9 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute -inset-[50%] border-[2px] border-dashed border-[#2563EB]/20 rounded-full" />
          </div>
        )}
      </div>

      {/* 4. Progress Bar & Milestones Summary */}
      <div className="w-full px-6 mb-10 max-w-[343px]">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[13px] font-semibold text-[#0F172A]">
            {streak >= 10 ? '🎉 10연승 달성!' : `다음 마일스톤까지 ${daysUntilNext}일`}
          </span>
          <div className="flex gap-1">
            {milestones.map(m => (
              <div key={m} className="flex flex-col items-center">
                <Star 
                  size={14} 
                  fill={streak >= m ? '#2563EB' : 'transparent'} 
                  stroke={streak >= m ? '#2563EB' : '#E2E8F0'} 
                  strokeWidth={2}
                />
                <span className="text-[9px] font-['DM_Mono'] text-[#64748B] font-bold mt-0.5">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-[8px] bg-[#E2E8F0] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#00C896] rounded-full"
          />
        </div>
      </div>

      {/* 2. Calendar View (10 days) */}
      <div className="w-full max-w-[100vw] overflow-x-auto hide-scrollbar px-4 pt-6 pb-4">
        <div className="flex relative" style={{ width: 'max-content' }}>
          
          {/* Connecting lines container */}
          <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] -translate-y-1/2 flex z-0">
            {history.map((day, i) => {
              if (i === history.length - 1) return null;
              const nextDay = history[i + 1];
              // Line is green if both current and next are success. Else it's light gray.
              const isConnected = day.state === 'success' && nextDay.state === 'success';
              return (
                <div 
                  key={`line-${i}`} 
                  className={`h-full transition-colors duration-500 ${isConnected ? 'bg-[#00C896]' : 'bg-transparent'}`}
                  style={{ width: '52px' }} // Distance between circle centers (36px circle + 16px gap)
                />
              );
            })}
          </div>

          {/* Circles */}
          {history.map((day, i) => {
            const isMilestone = milestones.includes(i + 1);
            
            return (
              <motion.div 
                key={i} 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                className="flex flex-col items-center shrink-0 w-[36px] mr-[16px] last:mr-0 relative z-10"
              >
                {/* Milestone indicator above circle */}
                {isMilestone && (
                  <div className="absolute -top-[18px] flex justify-center w-full">
                    <Star 
                      size={10} 
                      fill={day.state === 'success' ? '#2563EB' : 'transparent'} 
                      stroke={day.state === 'success' ? '#2563EB' : '#E2E8F0'} 
                      strokeWidth={2}
                    />
                  </div>
                )}

                <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${day.state === 'success' ? 'bg-[#00C896] border-[#00C896]' : 
                    day.state === 'fail' ? 'bg-[#FF4D6A] border-[#FF4D6A]' :
                    day.state === 'pending' ? 'bg-white border-[#2563EB] border-dashed animate-[pulse_2s_ease-in-out_infinite]' : 
                    'bg-white border-[#E2E8F0]'}
                `}>
                  {day.state === 'success' && <Check size={16} className="text-white" strokeWidth={3} />}
                  {day.state === 'fail' && <X size={16} className="text-white" strokeWidth={3} />}
                </div>
                
                <span className={`text-[11px] mt-2 font-medium font-['DM_Mono'] tracking-tighter
                  ${day.state === 'pending' ? 'text-[#2563EB]' : 'text-[#64748B]'}
                `}>
                  {day.state === 'pending' ? '오늘' : day.date}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
}