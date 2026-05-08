import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Crown, User } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/BottomNav';

type Tab = 'global' | 'friends';

const MOCK_TOP_3 = [
  { rank: 1, name: '주식천재', streak: 89, isMe: false },
  { rank: 2, name: '강남불개미', streak: 67, isMe: false },
  { rank: 3, name: '코스피마스터', streak: 45, isMe: false },
];

const MOCK_LIST = [
  { rank: 4, name: '여의도고래', streak: 42, isMe: false },
  { rank: 5, name: '스나이퍼', streak: 38, isMe: false },
  { rank: 6, name: '단타의신', streak: 35, isMe: false },
  { rank: 7, name: '존버가답이다', streak: 31, isMe: false },
  { rank: 8, name: '수익률1000', streak: 29, isMe: false },
  { rank: 9, name: '상한가요정', streak: 25, isMe: false },
  { rank: 10, name: '워렌버핏동생', streak: 22, isMe: false },
  { rank: 11, name: '하따전문가', streak: 20, isMe: false },
  { rank: 12, name: '손절은없다', streak: 18, isMe: false },
  { rank: 13, name: '파란불사냥꾼', streak: 15, isMe: false },
  { rank: 14, name: '슈퍼개미', streak: 14, isMe: false },
  { rank: 15, name: '떡상가즈아', streak: 12, isMe: false },
];

export function Ranking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('global');

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center px-4 bg-white shrink-0 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#0F172A] hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight ml-2">랭킹</h1>
        </header>

        {/* Tabs */}
        <div className="h-[48px] flex border-b border-[#E2E8F0] shrink-0 bg-white z-20">
          <button 
            onClick={() => setActiveTab('global')}
            className={`flex-1 relative flex items-center justify-center text-[15px] font-semibold transition-colors ${activeTab === 'global' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}
          >
            전체 랭킹
            {activeTab === 'global' && (
              <motion.div layoutId="ranking-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 relative flex items-center justify-center text-[15px] font-semibold transition-colors ${activeTab === 'friends' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}
          >
            친구 랭킹
            {activeTab === 'friends' && (
              <motion.div layoutId="ranking-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB]" />
            )}
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar relative">
          
          {/* Sticky My Rank */}
          <div className="sticky top-0 z-10 bg-[#DBEAFE] px-5 py-3.5 flex items-center justify-between border-b border-[#BFDBFE] shadow-[0_2px_10px_rgba(37,99,235,0.05)]">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-[#0F172A] text-[15px]">나</span>
              <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
              <span className="font-semibold text-[#0F172A] text-[15px]">사용자닉네임</span>
              <span className="w-1 h-1 rounded-full bg-[#94A3B8]" />
              <span className="font-bold text-[#2563EB] text-[15px] font-['DM_Mono'] tracking-tight">7연승</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F172A] text-[16px] font-['DM_Mono'] tracking-tight">243등</span>
              <div className="flex items-center text-[#00C896]">
                <TrendingUp size={16} strokeWidth={2.5} />
                <span className="text-[12px] font-['DM_Mono'] font-bold ml-0.5">12</span>
              </div>
            </div>
          </div>

          {/* Top 3 Section */}
          <div className="flex flex-col">
            {/* 1st Place */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] text-[#2563EB]">
                <Crown size={120} />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <span className="font-['DM_Mono'] text-[28px] font-extrabold w-8 text-center text-[#2563EB]">1</span>
                <div className="w-12 h-12 rounded-full bg-[#FEF08A] flex items-center justify-center border-2 border-[#FDE047] shadow-sm">
                  <Crown size={24} className="text-[#CA8A04] fill-[#CA8A04]" />
                </div>
                <span className="font-bold text-[#0F172A] text-[18px]">주식천재</span>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="font-['DM_Mono'] text-[#00C896] text-[36px] font-extrabold tracking-tighter leading-none">{MOCK_TOP_3[0].streak}</span>
                <span className="text-[14px] font-semibold text-[#0F172A]">연승</span>
              </div>
            </div>

            {/* 2nd Place */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-['DM_Mono'] text-[22px] font-bold w-8 text-center text-[#64748B]">2</span>
                <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                  <User size={20} className="text-[#64748B]" />
                </div>
                <span className="font-bold text-[#0F172A] text-[16px]">강남불개미</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-['DM_Mono'] text-[#0F172A] text-[28px] font-bold tracking-tighter leading-none">{MOCK_TOP_3[1].streak}</span>
                <span className="text-[13px] font-medium text-[#64748B]">연승</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-[#FFFFFF] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-['DM_Mono'] text-[20px] font-bold w-8 text-center text-[#94A3B8]">3</span>
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <User size={20} className="text-[#94A3B8]" />
                </div>
                <span className="font-semibold text-[#0F172A] text-[16px]">코스피마스터</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-['DM_Mono'] text-[#0F172A] text-[24px] font-bold tracking-tighter leading-none">{MOCK_TOP_3[2].streak}</span>
                <span className="text-[13px] font-medium text-[#64748B]">연승</span>
              </div>
            </div>
          </div>

          {/* List Section (4th ~) */}
          <div className="flex flex-col">
            {MOCK_LIST.map((user) => (
              <div key={user.rank} className="border-b border-[#E2E8F0] py-4 px-5 flex items-center justify-between bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-['DM_Mono'] text-[#64748B] text-[15px] font-semibold w-8 text-center">{user.rank}</span>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={18} className="text-[#94A3B8]" />
                  </div>
                  <span className="font-medium text-[#0F172A] text-[15px]">{user.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-['DM_Mono'] font-semibold text-[#0F172A] text-[18px] tracking-tight">{user.streak}</span>
                    <span className="font-sans font-medium text-[#64748B] text-[12px]">연승</span>
                  </div>
                  <ChevronRight size={18} className="text-[#CBD5E1]" />
                </div>
              </div>
            ))}
            
            {/* My Rank inserted in list representation */}
            <div className="border-b border-[#E2E8F0] py-4 px-5 flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-4">
                  <span className="font-['DM_Mono'] text-[#2563EB] text-[15px] font-bold w-8 text-center">243</span>
                  <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                    <User size={18} className="text-[#2563EB]" />
                  </div>
                  <span className="font-bold text-[#0F172A] text-[15px]">사용자닉네임</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-['DM_Mono'] font-bold text-[#2563EB] text-[18px] tracking-tight">7</span>
                    <span className="font-sans font-medium text-[#64748B] text-[12px]">연승</span>
                  </div>
                  <ChevronRight size={18} className="text-[#2563EB]" />
                </div>
              </div>

             {/* Bottom Info */}
             <div className="py-10 flex justify-center pb-safe">
               <span className="text-[13px] text-[#64748B] bg-slate-100 px-4 py-1.5 rounded-full font-medium">매일 15:35 업데이트</span>
             </div>
          </div>

        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}