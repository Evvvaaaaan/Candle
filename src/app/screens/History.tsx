import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

export function History() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center px-4 bg-white border-b border-[#E2E8F0] shrink-0 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#0F172A] hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight ml-2">예측 기록</h1>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center pb-20 bg-slate-50">
          <div className="w-16 h-16 rounded-full bg-[#E2E8F0] flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-2">기록이 아직 없습니다</h2>
          <p className="text-[13px] text-[#64748B]">오늘의 예측을 완료하고 기록을 쌓아보세요.</p>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}