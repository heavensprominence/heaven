import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../config/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _auth = AuthService();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _loading = false;

  Future<void> _login() async {
    setState(() => _loading = true);
    final res = await _auth.login(_email.text.trim(), _pass.text);
    if (mounted) {
      if (res['success'] == true) {
        Navigator.pushReplacementNamed(context, '/marketplace');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['error'] ?? 'Login failed')),
        );
      }
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('HeavensLive', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.gold)),
              const SizedBox(height: 8),
              const Text('Divinely Underwritten Commerce', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email', hintText: 'you@email.com')),
              const SizedBox(height: 12),
              TextField(controller: _pass, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  child: Text(_loading ? 'Signing in...' : 'Sign In'),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                child: const Text('Create Account', style: TextStyle(color: AppTheme.gold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override void dispose() { _email.dispose(); _pass.dispose(); super.dispose(); }
}
