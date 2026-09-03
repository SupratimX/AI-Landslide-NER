import 'package:flutter/material.dart';
import 'screens/camera_hazard_screen.dart';
import 'screens/offline_alert_feed_screen.dart';
import 'services/onnx_edge_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await OnnxEdgeInferenceService.instance.initialize();
  runApp(const LandSafeEdgeApp());
}

class LandSafeEdgeApp extends StatelessWidget {
  const LandSafeEdgeApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LANDSAFE NER Citizen Edge',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Colors.cyan,
        scaffoldBackgroundColor: const Color(0xFF070B14),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  _MainNavigationScreenState createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final List<Widget> _screens = const [
    CameraHazardScreen(),
    OfflineAlertFeedScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: Colors.cyan,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Report Hazard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.warning_amber_rounded),
            label: 'Offline Alerts',
          ),
        ],
      ),
    );
  }
}
