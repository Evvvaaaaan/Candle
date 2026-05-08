import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { ChevronLeft, HelpCircle, CheckCircle2, XCircle, Share2, Play, Trophy } from 'lucide-react';

type ViewState = 'locked' | 'revealing' | 'success' | 'fail';

export function Result() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('locked');
  const [mockResult, setMockResult] = useState<'success' | 'fail'>('success');
  const [streakCount, setStreakCount] = useState(7);

  // Handle CTA to watch ad and reveal result
  const handleWatchAd = () => {
    setViewState('revealing');
    setTimeout(() => {
      setViewState(mockResult);
    }, 2000); // 2 seconds fake ad viewing
  };

  // Run countup animation for success
  useEffect(() => {
    if (viewState === 'success') {
      const timer = setTimeout(() => {
        setStreakCount(8);
      }, 600); // Delay before countup
      return () => clearTimeout(timer);
    }
  }, [viewState]);

  // Toggle mock state for testing purposes (dev helper)
  const handleToggleMock = () => {
    setMockResult(prev => prev === 'success' ? 'fail' : 'success');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-x-hidden overflow-y-auto hide-scrollbar flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Flash Effects */}
        <AnimatePresence>
          {viewState === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 bg-[#22C55E] pointer-events-none z-10"
            />
          )}
          {viewState === 'fail' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 bg-[#EF4444] pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="h-[56px] flex items-center px-4 bg-transparent shrink-0 relative z-20">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={28} />
          </button>
        </div>

        {/* State 1: Locked */}
        {viewState === 'locked' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
              className="text-[#2563EB] mb-8"
            >
              <HelpCircle size={80} strokeWidth={1.5} />
            </motion.div>
            
            <h2 className="text-[24px] font-bold text-[#0F172A] mb-3 tracking-tight">오늘 결과가 나왔어요</h2>
            <p className="text-[15px] text-[#64748B] mb-12">결과를 확인하려면 광고를 시청해주세요</p>
            
            <p className="text-[14px] font-medium text-[#64748B] mb-4">당신의 연승 기록은 계속될까요?</p>
            
            <button 
              onClick={handleWatchAd} 
              className="w-full h-[56px] bg-[#2563EB] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#1D4ED8] transition-colors relative overflow-hidden"
            >
              <span className="relative z-10">결과 확인하기</span>
            </button>

            {/* Dev Helper (invisible toggle block) */}
            <button onClick={handleToggleMock} className="mt-8 text-[11px] text-slate-300 hover:text-slate-400 font-mono">
              [DEV] 다음 결과: {mockResult === 'success' ? '성공(Success)' : '실패(Fail)'} (클릭하여 전환)
            </button>
          </div>
        )}

        {/* State 2: Revealing (Ad Mock) */}
        {viewState === 'revealing' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-6"
            >
              <div className="w-14 h-14 border-[4px] border-[#2563EB]/20 border-t-[#2563EB] rounded-full" />
            </motion.div>
            <p className="text-[16px] font-semibold text-[#0F172A] mb-2 tracking-tight">광고 시청 중...</p>
            <p className="text-[14px] text-[#64748B]">결과를 가져오고 있습니다</p>
          </div>
        )}

        {/* State 3: Success */}
        {viewState === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col relative z-20 w-full"
          >
            {/* Top Icon & Text */}
            <div className="flex flex-col items-center pt-2 pb-6">
              <motion.div 
                initial={{ scale: 0, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }} 
                className="flex flex-col items-center"
              >
                <CheckCircle2 size={72} className="text-[#00C896] mb-3" fill="rgba(0, 200, 150, 0.1)" strokeWidth={2} />
                <h2 className="text-[32px] font-bold text-[#00C896] tracking-tight">정답!</h2>
              </motion.div>
            </div>

            {/* Stock Result Card */}
            <div className="mx-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-5 flex flex-col items-center mb-5">
              <h3 className="text-[20px] font-semibold text-[#0F172A] mb-4">삼성전자</h3>
              <div className="flex items-center gap-6 text-[14px] w-full justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-[#64748B] text-[12px] mb-1">나의 예측</span>
                  <span className="text-[#00C896] font-bold text-[16px]">▲ 상승</span>
                </div>
                <div className="w-[1px] h-10 bg-[#CBD5E1]" />
                <div className="flex flex-col items-center">
                  <span className="text-[#64748B] text-[12px] mb-1">실제 결과</span>
                  <span className="text-[#00C896] font-bold text-[16px]">▲ 상승 <span className="font-['DM_Mono'] text-[14px]">+1.2%</span></span>
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="mx-4 bg-[#FFFFFF] border border-[#00C896]/30 shadow-[0_8px_24px_rgba(0,200,150,0.12)] rounded-[16px] py-8 flex flex-col items-center mb-6">
              <span className="text-[16px] font-bold text-[#0F172A] mb-1">연속 성공</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-['DM_Mono'] text-[80px] font-bold text-[#00C896] leading-none tracking-tighter drop-shadow-sm">
                  {streakCount}
                </span>
                <span className="text-[24px] font-bold text-[#00C896] mb-3">연승</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-5 flex flex-col gap-5 mb-6">
              <div>
                <div className="flex justify-between text-[13px] mb-2 font-semibold">
                  <span className="text-[#64748B]">오늘 전체 유저 정답률</span>
                  <span className="text-[#2563EB] font-['DM_Mono'] font-bold">58%</span>
                </div>
                <div className="w-full h-[8px] bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '58%' }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-[#2563EB] rounded-full" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-[13px] mb-2 font-semibold">
                  <span className="text-[#64748B]">나의 누적 정답률</span>
                  <span className="text-[#00C896] font-['DM_Mono'] font-bold">72%</span>
                </div>
                <div className="w-full h-[8px] bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1, delay: 0.8 }} className="h-full bg-[#00C896] rounded-full" />
                </div>
              </div>
            </div>

            {/* Ranking */}
            <div className="mx-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-5 flex flex-col mb-8">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E2E8F0]">
                <Trophy size={20} className="text-[#2563EB]" />
                <span className="text-[15px] font-bold text-[#0F172A]">현재 나의 랭킹: 전체 243등</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {[
                  { rank: 1, name: '주식고수', streak: 12 },
                  { rank: 2, name: '워렌버핏', streak: 11 },
                  { rank: 3, name: '캔들마스터', streak: 10 },
                ].map(u => (
                  <div key={u.rank} className="flex items-center justify-between text-[14px]">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-bold font-['DM_Mono'] ${u.rank === 1 ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}>{u.rank}</span>
                      <span className="text-[#0F172A] font-medium">{u.name}</span>
                    </div>
                    <span className="text-[#00C896] font-bold font-['DM_Mono'] text-[15px]">{u.streak}연승</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-4 flex flex-col gap-3 pb-8">
              <button className="w-full h-[56px] border-2 border-[#2563EB] text-[#2563EB] bg-[#FFFFFF] rounded-[12px] font-semibold text-[16px] hover:bg-[#DBEAFE] transition-colors flex items-center justify-center gap-2">
                <Share2 size={20} />
                오늘 결과 공유하기
              </button>
              <button className="w-full h-[48px] text-[#64748B] font-medium text-[14px] hover:text-[#0F172A] transition-colors">
                내일 예측 미리보기
              </button>
            </div>
          </motion.div>
        )}

        {/* State 4: Fail */}
        {viewState === 'fail' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col relative z-20 w-full"
          >
            {/* Top Icon & Text */}
            <div className="flex flex-col items-center pt-2 pb-6">
              <motion.div 
                initial={{ scale: 0, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }} 
                className="flex flex-col items-center"
              >
                <XCircle size={72} className="text-[#FF4D6A] mb-3" fill="rgba(255, 77, 106, 0.1)" strokeWidth={2} />
                <h2 className="text-[32px] font-bold text-[#FF4D6A] tracking-tight">아쉬워요</h2>
              </motion.div>
            </div>

            {/* Stock Result Card */}
            <div className="mx-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-5 flex flex-col items-center mb-5">
              <h3 className="text-[20px] font-semibold text-[#0F172A] mb-4">삼성전자</h3>
              <div className="flex items-center gap-6 text-[14px] w-full justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-[#64748B] text-[12px] mb-1">나의 예측</span>
                  <span className="text-[#00C896] font-bold text-[16px]">▲ 상승</span>
                </div>
                <div className="w-[1px] h-10 bg-[#CBD5E1]" />
                <div className="flex flex-col items-center">
                  <span className="text-[#64748B] text-[12px] mb-1">실제 결과</span>
                  <span className="text-[#FF4D6A] font-bold text-[16px]">▼ 하락 <span className="font-['DM_Mono'] text-[14px]">-0.8%</span></span>
                </div>
              </div>
            </div>

            {/* Streak Reset Card */}
            <div className="mx-4 bg-[#FFFFFF] border border-[#FF4D6A]/30 shadow-[0_8px_24px_rgba(255,77,106,0.12)] rounded-[16px] py-8 flex flex-col items-center mb-8 relative overflow-hidden">
              <span className="text-[16px] font-bold text-[#FF4D6A] mb-4">연속 기록이 초기화됩니다</span>
              <div className="relative h-[80px] w-full flex justify-center items-center mt-2">
                {/* Dropping 7 */}
                <motion.span 
                  animate={{ y: [0, 80], opacity: [1, 0] }} 
                  transition={{ duration: 0.6, delay: 0.8, ease: "easeIn" }} 
                  className="font-['DM_Mono'] text-[80px] font-bold text-[#0F172A] leading-none absolute"
                >
                  7
                </motion.span>
                {/* Dropping 0 */}
                <motion.span 
                  initial={{ y: -80, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ duration: 0.6, delay: 1.2, type: 'spring', bounce: 0.5 }} 
                  className="font-['DM_Mono'] text-[80px] font-bold text-[#FF4D6A] leading-none absolute"
                >
                  0
                </motion.span>
              </div>
            </div>

            {/* Retry Section */}
            <div className="mx-4 flex flex-col items-center mt-2">
              <span className="text-[15px] font-bold text-[#0F172A] mb-5">오늘 재도전 기회: 2회 남음</span>
              
              <button className="w-full h-[56px] bg-[#FF4D6A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#F0415D] transition-colors flex items-center justify-center gap-2 shadow-sm mb-3">
                <Play size={18} fill="currentColor" className="ml-1" />
                광고 시청 후 다시 도전하기
              </button>
              
              <span className="text-[13px] font-medium text-[#64748B] mb-10">2차 도전: 광고 30초</span>
              
              <button className="h-[48px] px-6 rounded-full text-[14px] font-medium text-[#94A3B8] bg-[#F8FAFC] hover:bg-[#E2E8F0] hover:text-[#64748B] transition-colors pb-0.5">
                내일 다시 도전하기
              </button>
            </div>
          </motion.div>
        )}

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