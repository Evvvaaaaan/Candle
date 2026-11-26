import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Stroke icons copied from the web app's inline SVGs (24 viewBox, stroke 1.8).
abstract final class Ic {
  static const home = '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>';
  static const predict = '<path d="M5 20v-4m7 4v-6m7 6v-8"/><path d="m3 11 5-4 4 3 8-7"/><path d="M15 3h5v5"/>';
  static const calendarCheck = '<rect x="4" y="5" width="16" height="16" rx="4"/><path d="M8 3v4m8-4v4M8 14l3 3 5-6"/>';
  static const bag = '<path d="M4 9h16l-1 12H5L4 9Z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>';
  static const person = '<circle cx="12" cy="8" r="4"/><path d="M4.5 21v-1a7.5 7.5 0 0 1 15 0v1"/>';
  static const check = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';
  static const gift = '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>';
  static const coin = '<circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>';
  static const chevron = '<path d="m9 5 7 7-7 7"/>';
  static const ticket = '<path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Z"/><path d="M15 8v3m0 2v2m0 2v1"/>';
  static const inbox = '<path d="m3 13 3-8h12l3 8v7H3v-7Zm0 0h5l2 3h4l2-3h5"/>';
  static const bookmark = '<path d="M6 4h12v17l-6-4-6 4V4Z"/>';
  static const gear = '<circle cx="12" cy="12" r="3"/><path d="M10.19 5.24 10.35 2.64 13.65 2.64 13.81 5.24 15.5 5.94 17.45 4.22 19.78 6.55 18.06 8.5 18.76 10.19 21.36 10.35 21.36 13.65 18.76 13.81 18.06 15.5 19.78 17.45 17.45 19.78 15.5 18.06 13.81 18.76 13.65 21.36 10.35 21.36 10.19 18.76 8.5 18.06 6.55 19.78 4.22 17.45 5.94 15.5 5.24 13.81 2.64 13.65 2.64 10.35 5.24 10.19 5.94 8.5 4.22 6.55 6.55 4.22 8.5 5.94 10.19 5.24Z"/>';
  static const wallet = '<path d="M20 8V5a2 2 0 0 0-2-2L5 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1 0-4"/><path d="M20 12h-5v5h5"/><path d="M16 14.5h.01"/>';
  static const circleCheck = '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>';
  static const document = '<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6"/>';
  static const help = '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>';
  static const logout = '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>';
  static const back = '<path d="m15 5-7 7 7 7"/>';
  static const clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
  static const alert = '<path d="M12 5v9m0 5h.01"/>';
  static const earned = '<path d="M18 6 6 18m0-8v8h8"/>';
  static const spent = '<path d="M6 18 18 6m-8 0h8v8"/>';
  static const up = '<path d="M7 17 17 7m-8 0h8v8"/>';
  static const down = '<path d="M7 7l10 10m0-8v8H9"/>';
  static const play = '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>';
  static const trophy = '<path d="M8 4h8v6a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 14v4m-4 3h8"/>';
  static const close = '<path d="M6 6l12 12M18 6 6 18"/>';
}

class CandleIcon extends StatelessWidget {
  const CandleIcon(this.body, {super.key, this.size = 24, this.color, this.stroke = 1.8});
  final String body;
  final double size;
  final Color? color;
  final double stroke;

  @override
  Widget build(BuildContext context) {
    final c = color ?? DefaultTextStyle.of(context).style.color ?? const Color(0xFF0F172A);
    final hex = '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';
    return SvgPicture.string(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="$hex" '
      'stroke-opacity="${c.a}" stroke-width="$stroke" stroke-linecap="round" stroke-linejoin="round">$body</svg>',
      width: size,
      height: size,
      excludeFromSemantics: true,
    );
  }
}
