import 'package:powersync/powersync.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart' as sqflite;
import '../config/api_config.dart';

class PowerSyncService {
  static final PowerSyncService _instance = PowerSyncService._();
  factory PowerSyncService() => _instance;
  PowerSyncService._();

  PowerSyncDatabase? _db;
  PowerSyncDatabase get db => _db!;
  bool get isInitialized => _db != null;

  Future<void> initialize() async {
    final dir = await getApplicationDocumentsDirectory();
    final path = '${dir.path}/heavenslive.db';

    _db = PowerSyncDatabase.withOpenFactory(
      schema: _schema,
      factory: () async {
        return sqflite.openDatabase(
          path,
          version: 1,
          onCreate: (db, version) async {
            await db.execute('''
              CREATE TABLE IF NOT EXISTS listings (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                price REAL,
                currency TEXT DEFAULT 'USD',
                type TEXT,
                category TEXT,
                images TEXT,
                seller_id TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                updated_at TEXT
              )
            ''');
            await db.execute('''
              CREATE TABLE IF NOT EXISTS shop_categories (
                slug TEXT PRIMARY KEY,
                name TEXT,
                icon TEXT,
                parent_slug TEXT
              )
            ''');
          },
        );
      },
    );

    await _db!.connect(
      connector: PowerSyncBackendConnector(),
    );
  }

  static const _schema = Schema([
    // Shop
    Table('listings', [
      Column.text('id'),
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
      Column.text('updated_at'),
    ]),
    Table('shop_categories', [
      Column.text('slug'),
      Column.text('name'),
      Column.text('icon'),
      Column.text('parent_slug'),
    ]),
    // Credon Ledger
    Table('wallets', [
      Column.text('id'),
      Column.text('user_id'),
      Column.integer('balance_cents'),
      Column.text('currency_clone'),
      Column.text('created_at'),
    ]),
    Table('transactions', [
      Column.text('id'),
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

  Future<List<Map<String, dynamic>>> getListings() async {
    return _db!.getAll('SELECT * FROM listings ORDER BY created_at DESC');
  }

  void dispose() {
    _db?.disconnectAndClear();
    _db = null;
  }
}

class PowerSyncBackendConnector extends BackendConnector {
  @override
  Future<PowerSyncBackendConnectorConfig> fetchCredentials() async {
    return PowerSyncBackendConnectorConfig(
      endpoint: 'http://heavenslive.com:8080',
      token: 'anonymous', // TODO: use real JWT after auth
    );
  }

  @override
  Future<void> uploadData(PowerSyncDatabase database) async {
    final tx = await database.getNextCrudTransaction();
    if (tx == null) return;

    try {
      final response = await http.post(
        Uri.parse('https://heavenslive.com/api/sync/upload'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mutations': tx.crud,
          'transaction_id': tx.transactionId.toString(),
        }),
      );
      if (response.statusCode == 200) {
        await database.completeTransaction(tx.transactionId);
      }
    } catch (e) {
      // Retry on next sync cycle
    }
  }
}
