import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  Gift, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Home, 
  Trophy, 
  Target, 
  History, 
  User,
  Flame
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

export function MyPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center justify-between px-4 bg-white border-b border-[#E2E8F0] shrink-0 z-20">
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
          <div className="w-7 h-7" /> {/* Spacer for alignment */}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
          
          {/* Profile Card Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mt-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 flex flex-col items-center"
          >
            {/* Profile Image */}
            <div className="w-[80px] h-[80px] rounded-full bg-[#2563EB] border-2 border-[#DBEAFE] flex items-center justify-center shadow-sm">
              <User size={40} className="text-white" />
            </div>
            
            {/* User Info */}
            <h2 className="mt-3 text-[18px] font-semibold text-[#0F172A]">주식고수123</h2>
            <p className="mt-1 text-[12px] text-[#64748B]">가입 일자: 2025-12-15</p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#CBD5E1] my-4" />

            {/* Stats Row */}
            <div className="w-full flex justify-between items-center px-2">
              <div className="flex flex-col items-center flex-1">
                <span className="font-['DM_Mono'] text-[28px] font-semibold text-[#2563EB] leading-none mb-1">7</span>
                <span className="text-[12px] text-[#64748B]">현재 연승</span>
              </div>
              <div className="w-[1px] h-8 bg-[#E2E8F0]" />
              <div className="flex flex-col items-center flex-1">
                <span className="font-['DM_Mono'] text-[28px] font-semibold text-[#00C896] leading-none mb-1">42</span>
                <span className="text-[12px] text-[#64748B]">최고 연승</span>
              </div>
              <div className="w-[1px] h-8 bg-[#E2E8F0]" />
              <div className="flex flex-col items-center flex-1">
                <span className="font-['DM_Mono'] text-[28px] font-semibold text-[#F59E0B] leading-none mb-1">72%</span>
                <span className="text-[12px] text-[#64748B]">정확도</span>
              </div>
            </div>
          </motion.div>

          {/* Statistics Component Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="mx-4 mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-5"
          >
            <h3 className="text-[16px] font-semibold text-[#0F172A] mb-3">나의 예측 통계</h3>
            
            <div className="flex items-center justify-between h-[44px] border-b border-[#CBD5E1]">
              <span className="text-[13px] text-[#64748B]">총 예측 횟수</span>
              <span className="font-['DM_Mono'] text-[16px] font-semibold text-[#0F172A]">127회</span>
            </div>
            
            <div className="flex items-center justify-between h-[44px]">
              <span className="text-[13px] text-[#64748B]">맞춘 횟수</span>
              <span className="font-['DM_Mono'] text-[16px] font-semibold text-[#00C896]">91회</span>
            </div>
          </motion.div>

          {/* Menu Section */}
          <div className="mx-4 mt-6 flex flex-col gap-2 mb-6">
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/reward')}
              className="w-full h-[56px] bg-[#DBEAFE] hover:bg-[#E8F3FF] rounded-[12px] px-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Gift size={24} className="text-[#2563EB]" />
                <span className="text-[14px] font-medium text-[#0F172A]">보상신청 바로가기</span>
              </div>
              <ChevronRight size={16} className="text-[#2563EB]" />
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/notifications')}
              className="w-full h-[56px] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-[12px] px-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell size={24} className="text-[#64748B]" />
                <span className="text-[14px] font-medium text-[#0F172A]">알림설정</span>
              </div>
              <ChevronRight size={16} className="text-[#64748B]" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/settings')}
              className="w-full h-[56px] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-[12px] px-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-[#64748B]" />
                <span className="text-[14px] font-medium text-[#0F172A]">앱 설정</span>
              </div>
              <ChevronRight size={16} className="text-[#64748B]" />
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full h-[56px] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#FEF2F2] rounded-[12px] px-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut size={24} className="text-[#EF4444]" />
                <span className="text-[14px] font-medium text-[#EF4444]">로그아웃</span>
              </div>
              <ChevronRight size={16} className="text-[#EF4444]" />
            </motion.button>

          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

      </div>
    </div>
  );
}