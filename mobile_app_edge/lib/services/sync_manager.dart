import 'dart:convert';
import 'package:http/http.dart' as http;
import 'offline_db_service.dart';
import 'onnx_edge_service.dart';
import '../models/report_model.dart';

class EdgeSyncManager {
  static final EdgeSyncManager instance = EdgeSyncManager._init();
  final String backendApiUrl = 'http://10.0.2.2:8000/api/v1/citizen-reports'; // Android emulator host

  EdgeSyncManager._init();

  /// Offline-First Data-Writing Flow as mandated by AGENTS.md:
  /// (a) run ONNX inference locally
  /// (b) persist to local SQLite
  /// (c) attempt API sync last without blocking
  Future<CitizenHazardReport> submitHazardReportOfflineFirst({
    required double latitude,
    required double longitude,
    required String hazardType,
    required String description,
    required String imagePath,
    required String reporterPhone,
    double slopeAngleDeg = 40.0,
    double estimatedRainfallMm = 80.0,
  }) async {
    // Step (a): Run ONNX Edge Inference locally on device
    final double severityScore = await OnnxEdgeInferenceService.instance.evaluateHazardSeverity(
      slopeAngleDeg: slopeAngleDeg,
      estimatedRainfallMm: estimatedRainfallMm,
      hazardType: hazardType,
    );

    // Step (b): Persist to Local SQLite Database
    final report = CitizenHazardReport(
      latitude: latitude,
      longitude: longitude,
      timestamp: DateTime.now().toUtc().toIso8601String(),
      imagePath: imagePath,
      onnxSeverityScore: severityScore,
      hazardType: hazardType,
      description: description,
      reporterPhone: reporterPhone,
      syncStatus: 'pending',
    );

    final int insertedId = await OfflineDbService.instance.insertReport(report);
    final persistedReport = CitizenHazardReport(
      id: insertedId,
      latitude: report.latitude,
      longitude: report.longitude,
      timestamp: report.timestamp,
      imagePath: report.imagePath,
      onnxSeverityScore: report.onnxSeverityScore,
      hazardType: report.hazardType,
      description: report.description,
      reporterPhone: report.reporterPhone,
      syncStatus: 'pending',
    );

    // Step (c): Attempt Background API Sync (non-blocking)
    _attemptBackgroundSync(persistedReport);

    return persistedReport;
  }

  Future<void> _attemptBackgroundSync(CitizenHazardReport report) async {
    try {
      final response = await http.post(
        Uri.parse(backendApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'latitude': report.latitude,
          'longitude': report.longitude,
          'hazard_type': report.hazardType,
          'onnx_severity_score': report.onnxSeverityScore,
          'description': report.description,
          'image_path': report.imagePath,
          'reporter_phone': report.reporterPhone,
          'sync_status': 'synced',
        }),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200 && report.id != null) {
        await OfflineDbService.instance.markReportSynced(report.id!);
        print('Report #${report.id} synced successfully with central GIS server.');
      }
    } catch (e) {
      print('Network unavailable or slow. Report #${report.id} remains cached locally in SQLite for future background sync.');
    }
  }

  /// Syncs all un-synced reports when network connectivity resumes
  Future<int> syncAllPending() async {
    final pending = await OfflineDbService.instance.getPendingReports();
    int syncedCount = 0;
    for (final rep in pending) {
      try {
        final response = await http.post(
          Uri.parse(backendApiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'latitude': rep.latitude,
            'longitude': rep.longitude,
            'hazard_type': rep.hazardType,
            'onnx_severity_score': rep.onnxSeverityScore,
            'description': rep.description,
            'image_path': rep.imagePath,
            'reporter_phone': rep.reporterPhone,
            'sync_status': 'synced',
          }),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 && rep.id != null) {
          await OfflineDbService.instance.markReportSynced(rep.id!);
          syncedCount++;
        }
      } catch (_) {}
    }
    return syncedCount;
  }
}
