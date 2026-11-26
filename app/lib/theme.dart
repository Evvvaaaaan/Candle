import 'package:flutter/material.dart';

/// Design tokens from reference/web/css/style.css `:root`.
abstract final class C {
  static const primary = Color(0xFF2563EB);
  static const primaryLight = Color(0xFFDBEAFE);
  static const textDark = Color(0xFF0F172A);
  static const textMid = Color(0xFF64748B);
  static const textLight = Color(0xFF94A3B8);
  static const border = Color(0xFFE2E8F0);
  static const borderMid = Color(0xFFCBD5E1);
  static const surface = Colors.white;
  static const surfaceSubtle = Color(0xFFF1F5F9);
  static const screen = Color(0xFFF8FAFC);
  static const brand = Color(0xFF001848);
  static const iconTile = Color(0xFFEFF5FF);
  // Candle shows up in green and down in red.
  static const up = Color(0xFF168358);
  static const upBg = Color(0xFFE6F6EF);
  static const upBorder = Color(0xFF9FD8BF);
  static const down = Color(0xFFDC2626);
  static const downBg = Color(0xFFFEF2F2);
  static const downBorder = Color(0xFFF5B5B5);
  static const warning = Color(0xFFF59E0B);
  static const amber = Color(0xFF9A6700);
  static const amberBg = Color(0xFFFFF8E8);
  static const errorBg = Color(0xFFFFF1F2);
  static const errorBorder = Color(0xFFFECACA);
  static const errorText = Color(0xFF991B1B);
  static const formError = Color(0xFFB91C1C);
  static const disabled = Color(0xFFCECECE);
  static const kakao = Color(0xFFFEE500);
  static const naver = Color(0xFF03C75A);
}

const _family = 'NotoSansKR';

/// Noto Sans KR ships as a variable font, so weight is set on the `wght` axis too.
TextStyle font(
  double size, {
  FontWeight weight = FontWeight.w400,
  double? height,
  Color color = C.textDark,
  double? spacing,
  String family = _family,
}) =>
    TextStyle(
      fontFamily: family,
      fontSize: size,
      fontWeight: weight,
      fontVariations: [FontVariation('wght', weight.value.toDouble())],
      height: height == null ? null : height / size,
      color: color,
      letterSpacing: spacing == null ? null : spacing * size,
    );

TextStyle mono(double size, {Color color = C.textDark}) =>
    font(size, weight: FontWeight.w500, color: color, family: 'DMMono');

abstract final class T {
  static final heading = font(20, weight: FontWeight.w700, height: 28, spacing: -0.02);
  static final sub = font(14, height: 21, color: C.textMid);
  static final headerTitle = font(17, weight: FontWeight.w600, height: 24);
  static final section = font(16, weight: FontWeight.w700, height: 24);
  static final label = font(11, height: 16, color: C.textMid);
  static final number = font(20, weight: FontWeight.w700, height: 26);
  static final button = font(14, weight: FontWeight.w700, height: 20);
  static final body = font(14, height: 21);
  static final small = font(12, height: 18, color: C.textMid);
}

ThemeData candleTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: C.primary, primary: C.primary, surface: C.screen),
    scaffoldBackgroundColor: C.screen,
    fontFamily: _family,
    splashFactory: InkSparkle.splashFactory,
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(fontFamily: _family, bodyColor: C.textDark, displayColor: C.textDark),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: C.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      hintStyle: font(14, color: C.textLight),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: C.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: C.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: C.primary, width: 1.5)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: C.formError)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: C.formError, width: 1.5)),
    ),
    checkboxTheme: CheckboxThemeData(
      shape: const CircleBorder(),
      side: const BorderSide(color: C.borderMid, width: 1.5),
      fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? C.primary : C.surface),
    ),
  );
}
