# OmniaGuard Android APK — Build Guide
# Trusted Web Activity (TWA) Wrapper
# Turns omniaguard.com PWA into a real Android APK you can sideload

---

## OPTION A: Fastest — bubblewrap CLI (Recommended)

bubblewrap converts your PWA directly into a signed Android APK.
No Android Studio required. Takes ~10 minutes on any computer.

### Prerequisites

1. **Node.js 18+** — https://nodejs.org/
2. **Java JDK 11+** — https://adoptium.net/
3. **Android SDK** — bubblewrap installs this automatically on first run

### Steps

```bash
# 1. Install bubblewrap
npm install -g @bubblewrap/cli

# 2. Create a project directory
mkdir omniaguard-apk && cd omniaguard-apk

# 3. Initialize from your live manifest
bubblewrap init --manifest https://omniaguard.com/manifest.json

# When prompted:
#   Package name: com.omniaguard.app
#   App name: OmniaGuard
#   App short name: OmniaGuard
#   Start URL: https://omniaguard.com/
#   Display mode: standalone
#   Status bar color: #00d4ff
#   Splash screen color: #0a0a14
#   Keystore path: (accept default or create new)
#   Key alias: android
#   Password: (create a strong password — SAVE IT)

# 4. Build the APK
bubblewrap build

# Output: app-release-signed.apk in current directory
```

### Install on your phone/tablet (no Play Store)

```bash
# Option 1: ADB (USB cable)
adb install app-release-signed.apk

# Option 2: File transfer
# Copy APK to phone via USB/Google Drive/email
# On phone: Settings → Security → Install unknown apps → Chrome → Allow
# Open the APK file in Files app → Install
```

### After Building — Update assetlinks.json

Get your certificate fingerprint:
```bash
keytool -list -v -keystore android.keystore -alias android
# Copy the SHA-256 fingerprint (looks like: AB:CD:EF:...)
# Remove colons: ABCDEF...
```

Then update `/.well-known/assetlinks.json` on omniaguard.com with your fingerprint.
This links the APK to the domain so Chrome shows it as a native app (no URL bar).

---

## OPTION B: Full Android Studio Project

For adding native capabilities:
- ForegroundService (true background monitoring)
- VpnService (real network traffic analysis)
- BiometricPrompt (native fingerprint/face)
- FCM Push via Firebase (server-sent notifications)
- Device Admin (remote lock/wipe)

### AndroidManifest.xml Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />

<!-- VPN (requires user consent dialog) -->
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />

<!-- Device Admin (optional — for screen lock enforcement) -->
<uses-permission android:name="android.permission.BIND_DEVICE_ADMIN"
    android:protectionLevel="signature" />
```

### Minimum build.gradle

```groovy
android {
    compileSdk 34
    defaultConfig {
        applicationId "com.omniaguard.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    // TWA / Chrome Custom Tabs
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'

    // Biometric
    implementation 'androidx.biometric:biometric:1.2.0-alpha05'

    // FCM Push
    implementation platform('com.google.firebase:firebase-bom:33.0.0')
    implementation 'com.google.firebase:firebase-messaging'

    // Network (for VPN detection)
    implementation 'androidx.core:core-ktx:1.12.0'
}
```

### TwaLauncherActivity.java (Main Activity)

```java
package com.omniaguard.app;

import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class TwaLauncherActivity extends LauncherActivity {
    // TWA handles all web rendering automatically
    // Override launchUrl() to add native features
}
```

### VPN Detection (Native — ConnectivityManager)

```java
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;

ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
Network[] networks = cm.getAllNetworks();
for (Network net : networks) {
    NetworkCapabilities caps = cm.getNetworkCapabilities(net);
    if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
        // VPN is active — send alert to WebView via JavaScript bridge
        webView.evaluateJavascript("window.nativeVPNStatus = 'active';", null);
    }
}
```

### JavaScript Bridge (WebView → Native)

```java
webView.addJavascriptInterface(new Object() {
    @JavascriptInterface
    public String getVPNStatus() {
        // return native VPN detection result
        return checkVPNActive() ? "active" : "inactive";
    }

    @JavascriptInterface
    public void requestBiometric(String callback) {
        // trigger native BiometricPrompt, call callback with result
    }

    @JavascriptInterface
    public String getNetworkInfo() {
        // return JSON with connection type, IP, etc.
    }
}, "OmniaGuardNative");

// In your web JS, call: OmniaGuardNative.getVPNStatus()
```

---

## OPTION C: VPN Service App (Full Network Monitoring)

To actually intercept and analyze network traffic on Android,
you need a VPN Service that routes all traffic through your app.

This is the model used by products like:
- Mullvad VPN, ProtonVPN
- Pi-hole apps, DNS-based ad blockers
- Corporate MDM apps (Jamf, Intune)

```java
public class OmniaGuardVPNService extends VpnService {
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Build VPN tunnel
        VpnService.Builder builder = new VpnService.Builder();
        builder.addAddress("10.99.0.2", 24);        // tunnel IP
        builder.addDnsServer("1.1.1.1");             // Cloudflare DNS
        builder.addRoute("0.0.0.0", 0);              // route all traffic
        builder.setSession("OmniaGuard Security");
        ParcelFileDescriptor tun = builder.establish();

        // Now read all packets from tun descriptor
        // Inspect DNS queries, detect malicious domains
        // Block known threat IPs
        // Alert on VPN-over-VPN (unusual)
    }
}
```

**Warning:** VPN service requires explicit user consent via Android's VPN dialog.
It CANNOT be silent — Android requires user approval each time.

---

## QUICK REFERENCE: What Each Option Gets You

| Feature | PWA (now) | TWA APK | Full Native APK | VPN Service |
|---------|-----------|---------|-----------------|-------------|
| Home screen icon | ✅ | ✅ | ✅ | ✅ |
| Full-screen app | ✅ | ✅ | ✅ | ✅ |
| Push notifications | ✅ | ✅ FCM | ✅ FCM | ✅ |
| VPN detect (WebRTC) | ✅ | ✅ | ✅ | ✅ |
| VPN detect (system) | ❌ | ❌ | ✅ | ✅ |
| Biometric auth | ✅ WebAuthn | ✅ | ✅ native | ✅ |
| Background monitor | ❌ (30s limit) | ❌ | ✅ foreground svc | ✅ |
| Traffic analysis | ❌ | ❌ | ❌ | ✅ |
| Block threats | ❌ | ❌ | ❌ | ✅ DNS |
| Play Store | ❌ | ✅ | ✅ | ✅ |
| Build time | 0 (live now) | 30 min | 2-4 days | 1-2 weeks |

---

## FASTEST PATH TO YOUR PHONE RIGHT NOW

**Step 1 (do this now, takes 2 minutes):**
1. Open Chrome on your Galaxy S26 / Tab S11
2. Go to https://omniaguard.com
3. Tap the 3-dot menu (⋮) → "Add to Home Screen"
4. Name it "OmniaGuard" → Add
5. Open app → tap "Enable Alerts" for push notifications
6. Go to VPN Monitor → tap "Start Auto-Monitor"

**Step 2 (when you want the APK, takes 30 min on your computer):**
1. Install Node.js 18 + Java JDK 11
2. Run `npm install -g @bubblewrap/cli`
3. Run `bubblewrap init --manifest https://omniaguard.com/manifest.json`
4. Run `bubblewrap build`
5. Transfer APK to phone → install

---

*OmniaGuard Android Build Guide | Francisco Holdings Inc. | June 2026*
