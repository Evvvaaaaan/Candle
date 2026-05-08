import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Share2, Eye } from 'lucide-react';
import { NEWS_DATA } from './News';

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find news data based on id
  const news = NEWS_DATA.find(n => n.id === Number(id));

  if (!news) {
    return (
      <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
        <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] flex flex-col items-center justify-center">
          <p className="text-[#64748B]">뉴스를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/news')} className="mt-4 text-[#2563EB] font-semibold">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Generate some dummy content based on summary
  const paragraphs = [
    news.summary,
    "이번 조치는 시장의 예상치를 웃도는 수준으로, 향후 관련 산업 전반에 큰 영향을 미칠 것으로 전망된다. 전문가들은 단기적인 변동성 확대는 불가피하지만, 중장기적으로는 산업 경쟁력 강화에 기여할 것으로 분석하고 있다.",
    "특히 주요 글로벌 기업들의 대응이 주목되는 가운데, 관련 주식들의 거래량도 급증하고 있는 추세다. 투자자들은 향후 발표될 추가 정책이나 실적 발표에 촉각을 곤두세우고 있다.",
    "업계 관계자는 '현재의 불확실성을 기회로 활용하려는 움직임이 포착되고 있다'며 '철저한 리스크 관리와 함께 옥석 가리기가 필요한 시점'이라고 조언했다."
  ];

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#FFFFFF] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">
        
        {/* Header */}
        <header className="h-[56px] flex items-center px-4 bg-white border-b border-[#E2E8F0] shrink-0 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#0F172A] hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight ml-2">뉴스</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white pb-safe">
          
          {/* Thumbnail */}
          {news.image ? (
            <div className="w-full h-[200px] bg-[#F8FAFC]">
              <img 
                src={news.image} 
                alt={news.title} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-[200px] bg-[#DBEAFE] flex items-center justify-center">
              <span className="text-5xl opacity-50">📰</span>
            </div>
          )}

          <div className="p-5">
            {/* Category & Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12px] font-semibold text-[#2563EB] tracking-tight">{news.category}</span>
              {news.badge && (
                <span className="bg-[#2563EB] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-tight">
                  {news.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[20px] font-bold text-[#0F172A] leading-[1.4] mb-4 tracking-tight">
              {news.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center justify-between py-3 border-y border-[#E2E8F0] mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#64748B] font-medium">{news.media}</span>
                <span className="text-[12px] text-[#CBD5E1]">|</span>
                <span className="text-[12px] text-[#64748B]">{news.time}</span>
              </div>
              {news.views && (
                <div className="flex items-center gap-1 text-[#64748B]">
                  <Eye size={14} />
                  <span className="text-[12px] font-['DM_Mono']">{news.views.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] text-[#0F172A] leading-[1.65] tracking-[-0.01em]">
                  {p}
                </p>
              ))}
            </div>

            {/* Share Button */}
            <div className="mt-10 mb-6">
              <button className="w-full h-[52px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] flex items-center justify-center gap-2 text-[#0F172A] font-semibold text-[15px] hover:bg-[#F1F5F9] transition-colors">
                <Share2 size={18} />
                카카오톡으로 공유하기
              </button>
            </div>
          </div>
        </div>

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