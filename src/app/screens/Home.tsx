import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { UserCircle, Bell, Home as HomeIcon, Trophy, Calendar, User } from 'lucide-react';
import { StreakVisualization, HistoryDay } from '../components/StreakVisualization';

import { BottomNav } from '../components/BottomNav';

export function Home() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const targetStreak = 7;
  const [timeLeft, setTimeLeft] = useState('02:14:49');

  // Countdown timer mockup
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

  // Countup animation
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current <= targetStreak) {
        setStreak(current);
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [targetStreak]);

  // History data matching the new component
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 7);
  
  const historyData: HistoryDay[] = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    let state: 'success' | 'fail' | 'pending' | 'future' = 'future';
    if (i < 7) state = 'success';
    else if (i === 7) state = 'pending';
    
    return { date: dateStr, state };
  });

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-[#0F172A] md:shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center justify-between px-4 bg-white border-b border-[#E2E8F0] shrink-0 z-20 relative">
          <div className="flex items-center">
            {/* Candle Logo (28x28) */}
            <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="26" y="16" width="8" height="28" rx="2" fill="#2563EB" />
              <line x1="30" y1="8" x2="30" y2="16" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="44" x2="30" y2="52" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
              <rect x="12" y="28" width="8" height="16" rx="2" fill="#2563EB" opacity="0.6" />
              <line x1="16" y1="22" x2="16" y2="28" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="16" y1="44" x2="16" y2="48" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <rect x="40" y="20" width="8" height="20" rx="2" fill="#2563EB" opacity="0.8" />
              <line x1="44" y1="12" x2="44" y2="20" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="44" y1="40" x2="44" y2="46" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </svg>
            <span className="font-semibold text-[18px] text-[#0F172A] ml-2 tracking-tight">Candle</span>
          </div>
          <div className="flex items-center gap-3 text-[#64748B]">
            <div className="relative">
              <Bell size={28} strokeWidth={1.5} />
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white relative z-10 pb-10">
          
          <div className="pt-10">
            <StreakVisualization streak={streak} history={historyData} numberSize="large" />
          </div>

          {/* Today's Prediction Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-4 mt-2 bg-[#F8FAFC] rounded-[16px] p-5 flex flex-col items-center relative mb-6"
          >
            {/* Dashed animated border */}
            <div className="absolute inset-0 border-2 border-dashed border-[#2563EB] rounded-[16px] animate-[pulse_2s_ease-in-out_infinite] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center w-full">
              <h3 className="text-[16px] font-semibold text-[#0F172A] tracking-tight">오늘의 예측 미완료</h3>
              
              <div className="mt-4 flex flex-col items-center">
                <span className="text-[12px] text-[#64748B] mb-1">마감까지</span>
                <span className="font-['DM_Mono'] text-[24px] font-semibold text-[#2563EB]">{timeLeft}</span>
              </div>
              
              <button 
                onClick={() => navigate('/ad-watch')}
                className="mt-5 w-full h-[56px] bg-[#2563EB] text-white rounded-[12px] font-semibold text-[16px] transition-colors relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[#1D4ED8] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="relative z-10 tracking-tight">광고 보고 예측하기</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}