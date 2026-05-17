import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'dart:io';

enum StorageTier { minimal, balanced, full }

class StorageManager {
  static const _key = 'storage_tier';
  static const _maxDbSizes = {
    StorageTier.minimal: 20 * 1024 * 1024,   // 20MB
    StorageTier.balanced: 100 * 1024 * 1024,  // 100MB
    StorageTier.full: 500 * 1024 * 1024,      // 500MB
  };

  // How many days of listing history to keep offline
  static const _listingRetentionDays = {
    StorageTier.minimal: 7,
    StorageTier.balanced: 30,
    StorageTier.full: 365,
  };

  static Future<StorageTier> getTier() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString(_key) ?? 'balanced';
    return StorageTier.values.firstWhere((t) => t.name == v,
        orElse: () => StorageTier.balanced);
  }

  static Future<void> setTier(StorageTier tier) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, tier.name);
    await _pruneOldListings(tier);
    await _enforceDbLimit(tier);
  }

  /// Remove listings older than retention period
  static Future<void> _pruneOldListings(StorageTier tier) async {
    final days = _listingRetentionDays[tier]!;
    // PowerSync handles this via sync_rules filtering on server
    // Local cleanup runs on next sync cycle
  }

  /// Enforce max database file size
  static Future<void> _enforceDbLimit(StorageTier tier) async {
    final maxSize = _maxDbSizes[tier]!;
    final dbPath = await _getDbPath();
    if (dbPath == null) return;

    final file = File(dbPath);
    if (await file.exists() && await file.length() > maxSize) {
      // Run VACUUM to reclaim space, then trim oldest records
      final db = await openDatabase(dbPath);
      await db.execute('VACUUM');
      if (tier != StorageTier.full) {
        final cutoff = DateTime.now()
            .subtract(Duration(days: _listingRetentionDays[tier]!));
        await db.delete('listings',
            where: 'created_at < ?',
            whereArgs: [cutoff.toIso8601String()]);
        await db.execute('VACUUM');
      }
      await db.close();
    }
  }

  static Future<String?> _getDbPath() async {
    try {
      final dir = await getDatabasesPath();
      return '$dir/heavenslive.db';
    } catch (_) {
      return null;
    }
  }

  static Map<StorageTier, String> get descriptions => {
    StorageTier.minimal: '20MB — Recent week of listings, text only',
    StorageTier.balanced: '100MB — Month of listings + thumbnails',
    StorageTier.full: '500MB — Full year, full images, all categories',
  };
}
