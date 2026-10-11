export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function createApiClient({ baseUrl = '/api/v1', timeoutMs = 12000, fetcher = globalThis.fetch } = {}) {
  let csrfToken = null;
  return {
    setCsrfToken(token) {
      csrfToken = token;
    },
    async request(path, { method = 'GET', body, key } = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (key) headers['Idempotency-Key'] = key;
      if (method !== 'GET') {
        if (!csrfToken) {
          clearTimeout(timer);
          throw new ApiError('SESSION_EXPIRED', 401);
        }
        headers['X-CSRF-Token'] = csrfToken;
      }
      try {
        const response = await fetcher(baseUrl.replace(/\/$/, '') + path, {
          method,
          headers,
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        let payload = null;
        if (response.status !== 204) {
          const text = await response.text();
          try {
            payload = text ? JSON.parse(text) : null;
          } catch {
            throw new ApiError(response.ok ? 'INVALID_RESPONSE' : 'SERVER_ERROR', response.status);
          }
        }
        if (!response.ok || payload?.success === false) {
          const code = response.status === 401 ? 'SESSION_EXPIRED' : payload?.error?.code || 'SERVER_ERROR';
          throw new ApiError(code, response.status);
        }
        return payload?.success === true ? payload.data : payload;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const errorMessage = (error) =>
  ({
    SESSION_EXPIRED: '로그인이 만료되었어요. 다시 로그인해 주세요.',
    NETWORK_ERROR: '서버에 연결하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.',
    TIMEOUT: '응답을 기다리는 시간이 길어졌어요. 처리 여부를 확인한 뒤 다시 시도해 주세요.',
    PREDICTION_CLOSED: '예측 참여가 마감되었어요. 다음 회차에 참여해 주세요.',
    ALREADY_PREDICTED: '이미 예측한 종목이에요. 최신 내역을 확인해 주세요.',
    INSUFFICIENT_TICKETS: '사용할 예측권이 없어요.',
    INSUFFICIENT_POINTS: '포인트가 부족해요. 최신 잔액을 확인해 주세요.',
    ALREADY_CLAIMED: '이미 수령한 보상이에요. 최신 내역을 확인해 주세요.',
    AD_NOT_VERIFIED: '광고 시청 확인이 아직 끝나지 않았어요. 잠시 후 다시 확인해 주세요.',
    AD_UNAVAILABLE: '현재 참여 가능한 광고가 없어요. 나중에 다시 시도해 주세요.',
    AGREEMENT_REQUIRED: '필수 약관을 모두 확인하고 동의해 주세요.',
    INVALID_RESPONSE: '서비스 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
    STORAGE_UNAVAILABLE: '데모 기록을 저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요.',
    VALIDATION_ERROR: '입력한 정보를 확인해 주세요.',
    RATE_LIMITED: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    IDEMPOTENCY_CONFLICT: '이전에 보낸 요청과 정보가 달라요. 기존 처리 내역을 먼저 확인해 주세요.',
  })[error?.code] || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
