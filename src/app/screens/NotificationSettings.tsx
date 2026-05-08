import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Bell, AlertTriangle, BarChart2, Flame, Trophy, Settings } from 'lucide-react';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

function Toggle({ isOn, onToggle }: ToggleProps) {
  return (
    <div 
      onClick={onToggle} 
      className={`w-[44px] h-[24px] rounded-full p-[2px] cursor-pointer transition-colors duration-300 ease-in-out flex items-center shrink-0 ${isOn ? 'bg-[#00C896]' : 'bg-[#E2E8F0]'}`}
    >
      <motion.div 
        layout 
        initial={false}
        animate={{ 
          x: isOn ? 20 : 0 
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-[20px] h-[20px] bg-white rounded-full shadow-[0_2px_4px_rgba(15,23,42,0.1)]" 
      />
    </div>
  );
}

export function NotificationSettings() {
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    open: true,
    close: true,
    result: true,
    streak: true,
    ranking: false,
  });

  const [openTime, setOpenTime] = useState('18:00');

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const turnOffAll = () => {
    setSettings({
      open: false,
      close: false,
      result: false,
      streak: false,
      ranking: false,
    });
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-x-hidden overflow-y-auto hide-scrollbar flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center px-4 bg-white border-b border-[#E2E8F0] shrink-0 sticky top-0 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#0F172A] hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight ml-2">알림 설정</h1>
        </header>

        <div className="flex-1 pb-10">
          
          {/* Toast Preview Component */}
          <div className="p-5 bg-slate-50 border-b border-[#E2E8F0]">
            <span className="text-[12px] font-medium text-[#64748B] mb-3 block">알림 미리보기</span>
            <div className="bg-[#F8FAFC] rounded-[16px] p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-[#E2E8F0] flex gap-3 items-start">
              <div className="w-[36px] h-[36px] bg-[#2563EB] rounded-[10px] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="26" y="16" width="8" height="28" rx="2" fill="#FFFFFF" />
                  <line x1="30" y1="8" x2="30" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <line x1="30" y1="44" x2="30" y2="52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <rect x="12" y="28" width="8" height="16" rx="2" fill="#FFFFFF" opacity="0.6" />
                  <line x1="16" y1="22" x2="16" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="16" y1="44" x2="16" y2="48" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <rect x="40" y="20" width="8" height="20" rx="2" fill="#FFFFFF" opacity="0.8" />
                  <line x1="44" y1="12" x2="44" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  <line x1="44" y1="40" x2="44" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold text-[#64748B]">Candle</span>
                  <span className="text-[11px] font-medium text-[#94A3B8] font-['DM_Mono']">지금</span>
                </div>
                <h4 className="text-[14px] font-semibold text-[#0F172A] mb-1 tracking-tight">
                  🔥 오늘 예측 마감까지 1시간 남았어요!
                </h4>
                <p className="text-[13px] text-[#64748B] leading-tight">
                  7연승을 지키세요. 지금 바로 참여하여 리워드에 도전하세요.
                </p>
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="px-5 py-4 flex flex-col gap-6 mt-2">
            
            {/* 1. 예측 오픈 알림 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={18} className="text-[#0F172A]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">예측 오픈 알림</h3>
                    <p className="text-[13px] text-[#64748B]">매일 저녁 6시에 오늘의 예측이 열립니다</p>
                  </div>
                </div>
                <Toggle isOn={settings.open} onToggle={() => toggleSetting('open')} />
              </div>
              
              <AnimatePresence>
                {settings.open && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-11"
                  >
                    <div className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2.5 rounded-[12px] border border-[#E2E8F0]">
                      <span className="text-[13px] text-[#64748B] font-medium">알림 시간</span>
                      <div className="relative">
                        <select 
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="appearance-none font-['DM_Mono'] text-[14px] font-semibold text-[#2563EB] bg-[#DBEAFE] pl-3 pr-7 py-1.5 rounded-[8px] outline-none cursor-pointer"
                        >
                          <option value="18:00">18:00</option>
                          <option value="19:00">19:00</option>
                          <option value="20:00">20:00</option>
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[1px] w-full bg-[#E2E8F0]" />

            {/* 2. 예측 마감 알림 */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={18} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">예측 마감 알림</h3>
                  <p className="text-[13px] text-[#64748B]">마감 1시간 전에 알려드려요</p>
                </div>
              </div>
              <Toggle isOn={settings.close} onToggle={() => toggleSetting('close')} />
            </div>

            <div className="h-[1px] w-full bg-[#E2E8F0]" />

            {/* 3. 결과 공개 알림 */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart2 size={18} className="text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">결과 공개 알림</h3>
                  <p className="text-[13px] text-[#64748B]">장 마감 후 결과가 나오면 알려드려요</p>
                </div>
              </div>
              <Toggle isOn={settings.result} onToggle={() => toggleSetting('result')} />
            </div>

            <div className="h-[1px] w-full bg-[#E2E8F0]" />

            {/* 4. 연승 위험 알림 */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame size={18} className="text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">연승 위험 알림</h3>
                  <p className="text-[13px] text-[#64748B]">오늘 예측을 안 하면 연승이 끊깁니다</p>
                </div>
              </div>
              <Toggle isOn={settings.streak} onToggle={() => toggleSetting('streak')} />
            </div>

            <div className="h-[1px] w-full bg-[#E2E8F0]" />

            {/* 5. 랭킹 변동 알림 */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy size={18} className="text-[#00C896]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">랭킹 변동 알림</h3>
                  <p className="text-[13px] text-[#64748B]">내 랭킹이 변동되면 알려드려요</p>
                </div>
              </div>
              <Toggle isOn={settings.ranking} onToggle={() => toggleSetting('ranking')} />
            </div>
            
          </div>

          {/* Bottom Section */}
          <div className="px-5 pt-8 pb-10 flex flex-col items-center gap-4">
            <button 
              onClick={turnOffAll}
              className="w-full h-[52px] rounded-[12px] border border-[#EF4444] text-[#EF4444] font-semibold text-[15px] flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              모든 알림 끄기
            </button>
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Settings size={14} />
              <span className="text-[12px]">알림을 받으려면 기기 설정에서 허용해주세요</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}