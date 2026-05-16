import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/marketplace_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/listing_detail_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/affiliate_screen.dart';
import 'screens/store_screen.dart';
import 'services/auth_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HeavensLiveApp());
}

class HeavensLiveApp extends StatefulWidget {
  const HeavensLiveApp({super.key});
  @override State<HeavensLiveApp> createState() => _HeavensLiveAppState();
}

class _HeavensLiveAppState extends State<HeavensLiveApp> {
  final AuthService _auth = AuthService();
  bool _isLoggedIn = false;

  @override void initState() { super.initState(); _checkAuth(); }
  Future<void> _checkAuth() async {
    final loggedIn = await _auth.isLoggedIn();
    setState(() => _isLoggedIn = loggedIn);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HeavensLive',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: _isLoggedIn ? const MainShell() : const LoginScreen(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/marketplace': (_) => const MarketplaceScreen(),
        '/wallet': (_) => const WalletScreen(),
        '/cart': (_) => const CartScreen(),
        '/profile': (_) => const ProfileScreen(),
        '/settings': (_) => const SettingsScreen(),
        '/affiliate': (_) => const AffiliateScreen(),
      },
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  final _screens = const [
    MarketplaceScreen(), WalletScreen(), CartScreen(), ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        selectedItemColor: const Color(0xFFC8A951),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.store), label: 'Shop'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'Credon'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'Cart'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
