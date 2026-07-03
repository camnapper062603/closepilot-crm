# Kira Home Mobile Store Readiness

This repo is set up so the CRM, Kira Recruit, and Residential Lead Gen pages can ship inside one native app shell named `Kira Home`.

## What is included

- PWA metadata in `manifest.webmanifest`
- Offline/static shell caching in `service-worker.js`
- Shared store icon source at `assets/kira-app-icon.svg`, plus generated PNG icons for iOS/Android/PWA use
- Capacitor native wrapper config in `capacitor.config.json`
- NPM scripts for adding, syncing, and opening iOS/Android projects

## Build and native project commands

```bash
npm run assets:icons
npm run build
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
```

Run `mobile:add:android` and `mobile:add:ios` once to create the native projects. The `android/` and `ios/` projects are already generated in this repo, so normal app updates only need `npm run mobile:sync`.

The app shell opens the CRM first and keeps Kira Recruit and Lead Generator available from the existing in-app links. That packages all three web apps into one app listing. For separate App Store or Play Store listings, each app needs its own bundle ID/application ID, app name, icon set, screenshots, privacy details, and native project.

## Store submission notes

- Apple App Store requires an Apple Developer account, Xcode, signing certificates, privacy details, screenshots, and review approval.
- Google Play requires a Google Play Console account, Android Studio, signed release build, app content declarations, screenshots, and review approval.
- Android can produce a Play Store-ready `.aab` from Android Studio or Gradle after signing is configured.
- iOS needs CocoaPods and Xcode on macOS before archive/upload; Linux can generate and sync the project but cannot finish App Store signing.
- App Store review can reject apps that are only thin website wrappers. Keep the mobile experience app-like, with useful offline/local workflows, clear navigation, and no broken external links.
- The current setup packages all three apps as one app suite. If you want three separate store listings later, create separate Capacitor configs with unique `appId`, `appName`, icons, and start pages.

## Official references

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Capacitor iOS App Store deployment: https://capacitorjs.com/docs/ios/deploying-to-app-store
- Capacitor Android Google Play deployment: https://capacitorjs.com/docs/android/deploying-to-google-play
- Google Play app setup: https://support.google.com/googleplay/android-developer/answer/9859152
- Android app signing: https://developer.android.com/studio/publish/app-signing
