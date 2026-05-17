import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:powersync/powersync.dart';

class PowerSyncService {
  static final PowerSyncService _instance = PowerSyncService._();
  factory PowerSyncService() => _instance;
  PowerSyncService._();

  PowerSyncDatabase? _db;
  PowerSyncDatabase get db => _db!;
  bool get isInitialized => _db != null;

  static final _schema = Schema([
    Table('listings', [
      Column.text('title'),
      Column.text('description'),
      Column.real('price'),
      Column.text('currency'),
      Column.text('type'),
      Column.text('category'),
      Column.text('images'),
      Column.text('seller_id'),
      Column.text('status'),
      Column.text('created_at'),
    ]),
    Table('shop_categories', [
      Column.text('slug'),
      Column.text('name'),
      Column.text('icon'),
      Column.text('parent_slug'),
    ]),
    Table('wallets', [
      Column.text('user_id'),
      Column.integer('balance_cents'),
      Column.text('currency_clone'),
      Column.text('created_at'),
    ]),
    Table('transactions', [
      Column.text('user_id'),
      Column.text('type'),
      Column.integer('amount_cents'),
      Column.integer('balance_after_cents'),
      Column.text('currency_clone'),
      Column.text('description'),
      Column.text('reference_id'),
      Column.text('created_at'),
    ]),
  ]);

  Future<void> initialize() async {
    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'heavenslive.db');

    _db = PowerSyncDatabase(schema: _schema, path: path);
    await _db!.initialize();

    try {
      await _db!.connect(connector: _BackendConnector());
      debugPrint('PowerSync: connected');
    } catch (e) {
      debugPrint('PowerSync: offline mode — $e');
    }
  }

  Future<List<Map<String, dynamic>>> getListings() async {
    return _db!.getAll('SELECT * FROM listings ORDER BY created_at DESC');
  }

  void dispose() {
    _db?.disconnectAndClear();
    _db = null;
  }
}

class _BackendConnector extends PowerSyncBackendConnector {
  @override
  Future<PowerSyncCredentials?> fetchCredentials() async {
    return PowerSyncCredentials(
      endpoint: 'http://heavenslive.com:8080',
      token: 'anonymous',
    );
  }

  @override
  Future<void> uploadData(PowerSyncDatabase database) async {
    final batch = await database.getCrudBatch();
    if (batch == null) return;
    try {
      final response = await http.post(
        Uri.parse('https://heavenslive.com/api/sync/upload'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mutations': batch.crud,
          'transaction_id': batch.transactionId.toString(),
        }),
      );
      if (response.statusCode == 200) {
        await batch.complete();
      }
    } catch (e) {}
  }
}
