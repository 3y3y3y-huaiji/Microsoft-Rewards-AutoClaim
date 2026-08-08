/// Interactive Microsoft/Bing sign-in entry point.
///
/// The legacy `login.live.com/login.srf?wa=wsignin1.0` Passport flow no longer
/// renders a login form for logged-out users. Loaded without a session it
/// 302-redirects straight to `www.bing.com/secure/Passport.aspx?...MSPPError=...`
/// (a "not signed in" error page), which the app used to misread as a
/// successful login. This entry point runs the modern OAuth flow instead and,
/// on success, returns to `www.bing.com` with an authenticated Bing session.
const String bingSignInUrl =
    'https://www.bing.com/fd/auth/signin?action=interactive&provider=windows_live_id&return_url=https%3A%2F%2Fwww.bing.com%2F';

/// Whether [url] is an authenticated Bing page reached *after* the sign-in flow
/// completed.
///
/// Returns true only when we are back on `www.bing.com` and the page is not
/// part of the auth flow. This guards against three pages that are NOT a
/// successful login but still live on (or redirect through) bing.com:
///   - the sign-in entry / callback (`/fd/auth/...`, `/identity/...`)
///   - the Passport error redirect (`/secure/Passport.aspx?...MSPPError=...`)
///   - any bing URL still carrying an `MSPPError` query parameter
bool isSignedInBingUrl(Uri? url) {
  if (url == null) return false;
  if (url.host != 'www.bing.com') return false;

  final path = url.path.toLowerCase();
  if (path.startsWith('/fd/auth')) return false;
  if (path.startsWith('/identity')) return false;
  if (path.contains('passport')) return false;

  final hasPassportError = url.queryParameters.keys
      .any((key) => key.toLowerCase() == 'mspperror');
  if (hasPassportError) return false;

  return true;
}
