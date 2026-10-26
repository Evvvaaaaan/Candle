import { ApiError } from './api-client.mjs';

export const rewardStatuses = {
  NOT_ELIGIBLE: ['아직 수령 대상이 아니에요', '10연승에 도전하고 추첨 결과를 확인해 주세요.'],
  AWAITING_DRAW: [
    '10연승 달성을 축하해요',
    '추첨 결과를 기다리고 있어요. 당첨되면 수령 정보를 입력할 수 있어요.',
  ],
  ELIGIBLE: ['100만원 리워드 당첨', '축하해요! 네이버페이로 받을 정보를 확인해 주세요.'],
  REQUESTED: [
    '수령 신청을 접수했어요',
    '수령 정보를 확인한 뒤 지급을 진행합니다. 아직 지급 완료 상태는 아니에요.',
  ],
  PROCESSING: ['리워드를 지급 중이에요', '지급 결과가 확인되면 이 화면에서 안내해 드릴게요.'],
  PAID: ['리워드 지급이 완료됐어요', '네이버페이 적립 내역 또는 수신한 쿠폰을 확인해 주세요.'],
  REJECTED: ['수령 정보를 확인해 주세요', '아래 안내를 확인해 주세요.'],
  EXPIRED: ['수령 신청 기간이 지났어요', '아래 지급 안내를 확인해 주세요.'],
};

export function validateChallengeReward(reward) {
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  const nullable = (value) => value === null || text(value);
  if (
    !reward ||
    !Object.hasOwn(rewardStatuses, reward.status) ||
    !['NAVER_ID', 'COUPON_SMS'].includes(reward.method) ||
    reward.amount !== 1000000 ||
    !Number.isSafeInteger(reward.payoutPoints) ||
    reward.payoutPoints <= 0 ||
    reward.payoutPoints > reward.amount ||
    !nullable(reward.awardId) ||
    !nullable(reward.claimId) ||
    !Number.isFinite(Date.parse(reward.serverTime)) ||
    !(reward.claimDeadline === null || Number.isFinite(Date.parse(reward.claimDeadline))) ||
    !['taxNotice', 'deliveryNotice', 'statusNote'].every((k) => text(reward[k])) ||
    !Array.isArray(reward.agreements) ||
    !reward.agreements.every(
      (a) =>
        ['collection', 'provision'].includes(a.id) && ['title', 'version', 'body'].every((k) => text(a[k]))
    ) ||
    new Set(reward.agreements.map((a) => a.id)).size !== reward.agreements.length ||
    (reward.status === 'ELIGIBLE' &&
      (!text(reward.awardId) ||
        !reward.claimDeadline ||
        !reward.agreements.some((a) => a.id === 'collection') ||
        (reward.method === 'NAVER_ID' && !reward.agreements.some((a) => a.id === 'provision')))) ||
    (['REQUESTED', 'PROCESSING', 'PAID'].includes(reward.status) && !text(reward.claimId))
  )
    throw new ApiError('INVALID_RESPONSE');
  return reward;
}

export function recipientValue(method, value) {
  return method === 'COUPON_SMS' ? value.replace(/[\s-]/g, '') : value.trim();
}

export function validRecipient(method, value) {
  const normalized = recipientValue(method, value);
  // Only basic input hygiene here; the provider/server validates account existence and ownership.
  return method === 'COUPON_SMS'
    ? /^010\d{8}$/.test(normalized)
    : normalized.length > 0 && normalized.length <= 100 && !/[\s<>]/.test(normalized);
}
