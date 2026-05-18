import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class CandleLogo extends StatelessWidget {
  const CandleLogo({super.key, this.size = 40});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _CandlePainter()),
    );
  }
}

class _CandlePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final candleData = [
      (x: 0.15, height: 0.45, opacity: 0.5),
      (x: 0.40, height: 0.65, opacity: 1.0),
      (x: 0.65, height: 0.50, opacity: 0.7),
    ];

    for (final c in candleData) {
      final paint = Paint()
        ..color = AppColors.primary.withValues(alpha: c.opacity)
        ..style = PaintingStyle.fill;

      final bodyWidth = w * 0.18;
      final bodyHeight = h * c.height * 0.65;
      final bodyTop = h * 0.45;
      final x = w * c.x;

      // candle body (rectangle)
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x, bodyTop, bodyWidth, bodyHeight),
          const Radius.circular(2),
        ),
        paint,
      );

      // wick (line above body)
      final wickPaint = Paint()
        ..color = AppColors.primary.withValues(alpha: c.opacity)
        ..strokeWidth = 1.5
        ..strokeCap = StrokeCap.round;

      final wickX = x + bodyWidth / 2;
      canvas.drawLine(
        Offset(wickX, bodyTop),
        Offset(wickX, bodyTop - h * 0.12),
        wickPaint,
      );

      // flame (small oval on top)
      final flamePaint = Paint()
        ..color = const Color(0xFFFB923C).withValues(alpha: c.opacity)
        ..style = PaintingStyle.fill;

      canvas.drawOval(
        Rect.fromCenter(
          center: Offset(wickX, bodyTop - h * 0.17),
          width: w * 0.08,
          height: h * 0.1,
        ),
        flamePaint,
      );
    }
  }

  @override
  bool shouldRepaint(_CandlePainter oldDelegate) => false;
}

class CandleLogoBrand extends StatelessWidget {
  const CandleLogoBrand({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CandleLogo(size: 32),
        const SizedBox(width: 8),
        Text(
          'Candle',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }
}
