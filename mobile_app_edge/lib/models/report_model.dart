class CitizenHazardReport {
  final int? id;
  final double latitude;
  final double longitude;
  final String timestamp;
  final String imagePath;
  final double onnxSeverityScore;
  final String hazardType; // 'tension_crack', 'mudslide', 'rockfall', 'debris_flow'
  final String description;
  final String reporterPhone;
  String syncStatus; // 'pending', 'synced', 'failed'

  CitizenHazardReport({
    this.id,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.imagePath,
    required this.onnxSeverityScore,
    required this.hazardType,
    required this.description,
    required this.reporterPhone,
    this.syncStatus = 'pending',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp,
      'image_path': imagePath,
      'onnx_severity_score': onnxSeverityScore,
      'hazard_type': hazardType,
      'description': description,
      'reporter_phone': reporterPhone,
      'sync_status': syncStatus,
    };
  }

  factory CitizenHazardReport.fromMap(Map<String, dynamic> map) {
    return CitizenHazardReport(
      id: map['id'],
      latitude: (map['latitude'] as num).toDouble(),
      longitude: (map['longitude'] as num).toDouble(),
      timestamp: map['timestamp'] ?? '',
      imagePath: map['image_path'] ?? '',
      onnxSeverityScore: (map['onnx_severity_score'] as num).toDouble(),
      hazardType: map['hazard_type'] ?? 'debris_flow',
      description: map['description'] ?? '',
      reporterPhone: map['reporter_phone'] ?? '',
      syncStatus: map['sync_status'] ?? 'pending',
    );
  }
}
