import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;
  ApiClient._();

  String? _token;

  void setToken(String? token) => _token = token;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? params}) async {
    var uri = Uri.parse('${ApiConfig.url}$path');
    if (params != null) uri = uri.replace(queryParameters: params);
    final res = await http.get(uri, headers: _headers);
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body}) async {
    final res = await http.put(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final res = await http.delete(Uri.parse('${ApiConfig.url}$path'), headers: _headers);
    return jsonDecode(res.body);
  }
}
