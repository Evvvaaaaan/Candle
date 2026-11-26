import 'dart:io';

import 'package:integration_test/integration_test_driver_extended.dart';

/// Saves screenshots taken by integration tests to `screenshots/NAME.png`.
Future<void> main() => integrationDriver(
      onScreenshot: (name, bytes, [args]) async {
        final file = File('screenshots/$name.png');
        await file.create(recursive: true);
        await file.writeAsBytes(bytes);
        return true;
      },
    );
