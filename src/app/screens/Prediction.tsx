import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft, TrendingUp, TrendingDown, Check, CheckCircle2 } from 'lucide-react';

interface LocationState {
  ticker: string;
  stockName: string;
  currentPrice: number;
  changeRate: number;
}

export function Prediction() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // 종목 정보가 없으면 종목 검색 화면으로 리다이렉트
  useEffect(() => {
    if (!state || !state.ticker) {
      navigate('/stock-search', { replace: true });
    }
  }, [state, navigate]);

  const [timeLeft, setTimeLeft] = useState('02:14:49');
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);
  const [showToast, setShowToast] = useState(false);

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

  // Selection handler
  const handleSelect = (type: 'up' | 'down') => {
    if (selected) return; // Prevent double click
    
    setSelected(type);
    setShowToast(true);
    
    // Navigate home after 2 seconds
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <div className="h-[56px] flex items-center justify-between px-4 bg-[#FFFFFF] border-b border-[#E2E8F0] shrink-0 relative z-20">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={28} />
          </button>
          <h1 className="font-semibold text-[18px] text-[#0F172A] tracking-tight">오늘의 예측</h1>
          <div className="font-['DM_Mono'] text-[14px] font-semibold text-[#2563EB] w-[72px] text-right">
            {timeLeft}
          </div>
        </div>

        {/* Toast Notification (Top) */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-[72px] left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-6 py-3 rounded-full shadow-[0_8px_16px_rgba(15,23,42,0.15)] font-medium text-[14px] flex items-center gap-2 z-50 whitespace-nowrap"
            >
              <CheckCircle2 size={18} className="text-[#00C896]" />
              예측 완료
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 flex flex-col pt-4 pb-8 relative z-10">
          
          {/* Stock Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-[24px] mx-4"
          >
            {/* Title & Code */}
            <div className="flex items-end gap-2">
              <h2 className="text-[20px] font-semibold text-[#0F172A] leading-none tracking-tight">
                {state?.stockName || '삼성전자'}
              </h2>
              <span className="text-[12px] text-[#64748B] leading-none mb-[2px]">
                {state?.ticker || '005930'}
              </span>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[#CBD5E1] w-full my-[12px]" />

            {/* Price Info */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[24px] font-bold font-['DM_Mono'] text-[#0F172A] leading-none tracking-tight mb-2">
                  {state?.currentPrice ? `${state.currentPrice.toLocaleString()}원` : '74,500원'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#64748B]">전일 대비</span>
                  <span
                    className="text-[16px] font-bold font-['DM_Mono'] leading-none"
                    style={{ color: (state?.changeRate ?? 0) >= 0 ? '#00C896' : '#FF4D6A' }}
                  >
                    {state?.changeRate !== undefined
                      ? `${state.changeRate >= 0 ? '+' : ''}${state.changeRate.toFixed(2)}%`
                      : '+1.2%'
                    }
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-end h-full">
                <span className="text-[12px] text-[#64748B] mt-[10px]">거래량 12,453,200</span>
              </div>
            </div>

            {/* Bottom Guide Text */}
            <div className="mt-5 text-[11px] text-[#64748B] text-center font-normal">
              기준: 전날 종가 대비 오늘 종가
            </div>
          </motion.div>

          <div className="flex-1" />

          {/* Prediction Actions */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex gap-[12px] px-4 h-[140px]"
          >
            {/* UP Button */}
            <motion.button
              whileTap={!selected ? { scale: 0.98 } : {}}
              onClick={() => handleSelect('up')}
              disabled={selected !== null}
              className={`flex-1 rounded-[16px] flex flex-col items-center justify-center gap-2 transition-all duration-200 ease-in-out relative
                ${selected === 'up' ? 'bg-[#00C896]/20 border-[3px] border-[#00C896]' : 
                  selected === 'down' ? 'bg-[#00C896]/10 border-2 border-[#00C896] opacity-50' : 
                  'bg-[#00C896]/10 hover:bg-[#00C896]/15 border-2 border-[#00C896]'}`}
            >
              {selected === 'up' && (
                <div className="absolute top-3 right-3 w-[20px] h-[20px] bg-[#00C896] rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
              
              <TrendingUp size={32} className="text-[#00C896]" strokeWidth={2.5} />
              
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-semibold text-[#00C896] tracking-tight">상승</span>
                <span className="text-[12px] font-['Pretendard'] font-medium text-[#00C896] mt-0.5">▲ UP</span>
              </div>
            </motion.button>

            {/* DOWN Button */}
            <motion.button
              whileTap={!selected ? { scale: 0.98 } : {}}
              onClick={() => handleSelect('down')}
              disabled={selected !== null}
              className={`flex-1 rounded-[16px] flex flex-col items-center justify-center gap-2 transition-all duration-200 ease-in-out relative
                ${selected === 'down' ? 'bg-[#FF4D6A]/20 border-[3px] border-[#FF4D6A]' : 
                  selected === 'up' ? 'bg-[#FF4D6A]/10 border-2 border-[#FF4D6A] opacity-50' : 
                  'bg-[#FF4D6A]/10 hover:bg-[#FF4D6A]/15 border-2 border-[#FF4D6A]'}`}
            >
              {selected === 'down' && (
                <div className="absolute top-3 right-3 w-[20px] h-[20px] bg-[#FF4D6A] rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}

              <TrendingDown size={32} className="text-[#FF4D6A]" strokeWidth={2.5} />
              
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-semibold text-[#FF4D6A] tracking-tight">하락</span>
                <span className="text-[12px] font-['Pretendard'] font-medium text-[#FF4D6A] mt-0.5">▼ DOWN</span>
              </div>
            </motion.button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}