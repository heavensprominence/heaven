import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

class WALLET_SCREEN extends StatefulWidget {
  const WALLET_SCREEN({super.key});
  @override
  State<WALLET_SCREEN> createState() => _WALLET_SCREENState();
}
class _WALLET_SCREENState extends State<WALLET_SCREEN> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('HeavensLive'), backgroundColor: const Color(0xFFC8A951), foregroundColor: const Color(0xFF0F0F1A)),
      body: const Center(child: Text('HeavensLive Mobile', style: TextStyle(color: Color(0xFFC8A951), fontSize: 24))),
    );
  }
}
