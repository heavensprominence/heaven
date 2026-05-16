import 'package:flutter/material.dart';

class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({super.key});
  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}
class _ListingDetailScreenState extends State<ListingDetailScreen> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('📋 Listing Detail — Coming Soon', style: TextStyle(color: Colors.white70))));
  }
}
