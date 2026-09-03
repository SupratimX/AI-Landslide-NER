import 'package:flutter/material.dart';
import '../services/sync_manager.dart';
import '../models/report_model.dart';

class CameraHazardScreen extends StatefulWidget {
  const CameraHazardScreen({Key? key}) : super(key: key);

  @override
  _CameraHazardScreenState createState() => _CameraHazardScreenState();
}

class _CameraHazardScreenState extends State<CameraHazardScreen> {
  String _selectedHazard = 'tension_crack';
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController(text: '+919876543210');
  bool _isProcessing = false;
  CitizenHazardReport? _latestSubmitted;

  final Map<String, String> _hazardLabels = {
    'tension_crack': 'Longitudinal Tension Crack in Road / Slope',
    'mudslide': 'Active Mudslide / Soil Slurry Flow',
    'rockfall': 'Rockfall / Detached Boulders',
    'debris_flow': 'Debris Torrent / Embankment Shift',
  };

  void _handleSubmit() async {
    setState(() => _isProcessing = true);

    // Simulated GPS Coordinates (e.g. East Khasi Hills, Meghalaya)
    final double lat = 25.3361;
    final double lon = 91.7610;

    final report = await EdgeSyncManager.instance.submitHazardReportOfflineFirst(
      latitude: lat,
      longitude: lon,
      hazardType: _selectedHazard,
      description: _descController.text.isNotEmpty
          ? _descController.text
          : 'Hazard captured along hillside shoulder.',
      imagePath: '/assets/sample_capture_${DateTime.now().millisecondsSinceEpoch}.jpg',
      reporterPhone: _phoneController.text,
      slopeAngleDeg: 42.0,
      estimatedRainfallMm: 95.0,
    );

    setState(() {
      _isProcessing = false;
      _latestSubmitted = report;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '✓ Saved locally in SQLite! Edge AI Severity: ${(report.onnxSeverityScore * 100).toInt()}%',
        ),
        backgroundColor: Colors.teal,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1D),
      appBar: AppBar(
        title: const Text('LANDSAFE — Field Hazard Capture'),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Camera / Viewfinder Simulation Box
            Container(
              height: 220,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.cyan.withOpacity(0.4)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.camera_alt_outlined, size: 54, color: Colors.cyan),
                        const SizedBox(height: 8),
                        Text(
                          'Slope Viewfinder Active',
                          style: TextStyle(color: Colors.grey.shade300, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'GPS Tag: 25.3361° N, 91.7610° E (Meghalaya NH-106)',
                          style: TextStyle(color: Colors.grey, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.green),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.offline_bolt, size: 14, color: Colors.green),
                          SizedBox(width: 4),
                          Text('Offline Edge Mode Active', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Hazard Type Selector
            const Text(
              'Observed Hazard Type:',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade700),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedHazard,
                  dropdownColor: const Color(0xFF1E293B),
                  isExpanded: true,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  items: _hazardLabels.entries.map((e) {
                    return DropdownMenuItem<String>(
                      value: e.key,
                      child: Text(e.value),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedHazard = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Description Input
            const Text(
              'Field Observation Notes:',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'e.g., Noticeable ground crack widening after morning cloudburst...',
                hintStyle: TextStyle(color: Colors.grey.shade500),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),

            // Submit Button
            ElevatedButton(
              onPressed: _isProcessing ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyan.shade600,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Run On-Device AI Assessment & Save',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),

            if (_latestSubmitted != null) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF131D31),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.cyan.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '⚡ Instant On-Device AI Feedback',
                      style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Edge Model Severity Rating: ${(_latestSubmitted!.onnxSeverityScore * 100).toInt()}% Critical',
                      style: TextStyle(
                        color: _latestSubmitted!.onnxSeverityScore > 0.8 ? Colors.redAccent : Colors.amber,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Persistence Status: Saved locally in SQLite (ID: #${_latestSubmitted!.id})',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
