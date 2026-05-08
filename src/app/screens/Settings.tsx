import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell, Lock, User, CreditCard, FileText, Shield, HelpCircle,
  Phone, Megaphone, Star, Info, LogOut, Trash2, ChevronRight,
  ChevronDown, Check, Edit2, Trophy, ChevronLeft, X
} from "lucide-react";

// ─── Toggle 컴포넌트 ──────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={`w-[44px] h-[24px] rounded-full relative cursor-pointer transition-colors duration-200 shrink-0 ${
        on ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
      }`}
    >
      <div
        className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.18)] ${
          on ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </div>
  );
}

// ─── 섹션 레이블 ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-[#94A3B8] tracking-[0.08em] uppercase px-5 pt-5 pb-2">
      {children}
    </div>
  );
}

// ─── 설정 행 ─────────────────────────────────────────────────
interface SettingRowProps {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}

function SettingRow({ icon: Icon, iconColor, label, sub, right, onClick, danger, last }: SettingRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 px-5 h-[58px] bg-white cursor-pointer transition-colors duration-150 hover:bg-[#F8FAFC] ${
        last ? '' : 'border-b border-[#E2E8F0]'
      }`}
    >
      <div className={`w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center border border-[#E2E8F0] ${
        danger ? 'bg-[#FEE2E2]' : 'bg-[#F8FAFC]'
      }`}>
        <Icon size={18} className={danger ? 'text-[#EF4444]' : iconColor || 'text-[#64748B]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium leading-tight ${danger ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
          {label}
        </div>
        {sub && <div className="text-[12px] text-[#94A3B8] mt-0.5">{sub}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
      {onClick && !right && <ChevronRight size={16} className="text-[#CBD5E1]" />}
    </div>
  );
}

// ─── 카드 컨테이너 ───────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.06)] mx-4 ${className}`}>
      {children}
    </div>
  );
}

// ─── 모달 ────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  desc: string;
  confirmText: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function Modal({ title, desc, confirmText, confirmColor, onConfirm, onCancel }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.45)] flex items-end justify-center z-[100]">
      <div className="bg-white rounded-t-[20px] w-full max-w-[430px] pt-7 px-6 pb-10 shadow-[0_-4px_24px_rgba(15,23,42,0.12)]">
        <div className="w-9 h-1 bg-[#CBD5E1] rounded-sm mx-auto mb-6" />
        <div className="text-[18px] font-bold text-[#0F172A] mb-2">{title}</div>
        <div className="text-[14px] text-[#64748B] mb-7 leading-relaxed">{desc}</div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-[50px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-[15px] font-semibold cursor-pointer hover:bg-[#E2E8F0]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-[50px] rounded-xl border-none text-white text-[15px] font-bold cursor-pointer ${
              confirmColor === '#EF4444' ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 알림 설정 화면 ──────────────────────────────────────────
function NotificationScreen({ onBack }: { onBack: () => void }) {
  const [masterOn, setMasterOn] = useState(true);
  const [items, setItems] = useState({
    open: true,
    deadline: true,
    result: true,
    streak: true,
    rank: false,
    event: false,
  });
  const [openTime, setOpenTime] = useState("18:00");
  const [deadlineTime, setDeadlineTime] = useState("1시간 전");

  const toggle = (key: keyof typeof items) => setItems(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      {/* 권한 없음 배너 */}
      <div className="mx-4 mt-3 p-3 px-4 bg-[#FFFBEB] border border-[#F59E0B] rounded-xl flex items-center gap-2.5">
        <Bell size={18} className="text-[#F59E0B]" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-[#0F172A]">알림 권한이 꺼져 있어요</div>
          <div className="text-[12px] text-[#64748B]">기기 설정에서 허용해주세요</div>
        </div>
        <span className="text-[12px] text-[#2563EB] font-semibold cursor-pointer">설정 이동</span>
      </div>

      {/* 마스터 토글 */}
      <div className="mt-3">
        <Card className="border-l-[3px] border-l-[#2563EB] p-4 px-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#DBEAFE] flex items-center justify-center">
            <Bell size={20} className="text-[#2563EB]" />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-bold text-[#0F172A]">전체 알림</div>
            <div className="text-[12px] text-[#94A3B8]">모든 알림을 한번에 켜고 끌 수 있어요</div>
          </div>
          <Toggle on={masterOn} onChange={setMasterOn} />
        </Card>
      </div>

      <SectionLabel>알림 항목</SectionLabel>

      {/* 알림 항목들 */}
      <div className="space-y-2 px-4">
        {/* 예측 오픈 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Bell size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[#0F172A]">예측 오픈 알림</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">매일 저녁 새 예측이 열리면 알려드려요</div>
            </div>
            <Toggle on={items.open} onChange={() => toggle('open')} />
          </div>
          {items.open && (
            <div className="px-5 pb-3.5 flex items-center gap-2">
              <span className="text-[12px] text-[#94A3B8] font-medium">알림 시간</span>
              <select
                value={openTime}
                onChange={e => setOpenTime(e.target.value)}
                className="text-[13px] text-[#0F172A] border border-[#E2E8F0] rounded-lg py-1 px-2.5 bg-[#F8FAFC] cursor-pointer"
              >
                {["18:00", "19:00", "20:00", "21:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
        </Card>

        {/* 마감 임박 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }} className="border-l-[3px] border-l-[#F59E0B]">
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#FFFBEB] border border-[#E2E8F0] flex items-center justify-center">
              <Bell size={18} className="text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#0F172A]">마감 임박 알림</span>
                <span className="text-[10px] font-bold text-[#F59E0B] bg-[#FFFBEB] px-1.5 py-0.5 rounded-md">중요</span>
              </div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">예측 마감 전에 놓치지 않도록 알려드려요</div>
            </div>
            <Toggle on={items.deadline} onChange={() => toggle('deadline')} />
          </div>
          {items.deadline && (
            <div className="px-5 pb-3.5 flex items-center gap-2">
              <span className="text-[12px] text-[#94A3B8] font-medium">마감 전</span>
              <select
                value={deadlineTime}
                onChange={e => setDeadlineTime(e.target.value)}
                className="text-[13px] text-[#0F172A] border border-[#E2E8F0] rounded-lg py-1 px-2.5 bg-[#F8FAFC] cursor-pointer"
              >
                {["30분 전", "1시간 전", "2시간 전"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
        </Card>

        {/* 결과 공개 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Check size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[#0F172A]">결과 공개 알림</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">15:35 장 마감 후 결과를 바로 알려드려요</div>
            </div>
            <Toggle on={items.result} onChange={() => toggle('result')} />
          </div>
        </Card>

        {/* 연승 위험 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Trophy size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[#0F172A]">연승 위험 알림</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">연속 기록이 끊길 위기일 때 알려드려요</div>
            </div>
            <Toggle on={items.streak} onChange={() => toggle('streak')} />
          </div>
        </Card>

        {/* 랭킹 변동 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Star size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[#0F172A]">랭킹 변동 알림</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">내 연승 랭킹이 변동되면 알려드려요</div>
            </div>
            <Toggle on={items.rank} onChange={() => toggle('rank')} />
          </div>
        </Card>

        {/* 이벤트/공지 알림 */}
        <Card style={{ opacity: masterOn ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div className="flex items-center gap-3.5 p-3.5 px-5">
            <div className="w-9 h-9 rounded-[10px] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Megaphone size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#0F172A]">이벤트 / 공지 알림</span>
                <span className="text-[10px] text-[#94A3B8] bg-[#F8FAFC] px-1.5 py-0.5 rounded-md border border-[#E2E8F0]">선택</span>
              </div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">새 이벤트와 공지사항 소식을 알려드려요</div>
            </div>
            <Toggle on={items.event} onChange={() => toggle('event')} />
          </div>
        </Card>
      </div>
      <div className="h-8" />
    </div>
  );
}

// ─── 보안 설정 화면 ──────────────────────────────────────────
function SecurityScreen() {
  const [appLock, setAppLock] = useState(false);
  const [biometric, setBiometric] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <SectionLabel>잠금 설정</SectionLabel>
      <Card>
        <div className="flex items-center p-4 px-5 gap-3.5 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
            <Lock size={18} className="text-[#64748B]" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[#0F172A]">앱 잠금</div>
            <div className="text-[12px] text-[#94A3B8] mt-0.5">앱 실행 시 인증을 요구합니다</div>
          </div>
          <Toggle on={appLock} onChange={setAppLock} />
        </div>
        <div
          className="flex items-center p-4 px-5 gap-3.5 transition-opacity duration-200"
          style={{ opacity: appLock ? 1 : 0.4 }}
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
            <Shield size={18} className="text-[#64748B]" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[#0F172A]">생체 인증</div>
            <div className="text-[12px] text-[#94A3B8] mt-0.5">
              {appLock ? "Face ID 또는 지문으로 잠금 해제" : "앱 잠금을 먼저 켜주세요"}
            </div>
          </div>
          <Toggle on={biometric && appLock} onChange={v => appLock && setBiometric(v)} />
        </div>
      </Card>

      <SectionLabel>로그인 기기</SectionLabel>
      <Card>
        {[
          { device: "iPhone 15 Pro", date: "현재 기기", current: true },
          { device: "Galaxy S24", date: "2026.05.01 마지막 접속", current: false },
        ].map(({ device, date, current }, i, arr) => (
          <div
            key={device}
            className={`flex items-center gap-3.5 p-3.5 px-5 ${i < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              <Lock size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#0F172A]">{device}</span>
                {current && <span className="text-[11px] text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded-md font-semibold">현재</span>}
              </div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">{date}</div>
            </div>
            {!current && (
              <button className="text-[12px] text-[#EF4444] bg-[#FEE2E2] border-none rounded-lg px-2.5 py-1 cursor-pointer font-semibold">
                로그아웃
              </button>
            )}
          </div>
        ))}
      </Card>

      <SectionLabel>최근 로그인 기록</SectionLabel>
      <Card>
        {[
          { date: "2026.05.08 09:12", region: "서울, KR" },
          { date: "2026.05.07 18:34", region: "서울, KR" },
          { date: "2026.05.06 21:05", region: "서울, KR" },
        ].map(({ date, region }, i, arr) => (
          <div
            key={date}
            className={`flex items-center gap-3.5 px-5 py-3 ${i < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
          >
            <div className="flex-1">
              <span className="text-[13px] font-['DM_Mono'] text-[#0F172A]">{date}</span>
            </div>
            <span className="text-[12px] text-[#94A3B8]">{region}</span>
          </div>
        ))}
        <div className="p-2.5 px-5 bg-[#FFFBEB] border-t border-[#E2E8F0]">
          <span className="text-[12px] text-[#F59E0B]">이상한 접속이 보이시나요? 즉시 로그아웃하세요.</span>
        </div>
      </Card>
      <div className="h-10" />
    </div>
  );
}

// ─── 리워드 수령 정보 화면 ───────────────────────────────────
function RewardScreen() {
  const [tab, setTab] = useState<"account" | "kakao">("account");
  const [saved, setSaved] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="px-4 pt-3">
        <Card className="border-l-[3px] border-l-[#2563EB] p-3.5 px-4.5">
          <div className="text-[13px] font-semibold text-[#0F172A]">10연승 달성 전에 미리 등록해두면 즉시 신청 가능해요</div>
          <div className="text-[12px] text-[#94A3B8] mt-1">달성 후 등록도 가능합니다</div>
        </Card>
      </div>

      {/* 탭 */}
      <div className="flex mx-4 mt-4 gap-2">
        {[["account", "계좌이체"], ["kakao", "카카오페이"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as "account" | "kakao")}
            className={`flex-1 h-[42px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${
              tab === key
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="px-4 pt-3">
          {saved ? (
            <Card className="p-4.5 px-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#F0FDF4] border border-[#22C55E] flex items-center justify-center">
                  <Check size={20} className="text-[#22C55E]" />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#0F172A]">국민은행 ****1234</div>
                  <div className="text-[13px] text-[#94A3B8] mt-0.5">홍길동 · 등록 완료</div>
                </div>
                <button
                  onClick={() => setSaved(false)}
                  className="text-[13px] text-[#2563EB] bg-[#DBEAFE] border-none rounded-lg px-3 py-1.5 cursor-pointer font-semibold"
                >
                  수정
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              {[
                { label: "은행 선택", placeholder: "은행을 선택하세요" },
                { label: "계좌번호", placeholder: "- 없이 숫자만 입력" },
                { label: "예금주명", placeholder: "홍길동" },
              ].map(({ label, placeholder }, i, arr) => (
                <div
                  key={label}
                  className={`p-3.5 px-5 ${i < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                >
                  <div className="text-[12px] text-[#94A3B8] mb-1.5 font-semibold">{label}</div>
                  <input
                    placeholder={placeholder}
                    className="w-full h-[44px] border border-[#E2E8F0] rounded-[10px] px-3.5 text-[14px] text-[#0F172A] bg-[#F8FAFC] outline-none"
                  />
                </div>
              ))}
              <div className="p-3.5 px-5">
                <button
                  onClick={() => setSaved(true)}
                  className="w-full h-[48px] rounded-[10px] bg-[#2563EB] text-white border-none text-[15px] font-bold cursor-pointer hover:bg-[#1D4ED8]"
                >
                  저장하기
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "kakao" && (
        <div className="px-4 pt-3">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#FEF08A] flex items-center justify-center text-[20px]">💬</div>
              <div>
                <div className="text-[15px] font-bold text-[#0F172A]">카카오페이 연결</div>
                <div className="text-[12px] text-[#94A3B8]">ho***@kakao.com</div>
              </div>
            </div>
            <button className="w-full h-[48px] rounded-[10px] bg-[#FEE500] text-[#191919] border-none text-[15px] font-bold cursor-pointer">
              이 계정으로 수령하기
            </button>
          </Card>
        </div>
      )}

      {/* 세금 안내 */}
      <div className="mx-4 mt-4">
        <Card className="p-4 px-5">
          <div className="text-[12px] font-bold text-[#64748B] mb-2.5">💡 세금 안내</div>
          <div className="text-[13px] text-[#0F172A] mb-1.5">기타소득세 22% 원천징수 후 지급</div>
          <div className="text-[20px] font-extrabold text-[#2563EB] font-['DM_Mono'] mb-1.5">40만원 → 실수령 312,000원</div>
          <div className="text-[12px] text-[#94A3B8]">연간 84만원 초과 시 종합소득세 신고 대상</div>
          <div className="text-[12px] text-[#2563EB] mt-2 cursor-pointer">국세청 안내 보기 →</div>
        </Card>
      </div>
      <div className="h-10" />
    </div>
  );
}

// ─── 메인 설정 화면 ──────────────────────────────────────────
function MainSettings({ onNavigate }: { onNavigate: (target: string) => void }) {
  const streak = 7;
  const progressPct = (streak / 10) * 100;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      {/* 프로필 카드 */}
      <div className="px-4 pt-4">
        <Card>
          <div className="p-5 px-5 pb-4 flex items-center gap-3.5">
            <div className="w-[52px] h-[52px] rounded-full shrink-0 bg-[#DBEAFE] border-2 border-[#2563EB] flex items-center justify-center">
              <User size={24} className="text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <div className="text-[17px] font-bold text-[#0F172A]">주식고수123</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">최고 연승 기록: 7일 · 2026.03.15 가입</div>
            </div>
            <button
              onClick={() => {}}
              className="flex items-center gap-1 text-[13px] text-[#2563EB] bg-[#DBEAFE] border-none rounded-lg px-3 py-1.5 cursor-pointer font-semibold"
            >
              <Edit2 size={14} className="text-[#2563EB]" />수정
            </button>
          </div>
          {/* 연승 프로그레스 */}
          <div className="px-5 pb-4.5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[12px] text-[#64748B]">현재 연승 {streak}일 · 10연승까지 {10 - streak}일</span>
              <span className="text-[12px] font-bold text-[#2563EB] font-['DM_Mono']">{streak}/10</span>
            </div>
            <div className="h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-[600ms] ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 계정 섹션 */}
      <SectionLabel>계정</SectionLabel>
      <Card>
        <SettingRow
          icon={Bell}
          iconColor="text-[#2563EB]"
          label="알림 설정"
          sub="예측 오픈, 결과 공개, 마감 임박"
          onClick={() => onNavigate("notification")}
        />
        <SettingRow
          icon={Lock}
          iconColor="text-[#64748B]"
          label="보안 설정"
          sub="앱 잠금, 생체인증"
          onClick={() => onNavigate("security")}
        />
        <SettingRow
          icon={User}
          iconColor="text-[#64748B]"
          label="계정 정보"
          sub="ho***@kakao.com"
          onClick={() => onNavigate("account")}
        />
        <SettingRow
          icon={CreditCard}
          iconColor="text-[#22C55E]"
          label="리워드 수령 정보"
          sub="국민은행 ****1234 ✓"
          right={<span className="text-[12px] text-[#22C55E] font-semibold">등록됨</span>}
          onClick={() => onNavigate("reward")}
          last
        />
      </Card>

      {/* 서비스 섹션 */}
      <SectionLabel>서비스</SectionLabel>
      <Card>
        <SettingRow icon={FileText} label="이용약관" onClick={() => {}} />
        <SettingRow icon={Shield} label="개인정보처리방침" onClick={() => {}} />
        <SettingRow icon={HelpCircle} label="자주 묻는 질문" onClick={() => {}} />
        <SettingRow icon={Phone} label="고객센터" sub="평일 10:00~18:00" onClick={() => {}} />
        <SettingRow
          icon={Megaphone}
          label="공지사항"
          right={<div className="w-2 h-2 rounded-full bg-[#EF4444]" />}
          onClick={() => {}}
        />
        <SettingRow icon={Star} label="앱 평가하기" sub="앱스토어 리뷰 남기기" onClick={() => {}} />
        <SettingRow
          icon={Info}
          label="버전 정보"
          right={
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-['DM_Mono'] text-[#94A3B8]">v1.0.0</span>
              <span className="text-[11px] text-[#22C55E] font-semibold bg-[#F0FDF4] px-1.5 py-0.5 rounded-md">최신</span>
            </div>
          }
          last
        />
      </Card>

      {/* 계정 관리 섹션 */}
      <SectionLabel>계정 관리</SectionLabel>
      <Card>
        <SettingRow icon={LogOut} label="로그아웃" onClick={() => onNavigate("logout")} />
        <SettingRow icon={Trash2} label="회원 탈퇴" danger onClick={() => onNavigate("withdraw")} last />
      </Card>

      {/* 하단 */}
      <div className="text-center py-6 pb-10">
        <div className="text-[11px] text-[#94A3B8]">© 2026 Candle. All rights reserved.</div>
        <div className="text-[11px] text-[#CBD5E1] mt-1 font-['DM_Mono']">v1.0.0 (Build 100)</div>
      </div>
    </div>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<"main" | "notification" | "security" | "reward" | "account">("main");
  const [modal, setModal] = useState<"logout" | "withdraw" | null>(null);

  const handleNavigate = (target: string) => {
    if (target === "logout") { setModal("logout"); return; }
    if (target === "withdraw") { setModal("withdraw"); return; }
    setScreen(target as any);
  };

  const screens = {
    main: { title: "설정", component: <MainSettings onNavigate={handleNavigate} /> },
    notification: { title: "알림 설정", component: <NotificationScreen onBack={() => setScreen("main")} /> },
    security: { title: "보안 설정", component: <SecurityScreen /> },
    reward: { title: "리워드 수령 정보", component: <RewardScreen /> },
    account: { title: "계정 정보", component: <div className="flex-1 flex items-center justify-center text-[#94A3B8]">준비 중</div> },
  };

  const current = screens[screen] || screens.main;

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex items-center justify-center font-['Pretendard',_sans-serif]">
      <div className="relative w-full max-w-md h-[100dvh] bg-[#F8FAFC] overflow-hidden flex flex-col text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:rounded-[40px] md:border border-[#E2E8F0]">

        {/* 헤더 */}
        <div className="h-[56px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          {screen !== "main" && (
            <button
              onClick={() => setScreen("main")}
              className="w-9 h-9 flex items-center justify-center border-none bg-transparent cursor-pointer mr-2 rounded-lg hover:bg-slate-50"
            >
              <ChevronLeft size={20} className="text-[#0F172A]" strokeWidth={2} />
            </button>
          )}
          <div className="flex-1 text-[17px] font-bold text-[#0F172A]">{current.title}</div>
          {screen === "main" && (
            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center">
              <User size={16} className="text-[#2563EB]" />
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        {current.component}

        {/* 로그아웃 모달 */}
        {modal === "logout" && (
          <Modal
            title="로그아웃 하시겠어요?"
            desc="로그아웃 후에도 연승 기록은 유지됩니다."
            confirmText="로그아웃"
            confirmColor="#EF4444"
            onConfirm={() => {
              setModal(null);
              navigate('/login');
            }}
            onCancel={() => setModal(null)}
          />
        )}

        {/* 회원 탈퇴 모달 */}
        {modal === "withdraw" && (
          <Modal
            title="정말 탈퇴하시겠어요?"
            desc="탈퇴 시 현재 7일 연승 기록과 모든 예측 기록이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
            confirmText="탈퇴하기"
            confirmColor="#EF4444"
            onConfirm={() => {
              setModal(null);
              navigate('/login');
            }}
            onCancel={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
}
