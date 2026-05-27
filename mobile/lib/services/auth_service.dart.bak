import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService {
  final _storage = const FlutterSecureStorage();
  final _api = ApiClient();
  static const _tokenKey = 'jwt_token';
  static const _langKey = 'hl-lang';

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return false;
    _api.setToken(token);
    return true;
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _api.post('/api/auth/login', body: {
      'email': email, 'password': password,
    });
    if (res['success'] == true && res['token'] != null) {
      await _storage.write(key: _tokenKey, value: res['token']);
      _api.setToken(res['token']);
    }
    return res;
  }

  Future<Map<String, dynamic>> register(String email, String password, String name, {String? referralCode}) async {
    return await _api.post('/api/auth/register', body: {
      'email': email, 'password': password, 'fullName': name,
      if (referralCode != null) 'referralCode': referralCode,
      'source': 'shop',
    });
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    _api.setToken(null);
  }

  Future<Map<String, dynamic>> me() => _api.get('/api/auth/me');

  static Future<String> getSavedLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_langKey) ?? 'en';
  }

  static Future<void> saveLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_langKey, lang);
  }
}
