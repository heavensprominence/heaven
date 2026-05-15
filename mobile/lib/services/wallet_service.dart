import 'api_client.dart';

class WalletService {
  final _api = ApiClient();

  Future<Map<String, dynamic>> getBalance() => _api.get('/api/wallet/balance');
  Future<Map<String, dynamic>> getTransactions({int limit = 20}) =>
    _api.get('/api/wallet/transactions', params: {'limit': limit.toString()});
  Future<Map<String, dynamic>> getExchangeRates() => _api.get('/api/wallet/exchange-rates');
  Future<Map<String, dynamic>> send(String toEmail, double amount) =>
    _api.post('/api/wallet/send', body: {'toEmail': toEmail, 'amount': amount});
  Future<Map<String, dynamic>> convert(String from, String to, double amount) =>
    _api.post('/api/wallet/convert', body: {'from': from, 'to': to, 'amount': amount});
  Future<Map<String, dynamic>> getLoans() => _api.get('/api/wallet/loans');
  Future<Map<String, dynamic>> getDenominations(String currency, double amount) =>
    _api.get('/api/wallet/denominations/$currency/$amount');
}
