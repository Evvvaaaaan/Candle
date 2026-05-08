import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { User, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';

export function Nickname() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'duplicate'>('idle');

  // 실시간 닉네임 검증 모의 로직
  useEffect(() => {
    if (nickname.length === 0) {
      setStatus('idle');
      return;
    }

    if (nickname.includes('중복') || nickname.toLowerCase() === 'admin') {
      setStatus('duplicate');
    } else {
      setStatus('valid');
    }
  }, [nickname]);

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-none md:rounded-[40px] md:border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pt-4 flex flex-col">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[26px] font-bold mb-10 text-slate-900"
          >
            닉네임을 설정해주세요
          </motion.h1>

          {/* Profile Icon */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="flex justify-center mb-10"
          >
            <div className="w-24 h-24 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center shadow-sm relative">
              <User size={40} className="text-blue-600" />
            </div>
          </motion.div>

          {/* Input Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2 relative"
          >
            <div className="flex justify-between items-end px-1 mb-1">
              <span className="text-sm font-medium text-slate-500">닉네임</span>
              <span className="text-xs text-slate-400 font-['DM_Mono']">
                {nickname.length}<span className="text-slate-300">/10</span>
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                maxLength={10}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="주식고수123"
                className={`w-full h-[56px] bg-slate-50 border rounded-xl px-4 text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-sm
                  ${status === 'duplicate' ? 'border-red-500 focus:border-red-500' : 
                    status === 'valid' ? 'border-green-500 focus:border-green-500' : 
                    'border-slate-200 focus:border-blue-600'}`}
              />
            </div>

            {/* Validation Message */}
            <div className="h-6 mt-1 px-1">
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.p 
                    key="idle"
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-slate-500"
                  >
                    한글, 영문, 숫자 조합 가능
                  </motion.p>
                )}
                {status === 'valid' && (
                  <motion.div 
                    key="valid"
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-green-600"
                  >
                    <CheckCircle2 size={14} />
                    <span>사용 가능한 닉네임이에요</span>
                  </motion.div>
                )}
                {status === 'duplicate' && (
                  <motion.div 
                    key="duplicate"
                    initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-600"
                  >
                    <XCircle size={14} />
                    <span>이미 사용 중인 닉네임이에요</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 pb-10 flex flex-col items-center gap-4">
          <p className="text-xs text-slate-500">
            닉네임은 랭킹에 공개됩니다
          </p>
          <motion.button 
            whileHover={status === 'valid' ? { scale: 1.02 } : {}}
            whileTap={status === 'valid' ? { scale: 0.98 } : {}}
            onClick={() => {
              if (status === 'valid') navigate('/home');
            }}
            disabled={status !== 'valid'}
            className={`w-full py-4 rounded-xl font-bold text-[16px] transition-all duration-300 shadow-sm
              ${status === 'valid' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            시작하기
          </motion.button>
        </div>

      </div>
    </div>
  );
}