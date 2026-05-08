import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/BottomNav';

const TABS = ['전체', '시장뉴스', '종목분석', '투자팁', '공지사항'];

export const NEWS_DATA = [
  {
    id: 1,
    title: "삼성전자, 실적 부진에도 불구하고 반도체 투자 지속",
    summary: "삼성전자가 AI 반도체 시장 선점을 위해 대규모 투자를 단행하며...",
    media: "연합뉴스",
    time: "2시간 전",
    views: 1205,
    category: "시장뉴스",
    image: "https://images.unsplash.com/photo-1661347998423-b15d37d6f61e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwc2VtaWNvbmR1Y3RvciUyMGZhY3Rvcnl8ZW58MXx8fHwxNzc4MTc1ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: null
  },
  {
    id: 2,
    title: "코스피 3100선 돌파, 기관·외국인 순매수 주도",
    summary: "오늘 코스피는 기관과 외국인 투자자들의 강한 매수세에 힘입어...",
    media: "매일경제",
    time: "1시간 전",
    views: 3402,
    category: "시장뉴스",
    image: "https://images.unsplash.com/photo-1762279389020-eeeb69c25813?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9jayUyMG1hcmtldCUyMGNoYXJ0JTIwZ3JhcGh8ZW58MXx8fHwxNzc4MTc1ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: null
  },
  {
    id: 3,
    title: "테슬라 주가 급등, 전기차 시장 경쟁 심화",
    summary: "테슬라의 신형 모델 공개로 인해 전기차 시장의 주도권 경쟁이...",
    media: "조선일보",
    time: "30분 전",
    views: 521,
    category: "종목분석",
    image: "https://images.unsplash.com/photo-1706493339308-06fd5c38044b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMGNhciUyMGRyaXZpbmd8ZW58MXx8fHwxNzc4MTc1ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: null
  },
  {
    id: 4,
    title: "[투자팁] 초보자를 위한 분할매수 전략",
    summary: "분할매수를 통해 리스크를 줄이는 방법과 성공적인 투자의 기본...",
    media: "Candle 팀",
    time: "어제",
    views: 8930,
    category: "투자팁",
    image: null,
    badge: "추천"
  },
  {
    id: 5,
    title: "미국 금리 인상, 한국 증시에 미치는 영향",
    summary: "미국 연방준비제도가 기준금리를 인상함에 따라 한국 증시도...",
    media: "한국경제",
    time: "어제",
    views: 2100,
    category: "시장뉴스",
    image: "https://images.unsplash.com/photo-1633059050703-0f1b50828402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZWRlcmFsJTIwcmVzZXJ2ZXxlbnwxfHx8fDE3NzgxNzU4MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: null
  }
];

export function News() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');

  const filteredNews = activeTab === '전체' 
    ? NEWS_DATA 
    : NEWS_DATA.filter(news => news.category === activeTab);

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
          <div className="w-7 h-7" />
        </header>

        {/* Tabs */}
        <div className="h-[48px] border-b border-[#E2E8F0] bg-white shrink-0 z-20">
          <div className="flex h-full px-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center h-full space-x-4 whitespace-nowrap">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative h-full flex items-center justify-center px-1 transition-colors ${
                    activeTab === tab ? 'text-[#2563EB]' : 'text-[#64748B] hover:bg-[#2563EB]/5'
                  }`}
                >
                  <span className={`text-[13px] tracking-tight ${activeTab === tab ? 'font-semibold' : 'font-medium'}`}>
                    {tab}
                  </span>
                  {activeTab === tab && (
                    <motion.div
                      layoutId="newsTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#E2E8F0]">
          <div className="flex flex-col gap-[1px]">
            {filteredNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/news/${news.id}`)}
                className={`flex w-full h-[120px] p-4 cursor-pointer transition-colors ${news.badge ? 'bg-[#DBEAFE]' : 'bg-[#FFFFFF] hover:bg-[#F8FAFC]'}`}
              >
                {/* Image */}
                {news.image ? (
                  <div className="shrink-0 mr-3">
                    <img 
                      src={news.image} 
                      alt="" 
                      className="w-[88px] h-[88px] rounded-[8px] object-cover border border-[#E2E8F0] bg-[#F8FAFC]"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 mr-3 w-[88px] h-[88px] rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                    <span className="text-2xl opacity-50">📰</span>
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 relative">
                  {/* Badge */}
                  {news.badge && (
                    <div className="absolute -top-1 right-0 bg-[#2563EB] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-tight leading-none z-10">
                      {news.badge}
                    </div>
                  )}

                  <h3 className={`text-[13px] font-semibold leading-[1.4] line-clamp-2 ${news.badge ? 'text-[#2563EB] pr-8' : 'text-[#0F172A]'}`}>
                    {news.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                    {news.summary}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#94A3B8] font-medium">{news.media}</span>
                      <span className="text-[10px] text-[#94A3B8]">·</span>
                      <span className="text-[10px] text-[#94A3B8]">{news.time}</span>
                    </div>
                    {news.views && (
                      <div className="flex items-center gap-1 text-[#94A3B8]">
                        <Eye size={12} />
                        <span className="text-[10px] font-['DM_Mono']">{news.views.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* End of list padding */}
            <div className="h-4 bg-[#FFFFFF]" />
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
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