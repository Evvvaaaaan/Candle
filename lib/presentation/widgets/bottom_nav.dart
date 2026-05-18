import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.currentIndex});

  final int currentIndex;

  // 0=홈, 1=랭킹, (FAB=예측), 2=포인트, 3=마이
  static const _routes = ['/home', '/ranking', '/point-store', '/my-page'];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            children: [
              _NavItem(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: '홈',
                isActive: currentIndex == 0,
                onTap: () => _navigate(context, 0),
              ),
              _NavItem(
                icon: Icons.emoji_events_outlined,
                activeIcon: Icons.emoji_events,
                label: '랭킹',
                isActive: currentIndex == 1,
                onTap: () => _navigate(context, 1),
              ),
              // 중앙 예측 FAB
              Expanded(
                child: Center(
                  child: GestureDetector(
                    onTap: () => context.push('/stock-search'),
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.adjust, color: Colors.white, size: 22),
                          const SizedBox(height: 2),
                          const Text(
                            '예측',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              height: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              _NavItem(
                icon: Icons.monetization_on_outlined,
                activeIcon: Icons.monetization_on,
                label: '포인트',
                isActive: currentIndex == 2,
                onTap: () => _navigate(context, 2),
              ),
              _NavItem(
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: '마이',
                isActive: currentIndex == 3,
                onTap: () => _navigate(context, 3),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigate(BuildContext context, int index) {
    if (currentIndex != index) {
      context.go(_routes[index]);
    }
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.primary : AppColors.textTertiary;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(isActive ? activeIcon : icon, color: color, size: 22),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
