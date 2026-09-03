import 'package:flutter/material.dart';

class OfflineAlertFeedScreen extends StatelessWidget {
  const OfflineAlertFeedScreen({Key? key}) : super(key: key);

  final List<Map<String, dynamic>> _alerts = const [
    {
      'region': 'East Khasi Hills (NH-106)',
      'status': 'EMERGENCY',
      'prob': '91%',
      'rain': '142 mm',
      'as_text': 'জৰুৰী সতৰ্কবাৰ্তা: বিপজ্জনক ভূমিস্খলনৰ আশংকা। ওখ ঠাইলৈ যাওক।',
      'hi_text': 'आपातकालीन चेतावनी: अत्यधिक भूस्खलन जोखिम। सुरक्षित स्थान पर जाएं।',
      'en_text': 'EMERGENCY: Immediate evacuation advised. High ground shelter active.',
    },
    {
      'region': 'Gangtok - Nathu La Mile 13',
      'status': 'EMERGENCY',
      'prob': '88%',
      'rain': '110 mm',
      'as_text': 'সতৰ্কবাৰ্তা: গেংটক-নাথুলা পথত ভূমিধসৰ সতৰ্কতা।',
      'hi_text': 'गंगटोक-नाथुला मार्ग पर भारी भूस्खलन की चेतावनी।',
      'en_text': 'Debris sliding active on Mile 13. Heavy rain accumulation.',
    },
    {
      'region': 'Dima Hasao Hill Section',
      'status': 'WARNING',
      'prob': '79%',
      'rain': '94 mm',
      'as_text': 'হাফলং পাহাৰত মাটিৰ আৰ্দ্ৰতা বৃদ্ধি পাইছে। সাৱধান হওক।',
      'hi_text': 'हाफलोंग पहाड़ी पर भारी बारिश से मिट्टी खिसकने की आशंका।',
      'en_text': 'Shale formation saturated. Avoid railway cut slopes.',
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1D),
      appBar: AppBar(
        title: const Text('Local Early Warnings (Cached Offline)'),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _alerts.length,
        itemBuilder: (context, index) {
          final a = _alerts[index];
          final isEmergency = a['status'] == 'EMERGENCY';

          return Card(
            color: const Color(0xFF162032),
            margin: const EdgeInsets.only(bottom: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: isEmergency ? Colors.red.withOpacity(0.5) : Colors.orange.withOpacity(0.4)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        a['region'],
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isEmergency ? Colors.red.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${a['status']} (${a['prob']})',
                          style: TextStyle(color: isEmergency ? Colors.redAccent : Colors.orangeAccent, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '24h Rain: ${a['rain']}',
                    style: const TextStyle(color: Colors.cyan, fontSize: 12),
                  ),
                  const Divider(color: Colors.white12, height: 16),
                  Text(
                    'অসমীয়া: ${a['as_text']}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'हिन्दी: ${a['hi_text']}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'English: ${a['en_text']}',
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
