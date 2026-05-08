import { Bell, User } from 'lucide-react';
import { motion } from 'motion/react';

export function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-between items-center px-5 py-4 z-10 relative bg-white"
    >
      <div className="flex items-center gap-2">
        <div className="text-blue-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.5 9L20 10.5L13.5 12L12 19L10.5 12L4 10.5L10.5 9L12 2Z" fill="currentColor"/>
            <rect x="11" y="19" width="2" height="3" fill="currentColor" />
          </svg>
        </div>
        <span className="font-bold text-xl tracking-wider font-['Pretendard',_sans-serif] text-slate-900">Candle</span>
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <User size={24} className="hover:text-slate-600 transition-colors cursor-pointer" />
        <Bell size={24} className="hover:text-slate-600 transition-colors cursor-pointer" />
      </div>
    </motion.header>
  );
}