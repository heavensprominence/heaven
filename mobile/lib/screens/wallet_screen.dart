import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}
class _WalletScreenState extends State<WalletScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('HeavensLive'), backgroundColor: const Color(0xFFC8A951), foregroundColor: const Color(0xFF0F0F1A)),
      body: const Center(child: Text('HeavensLive Mobile', style: TextStyle(color: Color(0xFFC8A951), fontSize: 24))),
    );
  }
}
