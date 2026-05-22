import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/auth_service.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});
  @override State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      final resp = await http.get(
        Uri.parse('https://heavenslive.com/api/shop/wishlist'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        setState(() { _items = List<Map<String, dynamic>>.from(data['items'] ?? []); _loading = false; });
      }
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _remove(String id) async {
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      await http.delete(Uri.parse('https://heavenslive.com/api/shop/wishlist/$id'),
        headers: {'Authorization': 'Bearer $token'});
      _load();
    } catch (e) { /* ignore */ }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist'), backgroundColor: const Color(0xFF0F0F1A), foregroundColor: const Color(0xFFC8A951)),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFC8A951)))
        : _items.isEmpty
          ? const Center(child: Text('No saved items', style: TextStyle(color: Colors.grey)))
          : ListView.builder(
              itemCount: _items.length,
              itemBuilder: (ctx, i) {
                final item = _items[i];
                final listing = item['listing'] ?? {};
                return Card(
                  color: const Color(0xFF16213E),
                  child: ListTile(
                    leading: listing['images'] != null && (listing['images'] as List).isNotEmpty
                      ? ClipRRect(borderRadius: BorderRadius.circular(6), child: Image.network(listing['images'][0], width: 50, height: 50, fit: BoxFit.cover))
                      : const Icon(Icons.image, color: Colors.grey),
                    title: Text(listing['title'] ?? '', style: const TextStyle(color: Colors.white), maxLines: 1),
                    subtitle: Text('\$${((listing['price_cents'] ?? 0) / 100).toStringAsFixed(2)}',
                      style: const TextStyle(color: Color(0xFFC8A951))),
                    trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _remove(item['id'])),
                    onTap: () => Navigator.pushNamed(context, '/listing', arguments: listing['id']),
                  ),
                );
              },
            ),
    );
  }
}
