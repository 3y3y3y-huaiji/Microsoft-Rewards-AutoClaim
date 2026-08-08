import 'package:flutter_test/flutter_test.dart';
import 'package:microsoft_automatic_rewards/features/search/domain/login_status.dart';

void main() {
  group('isSignedInBingUrl', () {
    test('returns false for the Passport "not signed in" error redirect', () {
      // Arrange: the page the broken login.srf flow now lands on for
      // logged-out users.
      final url = Uri.parse(
          'https://www.bing.com/secure/Passport.aspx?f=255&MSPPError=-2147184018');

      // Act & Assert
      expect(isSignedInBingUrl(url), isFalse);
    });

    test('returns false for the sign-in entry / callback hop', () {
      final url = Uri.parse(
          'https://www.bing.com/fd/auth/signin?action=interactive&provider=windows_live_id');

      expect(isSignedInBingUrl(url), isFalse);
    });

    test('returns false for the identity token callback', () {
      final url = Uri.parse('https://www.bing.com/identity/idtokenv2');

      expect(isSignedInBingUrl(url), isFalse);
    });

    test('returns false while still on the login.live.com form', () {
      final url =
          Uri.parse('https://login.live.com/oauth20_authorize.srf?client_id=x');

      expect(isSignedInBingUrl(url), isFalse);
    });

    test('returns false when a bing url still carries an MSPPError param', () {
      final url = Uri.parse('https://www.bing.com/?MSPPError=-2147184018');

      expect(isSignedInBingUrl(url), isFalse);
    });

    test('returns false for a null url', () {
      expect(isSignedInBingUrl(null), isFalse);
    });

    test('returns true when back on the bing home page after sign-in', () {
      final url = Uri.parse('https://www.bing.com/');

      expect(isSignedInBingUrl(url), isTrue);
    });

    test('returns true on an authenticated bing search page', () {
      final url = Uri.parse('https://www.bing.com/search?q=hello');

      expect(isSignedInBingUrl(url), isTrue);
    });
  });
}
