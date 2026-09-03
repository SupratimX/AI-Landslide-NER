import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/report_model.dart';

class OfflineDbService {
  static final OfflineDbService instance = OfflineDbService._init();
  static Database? _database;

  OfflineDbService._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('landsafe_edge_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE citizen_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL,
        image_path TEXT NOT NULL,
        onnx_severity_score REAL NOT NULL,
        hazard_type TEXT NOT NULL,
        description TEXT,
        reporter_phone TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      )
    ''');

    await db.execute('''
      CREATE TABLE cached_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_name TEXT NOT NULL,
        alert_status TEXT NOT NULL,
        risk_probability REAL NOT NULL,
        cached_at TEXT NOT NULL,
        message_multilingual TEXT
      )
    ''');
  }

  Future<int> insertReport(CitizenHazardReport report) async {
    final db = await instance.database;
    return await db.insert('citizen_reports', report.toMap());
  }

  Future<List<CitizenHazardReport>> getPendingReports() async {
    final db = await instance.database;
    final maps = await db.query(
      'citizen_reports',
      where: 'sync_status = ?',
      whereArgs: ['pending'],
    );
    return maps.map((m) => CitizenHazardReport.fromMap(m)).toList();
  }

  Future<int> markReportSynced(int id) async {
    final db = await instance.database;
    return await db.update(
      'citizen_reports',
      {'sync_status': 'synced'},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<CitizenHazardReport>> getAllReports() async {
    final db = await instance.database;
    final maps = await db.query('citizen_reports', orderBy: 'id DESC');
    return maps.map((m) => CitizenHazardReport.fromMap(m)).toList();
  }
}
