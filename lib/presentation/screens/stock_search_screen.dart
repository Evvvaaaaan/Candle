import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../domain/entities/stock.dart';
import '../bloc/stock/stock_bloc.dart';
import '../widgets/stock_card.dart';

class StockSearchScreen extends StatefulWidget {
  const StockSearchScreen({super.key});

  @override
  State<StockSearchScreen> createState() => _StockSearchScreenState();
}

class _StockSearchScreenState extends State<StockSearchScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(const StockLoadRequested());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    if (query.isEmpty) {
      context.read<StockBloc>().add(const StockSearchCleared());
    } else {
      context.read<StockBloc>().add(StockSearchChanged(query));
    }
  }

  void _clearSearch() {
    _searchController.clear();
    context.read<StockBloc>().add(const StockSearchCleared());
  }

  void _onStockTap(Stock stock) {
    context.push('/prediction', extra: stock);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              children: [
                _Header(
                  controller: _searchController,
                  onSearch: _onSearch,
                  onClear: _clearSearch,
                ),
                const _TopStocksBanner(),
                Expanded(child: _StockList(onTap: _onStockTap)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.controller,
    required this.onSearch,
    required this.onClear,
  });

  final TextEditingController controller;
  final ValueChanged<String> onSearch;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20),
            onPressed: () => context.pop(),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 4),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onSearch,
              autofocus: true,
              style: AppTextStyles.bodyLarge,
              decoration: InputDecoration(
                hintText: '종목명 또는 코드 검색',
                hintStyle: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textTertiary,
                ),
                prefixIcon: const Icon(
                  Icons.search,
                  color: AppColors.textTertiary,
                  size: 20,
                ),
                suffixIcon: ValueListenableBuilder(
                  valueListenable: controller,
                  builder: (_, value, __) => value.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: onClear,
                        )
                      : const SizedBox.shrink(),
                ),
                filled: true,
                fillColor: AppColors.backgroundSecondary,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopStocksBanner extends StatelessWidget {
  const _TopStocksBanner();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StockBloc, StockState>(
      builder: (context, state) {
        if (state is StockLoaded && state.query.isEmpty) {
          return Container(
            color: AppColors.background,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 14,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  '시가총액 상위 20개 종목',
                  style: AppTextStyles.labelSmall,
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }
}

class _StockList extends StatelessWidget {
  const _StockList({required this.onTap});
  final ValueChanged<Stock> onTap;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StockBloc, StockState>(
      builder: (context, state) {
        return switch (state) {
          StockLoading() => _buildSkeletonList(),
          StockLoaded(isSearching: true) =>
            const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          StockLoaded(:final stocks) when stocks.isEmpty =>
            _buildEmptyState(),
          StockLoaded(:final stocks) => _buildList(stocks, onTap),
          StockError(:final message) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: AppColors.down, size: 40),
                  const SizedBox(height: 12),
                  Text(message, style: AppTextStyles.bodyMedium),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.read<StockBloc>().add(
                          const StockLoadRequested(),
                        ),
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
          _ => const SizedBox.shrink(),
        };
      },
    );
  }

  Widget _buildList(List<Stock> stocks, ValueChanged<Stock> onTap) {
    return Container(
      color: AppColors.background,
      child: ListView.separated(
        itemCount: stocks.length,
        separatorBuilder: (_, __) => const Divider(
          height: 1,
          color: AppColors.borderLight,
          indent: 20,
          endIndent: 20,
        ),
        itemBuilder: (_, i) => StockCard(
          stock: stocks[i],
          onTap: () => onTap(stocks[i]),
        ),
      ),
    );
  }

  Widget _buildSkeletonList() {
    return Container(
      color: AppColors.background,
      child: ListView.separated(
        itemCount: 8,
        separatorBuilder: (_, __) => const Divider(
          height: 1,
          color: AppColors.borderLight,
          indent: 20,
          endIndent: 20,
        ),
        itemBuilder: (_, __) => const StockCardSkeleton(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off, size: 48, color: AppColors.textTertiary),
          const SizedBox(height: 16),
          Text(
            '검색 결과가 없습니다',
            style: AppTextStyles.titleMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
