import 'package:intl/intl.dart';

abstract final class FormatUtils {
  static final _priceFormat = NumberFormat('#,###', 'ko_KR');

  static String price(num value) => '${_priceFormat.format(value)}원';

  static String changeRate(double rate) {
    final sign = rate >= 0 ? '+' : '';
    return '$sign${rate.toStringAsFixed(2)}%';
  }

  static String countdown(Duration duration) {
    final h = duration.inHours.toString().padLeft(2, '0');
    final m = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final s = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  static String shortDate(DateTime date) =>
      DateFormat('M/d').format(date);

  static String fullDate(DateTime date) =>
      DateFormat('yyyy.MM.dd').format(date);
}
