/// Local input rules, ported from the deployed `js/pages/forms.js`.
library;

/// Phone digits without spaces or hyphens.
String normalizePhone(String value) => value.replaceAll(RegExp(r'[\s-]'), '');

String? phoneError(String value) =>
    RegExp(r'^010\d{8}$').hasMatch(normalizePhone(value)) ? null : '010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.';

String? nameError(String value) {
  final length = value.trim().length;
  return length >= 2 && length <= 40 ? null : '받는 분의 이름을 2자 이상 입력해 주세요.';
}

/// Naver ID for the 10-win reward: checked in this order like the web form.
String? naverIdError(String id, String confirm, {required bool agreed}) {
  final value = id.trim();
  if (value.isEmpty || value.length > 100 || RegExp(r'[\s<>]').hasMatch(value)) {
    return '올바른 네이버 ID를 입력해 주세요.';
  }
  if (confirm.trim() != value) return '두 번 입력한 수령 정보가 일치하지 않아요.';
  if (!agreed) return '필수 동의와 네이버페이 이용 준비 여부를 확인해 주세요.';
  return null;
}

/// Wallet row status (`js/pages/wallet.js`): exchange deductions show the
/// request state, refunds show 환급.
String walletLabel(String code, int amount, Map<int, int?> exchanges) {
  if (code.startsWith('exchange_refund_')) return '환급';
  final match = RegExp(r'^exchange_(\d+)$').firstMatch(code);
  if (match != null) {
    return const {0: '처리 중', 200: '지급 완료', 300: '반려'}[exchanges[int.parse(match.group(1)!)]] ?? '사용';
  }
  return amount >= 0 ? '적립' : '사용';
}
