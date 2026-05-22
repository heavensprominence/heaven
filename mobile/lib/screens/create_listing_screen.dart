import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/auth_service.dart';

class CreateListingScreen extends StatefulWidget {
  const CreateListingScreen({super.key});
  @override State<CreateListingScreen> createState() => _CreateListingScreenState();
}

class _CreateListingScreenState extends State<CreateListingScreen> {
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _price = TextEditingController();
  final _city = TextEditingController();
  String _type = 'mall';
  String _category = '';
  String _currency = 'USD';
  String _duration = '2weeks';
  bool _featured = false;
  bool _submitting = false;
  List<Map<String, dynamic>> _categories = [];

  @override void initState() { super.initState(); _loadCategories(); }
  @override void dispose() { _title.dispose(); _desc.dispose(); _price.dispose(); _city.dispose(); super.dispose(); }

  Future<void> _loadCategories() async {
    try {
      final resp = await http.get(Uri.parse('https://heavenslive.com/api/shop/categories'));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        setState(() { _categories = List<Map<String, dynamic>>.from(data['categories'] ?? []); });
      }
    } catch (e) { /* ignore */ }
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final token = await AuthService().getToken();
    if (token == null) return;
    setState(() => _submitting = true);
    try {
      final body = {
        'type': _type, 'title': _title.text, 'description': _desc.text,
        'category': _category, 'currency': _currency, 'duration': _duration,
        'price_cents': (double.tryParse(_price.text) ?? 0) * 100,
        'location_city': _city.text, 'location_country': 'US',
        'is_featured': _featured, 'images': [], 'shipping_options': [],
      };
      final resp = await http.post(
        Uri.parse('https://heavenslive.com/api/shop/listings'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode(body),
      );
      if (resp.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Listing posted!'), backgroundColor: Color(0xFF2ECC71)));
        }
        Navigator.pop(context, true);
      } else {
        final err = jsonDecode(resp.body)['error'] ?? 'Failed';
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    }
    setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post Listing'), backgroundColor: const Color(0xFF0F0F1A), foregroundColor: const Color(0xFFC8A951)),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'mall', label: Text('Sell')),
              ButtonSegment(value: 'auction', label: Text('Auction')),
              ButtonSegment(value: 'reverse_auction', label: Text('Wanted')),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: 12),
          TextFormField(controller: _title, style: const TextStyle(color: Colors.white),
            decoration: _inputDeco('Title'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
          const SizedBox(height: 8),
          TextFormField(controller: _desc, maxLines: 4, style: const TextStyle(color: Colors.white),
            decoration: _inputDeco('Description'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: TextFormField(controller: _price, keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white), decoration: _inputDeco('Price'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null)),
            const SizedBox(width: 8),
            SizedBox(width: 100, child: DropdownButtonFormField<String>(value: _currency,
              dropdownColor: const Color(0xFF16213E),
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Currency'),
              items: ['USD','EUR','GBP','BTC','ETH','CAD','JPY'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _currency = v!))),
          ]),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(value: _category.isNotEmpty ? _category : null,
            dropdownColor: const Color(0xFF16213E), style: const TextStyle(color: Colors.white),
            decoration: _inputDeco('Category'),
            hint: const Text('Select category', style: TextStyle(color: Colors.grey)),
            items: _categories.map((c) => DropdownMenuItem<String>(value: c['slug'], child: Text(c['name'] ?? ''))).toList(),
            onChanged: (v) => setState(() => _category = v!)),
          const SizedBox(height: 8),
          TextFormField(controller: _city, style: const TextStyle(color: Colors.white), decoration: _inputDeco('City')),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(value: _duration, dropdownColor: const Color(0xFF16213E),
            style: const TextStyle(color: Colors.white), decoration: _inputDeco('Duration'),
            items: const [
              DropdownMenuItem(value: '1day', child: Text('1 Day')),
              DropdownMenuItem(value: '2weeks', child: Text('2 Weeks')),
              DropdownMenuItem(value: '1year', child: Text('1 Year')),
            ], onChanged: (v) => setState(() => _duration = v!)),
          const SizedBox(height: 12),
          SwitchListTile(title: const Text('🌟 Feature This Listing', style: TextStyle(color: Colors.white)),
            subtitle: const Text('Appears at top of search results', style: TextStyle(color: Colors.grey, fontSize: 12)),
            value: _featured, activeColor: const Color(0xFFC8A951),
            onChanged: (v) => setState(() => _featured = v)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC8A951), foregroundColor: const Color(0xFF0F0F1A),
              padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: Text(_submitting ? 'Posting...' : 'Post Listing', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ]),
      ),
    );
  }

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint, hintStyle: const TextStyle(color: Colors.grey),
    filled: true, fillColor: const Color(0xFF16213E),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
  );
}
