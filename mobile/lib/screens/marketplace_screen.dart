import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/marketplace_service.dart';
import '../services/auth_service.dart';
import '../services/powersync_service.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});
  @override State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final _service = MarketplaceService();
  final _ps = PowerSyncService();
  List<dynamic> _listings = [];
  bool _loading = true;
  String _lang = 'en';

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    _lang = await AuthService.getSavedLanguage();

    // Try PowerSync local data first
    if (_ps.isInitialized) {
      try {
        final local = await _ps.getListings();
        if (local.isNotEmpty) {
          setState(() { _listings = local; _loading = false; });
          return;
        }
      } catch (_) {}
    }

    // Fallback to REST API
    try {
      final data = await _service.getListings(lang: _lang != 'en' ? _lang : null);
      setState(() { _listings = data['listings'] ?? []; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HeavensMarket'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(icon: const Icon(Icons.shopping_cart), onPressed: () {
            Navigator.pushNamed(context, '/cart');
          }),
        ],
      ),
      body: _loading
        ? Center(child: CircularProgressIndicator(color: AppTheme.gold))
        : _listings.isEmpty
          ? const Center(child: Text('No listings yet.\nBe the first to post!', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                itemCount: _listings.length,
                itemBuilder: (_, i) {
                  final l = _listings[i];
                  final price = (l['price_cents'] ?? 0) / 100;
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: ListTile(
                      leading: Icon(Icons.inventory_2, color: AppTheme.gold),
                      title: Text(l['title'] ?? '', maxLines: 1),
                      subtitle: Text('${l['location_city'] ?? 'Online'} · \$${price.toStringAsFixed(2)}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.favorite_border),
                        onPressed: () => _service.toggleWishlist(l['id']),
                      ),
                      onTap: () => Navigator.pushNamed(context, '/listing', arguments: l['id']),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
