class ApiConfig {
  static const String baseUrl = 'https://heavenslive.com';
  static const String localUrl = 'http://10.0.0.225:5000';
  static String get url => const bool.fromEnvironment('production') ? baseUrl : localUrl;
  static const String auth = '/api/auth';
  static const String wallet = '/api/wallet';
  static const String shop = '/api/shop';
  static const String landing = '/api/landing';
}
