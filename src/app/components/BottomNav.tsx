import { useNavigate, useLocation } from 'react-router';
import { Home as HomeIcon, Trophy, Newspaper, User } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => path === route || path.startsWith(route + '/');

  return (
    <nav className="h-[60px] bg-white border-t border-[#E2E8F0] flex justify-between items-end px-2 pb-2 shrink-0 relative z-30 pb-safe">
      {/* Home */}
      <button 
        onClick={() => navigate('/home')} 
        className={`flex-1 flex flex-col items-center gap-1 transition-colors ${isActive('/home') ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
      >
        <HomeIcon size={24} />
        <span className={`text-[11px] tracking-tight ${isActive('/home') ? 'font-bold' : 'font-medium'}`}>홈</span>
      </button>

      {/* Ranking */}
      <button 
        onClick={() => navigate('/ranking')} 
        className={`flex-1 flex flex-col items-center gap-1 transition-colors ${isActive('/ranking') ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
      >
        <Trophy size={24} />
        <span className={`text-[11px] tracking-tight ${isActive('/ranking') ? 'font-bold' : 'font-medium'}`}>랭킹</span>
      </button>
      
      {/* Center FAB - Prediction */}
      <div className="flex-1 flex justify-center relative h-full">
        <button 
          onClick={() => navigate('/prediction')}
          className="absolute bottom-2 w-[56px] h-[56px] bg-[#2563EB] rounded-full flex flex-col items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:bg-[#1D4ED8] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[2px]">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="text-[11px] font-semibold leading-none tracking-tight">예측</span>
        </button>
      </div>

      {/* News */}
      <button 
        onClick={() => navigate('/news')}
        className={`flex-1 flex flex-col items-center gap-1 transition-colors ${isActive('/news') ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
      >
        <Newspaper size={24} />
        <span className={`text-[11px] tracking-tight ${isActive('/news') ? 'font-bold' : 'font-medium'}`}>뉴스</span>
      </button>

      {/* My Page */}
      <button 
        onClick={() => navigate('/mypage')} 
        className={`flex-1 flex flex-col items-center gap-1 transition-colors ${isActive('/mypage') ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
      >
        <User size={24} />
        <span className={`text-[11px] tracking-tight ${isActive('/mypage') ? 'font-bold' : 'font-medium'}`}>마이</span>
      </button>
    </nav>
  );
}