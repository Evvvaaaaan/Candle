import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends State<NotificationSettingsScreen> {
  bool _open = true;
  bool _close = true;
  bool _result = true;
  bool _streak = true;
  bool _ranking = false;
  String _openTime = '18:00';

  void _turnOffAll() {
    setState(() {
      _open = false;
      _close = false;
      _result = false;
      _streak = false;
      _ranking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              children: [
                // Header
                Container(
                  color: AppColors.background,
                  height: 56,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios, size: 20),
                        onPressed: () => context.pop(),
                      ),
                      Text('알림 설정', style: AppTextStyles.headlineMedium),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),
                Expanded(
                  child: ListView(
                    children: [
                      // 알림 미리보기
                      _PreviewCard(),
                      const SizedBox(height: 8),
                      // 설정 항목들
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                        child: Column(
                          children: [
                            _NotifItem(
                              icon: Icons.notifications_outlined,
                              iconColor: AppColors.textPrimary,
                              title: '예측 오픈 알림',
                              description: '매일 저녁 6시에 오늘의 예측이 열립니다',
                              value: _open,
                              onChanged: (v) => setState(() => _open = v),
                              extra: _open
                                  ? _OpenTimeSelector(
                                      value: _openTime,
                                      onChanged: (v) => setState(() => _openTime = v),
                                    )
                                  : null,
                            ),
                            const _Divider(),
                            _NotifItem(
                              icon: Icons.warning_amber_outlined,
                              iconColor: AppColors.warning,
                              title: '예측 마감 알림',
                              description: '마감 1시간 전에 알려드려요',
                              value: _close,
                              onChanged: (v) => setState(() => _close = v),
                            ),
                            const _Divider(),
                            _NotifItem(
                              icon: Icons.bar_chart,
                              iconColor: AppColors.primary,
                              title: '결과 공개 알림',
                              description: '장 마감 후 결과가 나오면 알려드려요',
                              value: _result,
                              onChanged: (v) => setState(() => _result = v),
                            ),
                            const _Divider(),
                            _NotifItem(
                              icon: Icons.local_fire_department_outlined,
                              iconColor: AppColors.down,
                              title: '연승 위험 알림',
                              description: '오늘 예측을 안 하면 연승이 끊깁니다',
                              value: _streak,
                              onChanged: (v) => setState(() => _streak = v),
                            ),
                            const _Divider(),
                            _NotifItem(
                              icon: Icons.emoji_events_outlined,
                              iconColor: AppColors.up,
                              title: '랭킹 변동 알림',
                              description: '내 랭킹이 변동되면 알려드려요',
                              value: _ranking,
                              onChanged: (v) => setState(() => _ranking = v),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      // 전체 끄기 버튼
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: OutlinedButton(
                          onPressed: _turnOffAll,
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            side: const BorderSide(color: AppColors.error),
                            foregroundColor: AppColors.error,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            '모든 알림 끄기',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.settings_outlined,
                              size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            '알림을 받으려면 기기 설정에서 허용해주세요',
                            style: AppTextStyles.labelSmall,
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
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
}

class _PreviewCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundSecondary,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('알림 미리보기', style: AppTextStyles.labelSmall),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.candlestick_chart, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Candle',
                            style: AppTextStyles.labelSmall.copyWith(fontWeight: FontWeight.w600),
                          ),
                          Text('지금', style: AppTextStyles.labelSmall),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        '🔥 오늘 예측 마감까지 1시간 남았어요!',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '7연승을 지키세요. 지금 바로 참여하여 리워드에 도전하세요.',
                        style: AppTextStyles.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotifItem extends StatelessWidget {
  const _NotifItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.value,
    required this.onChanged,
    this.extra,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget? extra;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: AppColors.backgroundSecondary,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTextStyles.titleLarge),
                  const SizedBox(height: 2),
                  Text(description, style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
              activeColor: AppColors.up,
            ),
          ],
        ),
        if (extra != null) ...[
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 44),
            child: AnimatedSize(
              duration: const Duration(milliseconds: 200),
              child: extra!,
            ),
          ),
        ],
      ],
    );
  }
}

class _OpenTimeSelector extends StatelessWidget {
  const _OpenTimeSelector({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text('알림 시간', style: AppTextStyles.bodySmall),
          const SizedBox(width: 12),
          DropdownButton<String>(
            value: value,
            isDense: true,
            underline: const SizedBox.shrink(),
            style: AppTextStyles.titleMedium.copyWith(color: AppColors.primary),
            onChanged: (v) => v != null ? onChanged(v) : null,
            items: const ['18:00', '19:00', '20:00']
                .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 16),
      child: Divider(height: 1, color: AppColors.border),
    );
  }
}
