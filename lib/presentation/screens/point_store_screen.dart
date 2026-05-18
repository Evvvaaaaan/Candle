import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/bottom_nav.dart';

class PointStoreScreen extends StatefulWidget {
  const PointStoreScreen({super.key});

  @override
  State<PointStoreScreen> createState() => _PointStoreScreenState();
}

class _PointStoreScreenState extends State<PointStoreScreen> {
  // Mock: Spring Boot 연동 시 BlocBuilder로 교체
  static const int _userPoints = 127500;

  String? _selectedOptionId;
  bool _showConfirmModal = false;

  static const _kExchangeOptions = [
    _ExchangeOption(id: '1', points: 10000, cash: 10000),
    _ExchangeOption(id: '2', points: 50000, cash: 50000, badge: '인기', isPopular: true),
    _ExchangeOption(id: '3', points: 100000, cash: 100000),
    _ExchangeOption(id: '4', points: 400000, cash: 400000, badge: '10연승 보상'),
  ];

  static const _history = [
    _PointHistory(type: 'use', points: 50000, description: '네이버페이 교환', date: '2026-05-14', status: 'completed'),
    _PointHistory(type: 'earn', points: 100, description: '삼성전자 예측 성공', date: '2026-05-13'),
    _PointHistory(type: 'earn', points: 500, description: '5연승 보너스', date: '2026-05-13'),
    _PointHistory(type: 'earn', points: 100, description: 'SK하이닉스 예측 성공', date: '2026-05-12'),
    _PointHistory(type: 'use', points: 10000, description: '네이버페이 교환', date: '2026-05-10', status: 'pending'),
    _PointHistory(type: 'earn', points: 100, description: 'NAVER 예측 성공', date: '2026-05-09'),
  ];

  _ExchangeOption? get _selectedOption =>
      _kExchangeOptions.where((o) => o.id == _selectedOptionId).firstOrNull;

  void _handleExchange(_ExchangeOption option) {
    if (_userPoints < option.points) return;
    setState(() {
      _selectedOptionId = option.id;
      _showConfirmModal = true;
    });
  }

  void _confirmExchange() {
    setState(() => _showConfirmModal = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('교환 신청이 완료되었습니다! 네이버페이로 지급됩니다.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Stack(
              children: [
                Column(
                  children: [
                    _header(context),
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.only(bottom: 20),
                        children: [
                          _pointBalanceCard(),
                          _exchangeNotice(),
                          _buildExchangeOptions(),
                          _historySection(),
                          _earnGuide(),
                        ],
                      ),
                    ),
                    const BottomNav(currentIndex: 2),
                  ],
                ),
                if (_showConfirmModal) _confirmModalOverlay(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Container(
      color: AppColors.background,
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20),
            onPressed: () => context.pop(),
          ),
          Text('포인트 스토어', style: AppTextStyles.headlineMedium),
        ],
      ),
    );
  }

  Widget _pointBalanceCard() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.monetization_on, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text(
                  '내 포인트',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  _userPoints.toStringWithComma(),
                  style: const TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    fontFamily: 'Courier',
                    height: 1,
                  ),
                ),
                const SizedBox(width: 4),
                const Text(
                  'P',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Colors.white24, height: 1),
            const SizedBox(height: 16),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '10연승 달성 시 400,000P 지급',
                  style: TextStyle(fontSize: 13, color: Colors.white70),
                ),
                Icon(Icons.card_giftcard, color: Colors.white70, size: 18),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _exchangeNotice() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          border: Border.all(color: AppColors.warning),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary),
                  children: const [
                    TextSpan(text: '포인트는 '),
                    TextSpan(
                      text: '네이버페이',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(text: '로 교환할 수 있습니다. 교환 신청 후 '),
                    TextSpan(
                      text: '1-3 영업일',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(text: ' 내 지급됩니다.'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExchangeOptions() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('교환 가능 금액', style: AppTextStyles.titleLarge),
              Text(
                '1P = 1원',
                style: AppTextStyles.labelSmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._kExchangeOptions.map((option) => _exchangeCard(option)),
        ],
      ),
    );
  }

  Widget _exchangeCard(_ExchangeOption option) {
    final canExchange = _userPoints >= option.points;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: canExchange ? () => _handleExchange(option) : null,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: option.isPopular ? AppColors.primary : AppColors.border,
              width: option.isPopular ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Opacity(
            opacity: canExchange ? 1.0 : 0.5,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (option.badge != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: option.isPopular ? AppColors.primary : AppColors.warning,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              option.badge!,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            option.points.toStringWithComma(),
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Courier',
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Text(
                            'P',
                            style: AppTextStyles.bodyMedium
                                .copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.arrow_forward, size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text('네이버페이로 교환', style: AppTextStyles.bodySmall),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            option.cash.toStringWithComma(),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: AppColors.up,
                              fontFamily: 'Courier',
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '원',
                            style: AppTextStyles.bodyMedium
                                .copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      if (!canExchange) ...[
                        const SizedBox(height: 8),
                        const Divider(height: 1, color: AppColors.border),
                        const SizedBox(height: 8),
                        Text(
                          '${(option.points - _userPoints).toStringWithComma()}P 더 필요합니다',
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: canExchange ? AppColors.primary : AppColors.backgroundTertiary,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: canExchange
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.arrow_forward,
                        color: canExchange ? Colors.white : AppColors.textTertiary,
                        size: 22,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        canExchange ? '교환' : '부족',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: canExchange ? Colors.white : AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _historySection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('이용내역', style: AppTextStyles.titleLarge),
              TextButton(
                onPressed: () {},
                child: Text(
                  '전체보기',
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.background,
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: _history.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                return _historyItem(item, isLast: i == _history.length - 1);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _historyItem(_PointHistory item, {required bool isLast}) {
    final isEarn = item.type == 'earn';
    final pointColor = isEarn ? AppColors.up : AppColors.down;
    final sign = isEarn ? '+' : '-';

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isEarn ? AppColors.upLight : AppColors.downLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isEarn ? Icons.trending_up : Icons.trending_down,
                  color: pointColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.description, style: AppTextStyles.titleMedium),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 12, color: AppColors.textTertiary),
                        const SizedBox(width: 4),
                        Text(item.date, style: AppTextStyles.labelSmall),
                        if (item.status != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: item.status == 'completed'
                                  ? AppColors.upLight
                                  : const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item.status == 'completed' ? '완료' : '처리중',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: item.status == 'completed'
                                    ? AppColors.up
                                    : AppColors.warning,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                '$sign${item.points.toStringWithComma()}P',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: pointColor,
                  fontFamily: 'Courier',
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          const Divider(height: 1, color: AppColors.borderLight, indent: 16, endIndent: 16),
      ],
    );
  }

  Widget _earnGuide() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('포인트 적립 방법', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            _earnItem('예측 성공 시 100P 지급'),
            _earnItem('연속 성공 보너스 최대 500P'),
            _earnItem('10연승 달성 시 400,000P 지급'),
          ],
        ),
      ),
    );
  }

  Widget _earnItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, size: 16, color: AppColors.up),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: AppTextStyles.bodySmall),
          ),
        ],
      ),
    );
  }

  Widget _confirmModalOverlay() {
    final option = _selectedOption;
    if (option == null) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => setState(() => _showConfirmModal = false),
      child: Container(
        color: Colors.black54,
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Text('교환 확인', style: AppTextStyles.headlineLarge),
                  const SizedBox(height: 8),
                  Text(
                    '네이버페이로 현금 교환을 진행하시겠습니까?',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('사용 포인트', style: AppTextStyles.bodySmall),
                            Text(
                              '${option.points.toStringWithComma()}P',
                              style: AppTextStyles.titleLarge,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('지급 금액', style: AppTextStyles.bodySmall),
                            Text(
                              '${option.cash.toStringWithComma()}원',
                              style: AppTextStyles.titleLarge.copyWith(color: AppColors.up),
                            ),
                          ],
                        ),
                        const Divider(height: 20, color: AppColors.border),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('교환 후 잔액', style: AppTextStyles.labelSmall),
                            Text(
                              '${(_userPoints - option.points).toStringWithComma()}P',
                              style: AppTextStyles.labelSmall.copyWith(
                                color: AppColors.textPrimary,
                                fontFamily: 'Courier',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _showConfirmModal = false),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text('취소', style: AppTextStyles.titleMedium),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _confirmExchange,
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            '교환하기',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ExchangeOption {
  const _ExchangeOption({
    required this.id,
    required this.points,
    required this.cash,
    this.badge,
    this.isPopular = false,
  });
  final String id;
  final int points;
  final int cash;
  final String? badge;
  final bool isPopular;
}

class _PointHistory {
  const _PointHistory({
    required this.type,
    required this.points,
    required this.description,
    required this.date,
    this.status,
  });
  final String type;
  final int points;
  final String description;
  final String date;
  final String? status;
}

extension _IntComma on int {
  String toStringWithComma() {
    final s = toString();
    final result = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) result.write(',');
      result.write(s[i]);
    }
    return result.toString();
  }
}
