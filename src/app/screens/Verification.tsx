import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { ChevronLeft, ShieldCheck, Trophy, Lock, AlertCircle, XCircle } from 'lucide-react';

export function Verification() {
  const navigate = useNavigate();
  const [isBlocked, setIsBlocked] = useState(false);

  if (isBlocked) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
        <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-slate-200 items-center justify-center px-6">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">만 19세 이상만<br />이용 가능합니다</h2>
            <p className="text-slate-500 text-sm mb-10">
              Candle 앱은 주식 예측 성격상<br />미성년자의 이용을 제한하고 있습니다.
            </p>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-xl bg-slate-100 text-slate-900 font-semibold text-lg hover:bg-slate-200 transition-colors shadow-sm"
            >
              앱 종료
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-semibold text-lg text-slate-900 mr-8">본인인증</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pt-8 flex flex-col">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center mb-10"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative border border-blue-100 shadow-sm">
              <ShieldCheck size={40} className="text-blue-600" />
            </div>
            
            <h2 className="text-[26px] font-bold mb-3 text-slate-900">본인인증이 필요해요</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              리워드 지급 및 서비스 이용을 위해<br />인증이 필요합니다
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                <Trophy size={18} className="text-blue-600" />
              </div>
              <span className="text-slate-700 font-medium">10연승 리워드 수령</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                <Lock size={18} className="text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">계정 보안 강화</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                <span className="text-red-600 font-bold text-lg leading-none font-['DM_Mono']">19</span>
              </div>
              <span className="text-slate-700 font-medium">만 19세 이상만 참여 가능</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom Action */}
        <div className="p-6 pb-12">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/nickname')}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-[16px] mb-4 hover:bg-blue-700 transition-colors shadow-sm"
          >
            PASS로 본인인증 하기
          </motion.button>
          
          <button 
            onClick={() => setIsBlocked(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <AlertCircle size={14} />
            만 19세 미만은 이용이 제한됩니다
          </button>
        </div>

      </div>
    </div>
  );
}