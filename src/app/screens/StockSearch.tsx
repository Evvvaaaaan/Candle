import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

// ─── 종목 데이터 타입 ────────────────────────────────────────
interface Stock {
  code: string;
  name: string;
  currentPrice?: number;
  changeRate?: number;
  changePrice?: number;
}

// ─── 스켈레톤 로딩 컴포넌트 ──────────────────────────────────
function StockCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-[18px] bg-[#E2E8F0] rounded w-24 mb-2" />
          <div className="h-[12px] bg-[#F8FAFC] rounded w-16" />
        </div>
        <div className="text-right">
          <div className="h-[20px] bg-[#E2E8F0] rounded w-20 mb-2 ml-auto" />
          <div className="h-[14px] bg-[#F8FAFC] rounded w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── 종목 카드 컴포넌트 ──────────────────────────────────────
interface StockCardProps {
  stock: Stock;
  onClick: (stock: Stock) => void;
}

function StockCard({ stock, onClick }: StockCardProps) {
  const isUp = (stock.changeRate ?? 0) >= 0;
  const changeColor = isUp ? '#00C896' : '#FF4D6A';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(stock)}
      className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] cursor-pointer hover:bg-[#F8FAFC] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-[16px] font-semibold text-[#0F172A] tracking-tight mb-1">
            {stock.name}
          </h3>
          <p className="text-[12px] text-[#64748B] font-['DM_Mono']">{stock.code}</p>
        </div>

        {stock.currentPrice !== undefined ? (
          <div className="text-right">
            <div className="text-[18px] font-semibold text-[#0F172A] font-['DM_Mono'] mb-1">
              {stock.currentPrice.toLocaleString()}원
            </div>
            <div className="flex items-center justify-end gap-1">
              <Icon size={14} style={{ color: changeColor }} />
              <span
                className="text-[14px] font-semibold font-['DM_Mono']"
                style={{ color: changeColor }}
              >
                {isUp ? '+' : ''}{stock.changeRate?.toFixed(2)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div className="h-[20px] bg-[#E2E8F0] rounded w-20 mb-2 animate-pulse" />
            <div className="h-[14px] bg-[#F8FAFC] rounded w-16 animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export function StockSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // ─── 초기 종목 리스트 로딩 (정적 데이터) ─────────────────
  useEffect(() => {
    // 시가총액 상위 20개 종목 (정적 데이터)
    const topStocks: Stock[] = [
      { code: '005930', name: '삼성전자' },
      { code: '000660', name: 'SK하이닉스' },
      { code: '373220', name: 'LG에너지솔루션' },
      { code: '207940', name: '삼성바이오로직스' },
      { code: '005490', name: 'POSCO홀딩스' },
      { code: '035420', name: 'NAVER' },
      { code: '005380', name: '현대차' },
      { code: '006400', name: '삼성SDI' },
      { code: '051910', name: 'LG화학' },
      { code: '035720', name: '카카오' },
      { code: '068270', name: '셀트리온' },
      { code: '028260', name: '삼성물산' },
      { code: '105560', name: 'KB금융' },
      { code: '055550', name: '신한지주' },
      { code: '096770', name: 'SK이노베이션' },
      { code: '003670', name: '포스코퓨처엠' },
      { code: '012330', name: '현대모비스' },
      { code: '066570', name: 'LG전자' },
      { code: '086790', name: '하나금융지주' },
      { code: '033780', name: 'KT&G' },
    ];

    setStocks(topStocks);
    setFilteredStocks(topStocks);
    setIsLoadingInitial(false);

    // 초기 렌더링 후 실시간 시세 페칭 시작
    fetchStockPrices(topStocks);
  }, []);

  // ─── 실시간 시세 페칭 (Mock API) ────────────────────────
  const fetchStockPrices = async (stockList: Stock[]) => {
    setIsLoadingPrices(true);

    // Mock API 호출 (실제로는 한국투자증권 API 또는 BFF 서버 호출)
    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedStocks = stockList.map(stock => {
      // Mock 데이터 생성
      const basePrice = Math.floor(Math.random() * 100000) + 10000;
      const changeRate = (Math.random() - 0.5) * 10; // -5% ~ +5%
      const changePrice = Math.floor(basePrice * (changeRate / 100));

      return {
        ...stock,
        currentPrice: basePrice,
        changeRate: changeRate,
        changePrice: changePrice,
      };
    });

    setStocks(updatedStocks);
    setFilteredStocks(updatedStocks);
    setIsLoadingPrices(false);
  };

  // ─── 검색 로직 (Debounce 0.5초) ──────────────────────────
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks(stocks);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtered = stocks.filter(stock =>
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.code.includes(searchQuery)
      );
      setFilteredStocks(filtered);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks]);

  // ─── 종목 선택 핸들러 ────────────────────────────────────
  const handleStockSelect = (stock: Stock) => {
    if (!stock.currentPrice) return;

    // 예측 상세 페이지로 라우팅 (파라미터 전달)
    navigate('/prediction', {
      state: {
        ticker: stock.code,
        stockName: stock.name,
        currentPrice: stock.currentPrice,
        changeRate: stock.changeRate,
      }
    });
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-white overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">

        {/* Header */}
        <header className="h-[56px] flex items-center justify-between px-4 bg-white border-b border-[#E2E8F0] shrink-0 z-20">
          <div className="flex items-center">
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
            <span className="font-semibold text-[18px] text-[#0F172A] ml-2 tracking-tight">종목 선택</span>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 pt-4 pb-3 bg-white border-b border-[#E2E8F0]">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="종목명 또는 종목코드 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[48px] pl-12 pr-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[15px] text-[#0F172A] outline-none focus:border-[#2563EB] transition-colors placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Stock List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-10 px-4">
          {/* Loading Initial */}
          {isLoadingInitial && (
            <div className="pt-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <StockCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Searching Indicator */}
          {isSearching && !isLoadingInitial && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Stock Cards */}
          {!isLoadingInitial && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-4 space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <motion.div
                      key={stock.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <StockCard stock={stock} onClick={handleStockSelect} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4">
                      <Search size={32} className="text-[#CBD5E1]" />
                    </div>
                    <p className="text-[16px] font-semibold text-[#0F172A] mb-1">
                      검색 결과가 없습니다
                    </p>
                    <p className="text-[13px] text-[#64748B]">
                      다른 종목명이나 코드로 검색해보세요
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Info Banner */}
          {!isLoadingInitial && !isSearching && filteredStocks.length > 0 && searchQuery === '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 mb-4 p-4 bg-[#DBEAFE] border border-[#2563EB] rounded-[12px]"
            >
              <p className="text-[13px] text-[#0F172A] leading-relaxed">
                <span className="font-semibold">💡 시가총액 상위 20개</span> 종목을 보여드리고 있어요.
                원하는 종목이 없다면 검색해보세요!
              </p>
            </motion.div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

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
    </div>
  );
}
