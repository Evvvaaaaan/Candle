import renderSplash from './splash.mjs';
import renderSignup from './signup.mjs';
import renderConsent from './consent.mjs';
import renderHome from './home.mjs';
import renderChallenge from './challenge.mjs';
import renderChallengeReward from './challenge-reward.mjs';
import renderStockSelect from './stock-select.mjs';
import renderPrediction from './prediction.mjs';
import renderConfirm from './confirm.mjs';
import renderSubmitted from './submitted.mjs';
import renderPass from './pass.mjs';
import renderAd from './ad.mjs';
import renderResult from './result.mjs';
import renderMissions from './missions.mjs';
import renderShop from './shop.mjs';
import renderExchange from './exchange.mjs';
import renderHistory from './history.mjs';
import renderProfile from './profile.mjs';
import renderPayout from './payout.mjs';
import renderPredictionHistory from './prediction-history.mjs';
import renderWallet from './wallet.mjs';
import renderSettings from './settings.mjs';
import renderLegal from './legal.mjs';

export const pages = {
  splash: { title: '시작', render: renderSplash },
  signup: { title: '로그인', render: renderSignup },
  consent: { title: '가입 전 확인', render: renderConsent },
  home: { title: '홈', render: renderHome },
  challenge: { title: '10연승 챌린지', render: renderChallenge },
  'challenge-reward': { title: '리워드 수령', render: renderChallengeReward },
  'stock-select': { title: '종목 선택', render: renderStockSelect },
  prediction: { title: '예측', render: renderPrediction },
  confirm: { title: '예측 확인', render: renderConfirm },
  submitted: { title: '접수 완료', render: renderSubmitted },
  pass: { title: '예측권', render: renderPass },
  ad: { title: '광고', render: renderAd },
  result: { title: '결과', render: renderResult },
  missions: { title: '미션', render: renderMissions },
  shop: { title: '포인트 샵', render: renderShop },
  exchange: { title: '교환 확인', render: renderExchange },
  history: { title: '교환 내역', render: renderHistory },
  profile: { title: '내 정보', render: renderProfile },
  payout: { title: '지급 신청', render: renderPayout },
  'prediction-history': { title: '예측 내역', render: renderPredictionHistory },
  wallet: { title: '포인트 내역', render: renderWallet },
  settings: { title: '계정 설정', render: renderSettings },
  legal: { title: '약관 보기', render: renderLegal },
};

export const screens = Object.entries(pages).map(([id, page]) => [id, page.title]);
