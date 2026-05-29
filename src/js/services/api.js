/**
 * API 설정 — 백엔드 연결 시 이 파일만 수정
 *
 * 1. USE_MOCK = false 로 변경
 * 2. BASE_URL 을 Spring Boot 서버 주소로 변경
 * 3. getToken() 에 실제 JWT 토큰 반환 로직 추가
 */

const API_CONFIG = {
  USE_MOCK: true,
  BASE_URL: 'http://localhost:8080/api',   // Spring Boot
  MOCK_DELAY: 500,
};

async function apiRequest(method, path, body = null) {
  const token = Storage.get('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

const api = {
  get:    (path)         => apiRequest('GET', path),
  post:   (path, body)   => apiRequest('POST', path, body),
  put:    (path, body)   => apiRequest('PUT', path, body),
  delete: (path)         => apiRequest('DELETE', path),
  mock:   (data, delay = API_CONFIG.MOCK_DELAY) =>
    new Promise(resolve => setTimeout(() => resolve(data), delay)),
};
