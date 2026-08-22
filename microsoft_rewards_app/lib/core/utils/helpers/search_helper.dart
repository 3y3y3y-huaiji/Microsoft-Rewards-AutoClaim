// Copyright (c) 2026 3y3y3y-huaiji Microsoft Rewards AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
// EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
// MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

import 'package:flutter_inappwebview/flutter_inappwebview.dart';

/// Helper for driving Bing search via [InAppWebViewController].
///
/// Clean-room implementation for the mobile app revival: this helper
/// deliberately avoids copying upstream web query building. It targets
/// the **mobile** search bucket (roughly 20 searches / 60 points per day).
///
/// Key mobile adaptation notes:
/// - Bing distinguishes mobile vs desktop quota by User-Agent + `form`
///   code. Desktop previously used `form=QBLH`; mobile should use
///   `form=QBRE` so the query is counted toward the mobile bucket.
/// - Per-request `User-Agent` headers are not reliably honored on all
///   `flutter_inappwebview` builds; callers should set the mobile UA
///   once at WebView creation via `InAppWebViewSettings(userAgent: ...)`.
///   See [mobileUserAgent] below.
/// - Query string keeps `qs=n&sp=-1&pq=` to avoid leaking suggestion
///   history and to keep URL deterministic for testing.
class SearchHelper {
  /// Mobile User-Agent string used to hint Bing that the request is
  /// from a phone. Keep in sync with the WebView settings.
  ///
  /// Chosen as a recent Pixel / Chrome Mobile UA; any modern Android
  /// Mobile UA is sufficient - the exact version is not load-bearing
  /// for correctness, only that it contains `Mobile`.
  static const String mobileUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

  /// Form code for mobile Bing search. Using `QBRE` attributes the
  /// request to the mobile flow; `QBLH` is the desktop equivalent and
  /// would not reliably increment the mobile daily counter.
  static const String _mobileForm = 'QBRE';

  static Future<void> launchSearch({
    required InAppWebViewController controller,
    required String query,
  }) async {
    final encodedQuery = Uri.encodeComponent(query);
    // Mobile-adapted Bing search URL. `qs=n` disables query suggestion
    // history, `sp=-1` suppresses `+` prefix, `pq` is intentionally
    // empty. All parameters are intentionally minimal to reduce
    // fingerprinting surface.
    final url = WebUri(
      'https://www.bing.com/search?q=$encodedQuery&qs=n&form=$_mobileForm&sp=-1&pq=',
    );

    // NOTE: If the WebView was initialized with [mobileUserAgent] via
    // InAppWebViewSettings, no extra headers are needed here. Passing
    // headers per-load is intentionally avoided for cross-version
    // compatibility.

    try {
      await controller.loadUrl(
        urlRequest: URLRequest(url: url),
      );
    } catch (e) {
      throw Exception('Failed to launch search: ${e.toString()}');
    }
  }
}
