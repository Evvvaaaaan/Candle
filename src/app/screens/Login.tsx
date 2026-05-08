import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

export function Login() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    // Navigate to Verification step after "login"
    navigate('/verification');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#F8FAFC] flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col md:rounded-[40px] md:border border-slate-200 md:shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        
        {/* Center Content (Logo, Title, Curve) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          {/* Curve Behind Logo (Area Chart Style) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden m-[0px]">
            <svg viewBox="0 0 375 400" className="w-full h-[400px] mx-[0px] mt-[0px] mb-[-118px]" fill="none" preserveAspectRatio="none">
              <path 
                d="M-20,320 C80,320 120,120 187.5,180 C255,240 280,100 400,80 L400,400 L-20,400 Z" 
                fill="url(#fill_gradient)" 
              />
              <path 
                d="M-20,320 C80,320 120,120 187.5,180 C255,240 280,100 400,80" 
                stroke="url(#line_gradient)" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Secondary subtle line */}
              <path 
                d="M-20,340 C80,340 120,140 187.5,200 C255,260 280,120 400,100" 
                stroke="#2563EB" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                opacity="0.1" 
              />
              <defs>
                <linearGradient id="line_gradient" x1="0" y1="320" x2="375" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" stopOpacity="0.2" />
                  <stop offset="0.5" stopColor="#2563EB" />
                  <stop offset="1" stopColor="#00C896" />
                </linearGradient>
                <linearGradient id="fill_gradient" x1="187.5" y1="80" x2="187.5" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col items-center -translate-y-[80px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 relative z-10"
            >
              {/* Candle Logo Box */}
              <div className="w-[84px] h-[84px] bg-transparent flex items-center justify-center -translate-y-[28px] p-[0px]">
                <svg className="mx-[0px] mt-[0px] mb-[78px]" width="52" height="52" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Center Candle */}
                  <rect x="26" y="16" width="8" height="28" rx="2" fill="#2563EB" />
                  <line x1="30" y1="8" x2="30" y2="16" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  <line x1="30" y1="44" x2="30" y2="52" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  {/* Left Candle */}
                  <rect x="12" y="28" width="8" height="16" rx="2" fill="#2563EB" opacity="0.6" />
                  <line x1="16" y1="22" x2="16" y2="28" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="16" y1="44" x2="16" y2="48" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  {/* Right Candle */}
                  <rect x="40" y="20" width="8" height="20" rx="2" fill="#2563EB" opacity="0.8" />
                  <line x1="44" y1="12" x2="44" y2="20" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  <line x1="44" y1="40" x2="44" y2="46" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-[40px] font-bold text-[#0F172A] tracking-tight leading-none relative z-10 p-[0px] mx-[0px] mt-[-110px] mb-[12px]"
            >Candle</motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[16px] text-[#64748B] font-medium tracking-tight relative z-10 mx-[0px] my-[2px] px-[0px] py-[4px]"
            >
              내 예측이 곧 수익이 되는 공간
            </motion.p>
          </div>
        </div>

        {/* Bottom Section: Button anchored to bottom */}
        <div className="px-5 pb-12 flex flex-col relative z-10 bg-gradient-to-t from-white via-white to-white/0 pt-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {/* Kakao Login Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleKakaoLogin}
              className="w-full h-[56px] bg-[#FEE500] hover:bg-[#FEE500]/90 text-black rounded-[14px] flex items-center justify-center gap-2 transition-colors relative shadow-[0_4px_12px_rgba(254,229,0,0.2)]"
            >
              <div className="absolute left-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5C5.85786 2.5 2.5 5.25329 2.5 8.65C2.5 10.8354 3.93175 12.7533 5.96205 13.8443L5.20173 16.5912C5.1257 16.8658 5.43431 17.0664 5.66579 16.9149L8.93247 14.7735C9.28014 14.819 9.63607 14.8436 10 14.8436C14.1421 14.8436 17.5 12.0903 17.5 8.69355C17.5 5.29681 14.1421 2.54352 10 2.54352Z" fill="#000000"/>
                </svg>
              </div>
              <span className="text-[16px] font-semibold text-black/90">카카오로 시작하기</span>
            </motion.button>
          </motion.div>

          {/* Footer Text */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <p className="text-[12px] text-[#94A3B8] font-medium text-center">
              서비스 이용을 위해 본인인증이 필요합니다
            </p>
            <div className="flex items-center justify-center gap-3 text-[#94A3B8] font-medium">
              <button className="text-[12px] hover:text-[#64748B] transition-colors underline underline-offset-2">이용약관</button>
              <span className="text-[#E2E8F0] px-1 text-[12px]">|</span>
              <button className="text-[12px] hover:text-[#64748B] transition-colors underline underline-offset-2">개인정보처리방침</button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}