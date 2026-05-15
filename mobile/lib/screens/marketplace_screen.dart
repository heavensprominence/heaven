import 'package:flutter/material.dart';
import '../services/marketplace_service.dart';
import '../services/auth_service.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});
  @override State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final _service = MarketplaceService();
  List<dynamic> _listings = [];
  bool _loading = true;
  String _lang = 'en';

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    _lang = await AuthService.getSavedLanguage();
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
        ? const Center(child: CircularProgressIndicator(color: AppTheme.gold))
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
                    leading: const Icon(Icons.inventory_2, color: AppTheme.gold),
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
