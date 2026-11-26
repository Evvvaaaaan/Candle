import 'package:candle/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('phone must be 010 + 8 digits after removing spaces and hyphens', () {
    expect(phoneError('010-1234-5678'), isNull);
    expect(phoneError('010 1234 5678'), isNull);
    expect(phoneError('01112345678'), isNotNull);
    expect(phoneError('0101234567'), isNotNull);
    expect(normalizePhone('010-1234 5678'), '01012345678');
  });

  test('name is 2 to 40 characters after trimming', () {
    expect(nameError(' 홍 '), isNotNull);
    expect(nameError('홍길동'), isNull);
    expect(nameError('가' * 41), isNotNull);
  });

  test('naver id rules run in the web order', () {
    expect(naverIdError('', '', agreed: true), '올바른 네이버 ID를 입력해 주세요.');
    expect(naverIdError('a b', 'a b', agreed: true), '올바른 네이버 ID를 입력해 주세요.');
    expect(naverIdError('a<b', 'a<b', agreed: true), '올바른 네이버 ID를 입력해 주세요.');
    expect(naverIdError('candle', 'candel', agreed: true), '두 번 입력한 수령 정보가 일치하지 않아요.');
    expect(naverIdError('candle', ' candle ', agreed: false), '필수 동의와 네이버페이 이용 준비 여부를 확인해 주세요.');
    expect(naverIdError('candle', 'candle', agreed: true), isNull);
  });

  test('wallet labels follow the exchange state', () {
    final ex = {31: 0, 32: 200, 33: 300};
    expect(walletLabel('exchange_31', -5000, ex), '처리 중');
    expect(walletLabel('exchange_32', -5000, ex), '지급 완료');
    expect(walletLabel('exchange_33', -5000, ex), '반려');
    expect(walletLabel('exchange_99', -5000, ex), '사용');
    expect(walletLabel('exchange_refund_33', 5000, ex), '환급');
    expect(walletLabel('attend', 10, ex), '적립');
    expect(walletLabel('', -10, ex), '사용');
  });
}
