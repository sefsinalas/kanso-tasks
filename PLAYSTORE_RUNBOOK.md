# Google Play Store Deployment Runbook — Kanso Tasks

> **Audience:** This document is for developers and AI agents to build, sign, and deploy releases for **Kanso Tasks** (`com.kanso.tasks`) to Google Play Store.

---

## 1. App Configuration & Credentials

- **Package Name:** `com.kanso.tasks`
- **Play Console App ID:** `4972912995209697454`
- **Developer Account ID:** `8968303646570172022`
- **Release Keystore:**
  - File: `android/kanso-release.keystore` (gitignored)
  - Alias: `kanso`
  - Passwords: `songoku` / `songoku`
- **Service Account Key:**
  - File: `android/play-service-account.json` (gitignored)
  - Account: `play-publisher@mapadia-dev-508611-g4.iam.gserviceaccount.com`
- **SDK Requirements (Play Protect 2026):**
  - `minSdkVersion`: 24 (Android 7.0+)
  - `targetSdkVersion`: 36 (Android 16)
  - `compileSdkVersion`: 36
  - JDK: Java 21 (`/opt/homebrew/opt/openjdk@21`)

---

## 2. Automated Commands

```bash
# 1. Build and sign new release bundle (.aab)
npm run build:android

# 2. Deploy to Internal Testing (Pruebas internas)
npm run deploy:internal

# 3. Deploy to Closed Testing (Pruebas cerradas)
npm run deploy:alpha
```

---

## 3. Testing Opt-in URL

- **Internal / Closed Testing Opt-in Link:**
  `https://play.google.com/apps/testing/com.kanso.tasks`
- **Main Tester Email:** `sefsinalas@gmail.com`
