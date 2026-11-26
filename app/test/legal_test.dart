import 'dart:io';

import 'package:candle/state.dart';
import 'package:candle/ui/legal_sheet.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'fake_backend.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('bundled legal texts match docs/legal', () {
    const sources = {'terms': '../docs/legal/terms-of-service.md', 'privacy': '../docs/legal/privacy-policy.md'};
    for (final MapEntry(:key, value: source) in sources.entries) {
      expect(File(bundledLegal[key]!).readAsStringSync(), File(source).readAsStringSync(),
          reason: 'copy $source to ${bundledLegal[key]}');
    }
  });

  test('release builds hide drafts with blanks or the draft notice', () {
    expect(bundledLegalVisible('제1조 【운영자명】', release: true), isFalse);
    expect(bundledLegalVisible('# 이용약관 (초안)', release: true), isFalse);
    expect(bundledLegalVisible('# 이용약관\n제1조 목적', release: true), isTrue);
    expect(bundledLegalVisible('# 이용약관 (초안) 【 】', release: false), isTrue);
  });

  group('loadLegal', () {
    late FakeBackend backend;
    late AppState state;
    setUp(() async {
      backend = FakeBackend()..seedAccount();
      state = await backend.state();
    });

    test('server text wins', () async {
      backend.json('GET /api/term/terms', {'title': '이용약관', 'content': '서버 본문'});
      final r = await loadLegal(state, 'terms');
      expect(r.content, '서버 본문');
      expect(r.markdown, isNull);
    });

    test('falls back to the bundled draft when the server has none (debug)', () async {
      backend.json('GET /api/term/privacy', {'title': null, 'content': null});
      final r = await loadLegal(state, 'privacy');
      expect(r.content, isNull);
      expect(r.markdown, startsWith('# Candle 개인정보 처리방침'));
    });

    test('uses the bundle when the server fails, otherwise reports the failure', () async {
      backend.handlers['GET /api/term/terms'] = (_) => http.Response('', 500);
      expect((await loadLegal(state, 'terms')).markdown, isNotNull);
      backend.handlers['GET /api/term/age'] = (_) => http.Response('', 500);
      expect(loadLegal(state, 'age'), throwsA(anything));
    });
  });
}
