import 'package:flutter/material.dart';

class AffiliateScreen extends StatefulWidget {
  const AffiliateScreen({super.key});
  @override
  State<AffiliateScreen> createState() => _AffiliateScreenState();
}
class _AffiliateScreenState extends State<AffiliateScreen> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('🤝 Affiliate — Coming Soon', style: TextStyle(color: Colors.white70))));
  }
}
