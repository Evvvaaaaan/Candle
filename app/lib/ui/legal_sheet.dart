import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';

import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

const legalTitles = {
  'age': '만 14세 이상입니다',
  'terms': '서비스 이용약관 동의',
  'privacy': '개인정보 처리방침 동의',
  'reward': '지급 안내 및 개인정보 동의',
};

/// Bundled copies of docs/legal, shown when the server has no text for a key.
const bundledLegal = {'terms': 'assets/legal/terms.md', 'privacy': 'assets/legal/privacy.md'};

/// Drafts keep 【 】 blanks and a "초안" notice until legal review. Release
/// builds never show such a draft; debug builds do, for review.
bool bundledLegalVisible(String text, {bool release = kReleaseMode}) =>
    !release || !(text.contains('【') || text.contains('초안'));

/// Server text (`/api/term/{key}`, managed in the admin page) wins; otherwise
/// the bundled markdown, if it may be shown in this build.
Future<({String? title, String? content, String? markdown})> loadLegal(AppState state, String key) async {
  ({String? title, String? content})? server;
  Object? failure;
  try {
    server = await state.api.term(key);
    if (server.content != null) return (title: server.title, content: server.content, markdown: null);
  } catch (error) {
    failure = error;
  }
  final asset = bundledLegal[key];
  if (asset != null) {
    final text = await rootBundle.loadString(asset);
    if (bundledLegalVisible(text)) return (title: server?.title, content: null, markdown: text);
  }
  if (failure != null) throw failure;
  return (title: server?.title, content: null, markdown: null);
}

Future<void> showLegalSheet(BuildContext context, String key) {
  final future = loadLegal(AppScope.read(context), key);
  return showCandleSheet(
    context,
    (context) => FutureBuilder(
      future: future,
      builder: (context, snap) {
        final data = snap.data;
        final title = data?.title ?? legalTitles[key] ?? '약관';
        final Widget body;
        if (data?.markdown != null) {
          body = MarkdownBody(
            data: data!.markdown!,
            styleSheet: MarkdownStyleSheet(
              p: font(13, height: 21, color: C.textMid),
              listBullet: font(13, height: 21, color: C.textMid),
              h1: font(17, weight: FontWeight.w700, height: 26),
              h2: font(15, weight: FontWeight.w700, height: 24),
              h3: font(14, weight: FontWeight.w700, height: 22),
              tableBody: font(12, height: 18, color: C.textMid),
              tableHead: font(12, weight: FontWeight.w700, height: 18),
              blockquoteDecoration: BoxDecoration(color: C.errorBg, borderRadius: BorderRadius.circular(8)),
            ),
          );
        } else {
          body = Text(
            snap.hasError
                ? '약관을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                : !snap.hasData
                    ? '약관을 불러오는 중입니다.'
                    : data!.content ?? '약관 본문이 아직 등록되지 않았습니다.',
            style: font(13, height: 21, color: C.textMid),
          );
        }
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(title, style: font(18, weight: FontWeight.w700, height: 26)),
          const SizedBox(height: 12),
          Flexible(child: SingleChildScrollView(child: body)),
          const SizedBox(height: 16),
          PrimaryButton('닫기', secondary: true, onPressed: () => Navigator.pop(context)),
        ]);
      },
    ),
  );
}
