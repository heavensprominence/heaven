import 'api_client.dart';

class MarketplaceService {
  final _api = ApiClient();

  Future<Map<String, dynamic>> getListings({
    String? q, String? type, String? category, String? sort,
    int page = 1, int limit = 12, String? lang,
  }) async {
    final params = <String, String>{
      'page': page.toString(), 'limit': limit.toString(),
      if (q != null) 'q': q,
      if (type != null) 'type': type,
      if (category != null) 'category': category,
      if (sort != null) 'sort': sort,
      if (lang != null) 'lang': lang,
    };
    return await _api.get('/api/shop/listings', params: params);
  }

  Future<Map<String, dynamic>> getListing(String id, {String? lang}) {
    final path = '/api/shop/listings/$id${lang != null ? '?lang=$lang' : ''}';
    return _api.get(path);
  }

  Future<Map<String, dynamic>> getCategories({String? lang}) {
    final path = lang != null ? '/api/shop/categories?lang=$lang' : '/api/shop/categories';
    return _api.get(path);
  }

  Future<Map<String, dynamic>> addToCart(String listingId, {int quantity = 1}) =>
    _api.post('/api/shop/cart/add', body: {'listingId': listingId, 'quantity': quantity});

  Future<Map<String, dynamic>> getCart() => _api.get('/api/shop/cart');

  Future<Map<String, dynamic>> toggleWishlist(String listingId) =>
    _api.post('/api/shop/wishlist/toggle', body: {'listingId': listingId});

  Future<Map<String, dynamic>> createListing(Map<String, dynamic> data) =>
    _api.post('/api/shop/listings', body: data);

  Future<Map<String, dynamic>> createPayment(double amount, String description, {String? returnUrl}) =>
    _api.post('/api/payment/create', body: {
      'amount': amount, 'description': description,
      if (returnUrl != null) 'returnUrl': returnUrl,
    });

  Future<Map<String, dynamic>> getStores() => _api.get('/api/shop/stores');
  Future<Map<String, dynamic>> getStore(String slug) => _api.get('/api/shop/stores/$slug');
}
