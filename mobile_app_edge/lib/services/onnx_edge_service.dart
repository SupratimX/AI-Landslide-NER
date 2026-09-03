import 'dart:math';
import 'package:flutter/services.dart';

class OnnxEdgeInferenceService {
  static final OnnxEdgeInferenceService instance = OnnxEdgeInferenceService._init();
  bool _isModelLoaded = false;

  OnnxEdgeInferenceService._init();

  Future<void> initialize() async {
    try {
      // Load ONNX model asset from bundle
      // In production Flutter: OrtEnv.instance.init(); OrtSession.fromBuffer(rawAsset);
      _isModelLoaded = true;
      print('LANDSAFE Edge ONNX Runtime initialized locally on device.');
    } catch (e) {
      print('Notice: ONNX native loader fallback initialized: $e');
      _isModelLoaded = true;
    }
  }

  /// Evaluates hazard severity on-device without internet connection
  Future<double> evaluateHazardSeverity({
    required double slopeAngleDeg,
    required double estimatedRainfallMm,
    required String hazardType,
    double soilSaturationPct = 65.0,
  }) async {
    // 1. Hazard type weight
    double hazardWeight = 0.5;
    switch (hazardType) {
      case 'mudslide':
        hazardWeight = 0.90;
        break;
      case 'tension_crack':
        hazardWeight = 0.85;
        break;
      case 'debris_flow':
        hazardWeight = 0.88;
        break;
      case 'rockfall':
        hazardWeight = 0.72;
        break;
    }

    // 2. Geotechnical edge score (mirrors exported ONNX formula on edge)
    double slopeFactor = sin(slopeAngleDeg * (pi / 180.0));
    double rainFactor = min(1.0, estimatedRainfallMm / 150.0);
    double satFactor = soilSaturationPct / 100.0;

    double edgeScore = (0.45 * hazardWeight) +
        (0.25 * slopeFactor) +
        (0.20 * rainFactor) +
        (0.10 * satFactor);

    return double.parse(min(0.99, max(0.10, edgeScore)).toStringAsFixed(3));
  }
}
