import 'package:flutter/material.dart';

import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

const legalTitles = {
  'age': '만 14세 이상입니다',
  'terms': '서비스 이용약관 동의',
  'privacy': '개인정보 처리방침 동의',
  'reward': '지급 안내 및 개인정보 동의',
};

/// Term text from `/api/term/{key}` (registered in the admin page).
Future<void> showLegalSheet(BuildContext context, String key) {
  final api = AppScope.read(context).api;
  final future = api.term(key);
  return showCandleSheet(
    context,
    (context) => FutureBuilder(
      future: future,
      builder: (context, snap) {
        final title = snap.data?.title ?? legalTitles[key] ?? '약관';
        final body = snap.hasError
            ? '약관을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
            : !snap.hasData
                ? '약관을 불러오는 중입니다.'
                : snap.data!.content ?? '약관 본문이 아직 등록되지 않았습니다.';
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(title, style: font(18, weight: FontWeight.w700, height: 26)),
          const SizedBox(height: 12),
          Flexible(child: SingleChildScrollView(child: Text(body, style: font(13, height: 21, color: C.textMid)))),
          const SizedBox(height: 16),
          PrimaryButton('닫기', secondary: true, onPressed: () => Navigator.pop(context)),
        ]);
      },
    ),
  );
}
