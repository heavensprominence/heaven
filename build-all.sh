#!/bin/bash
echo "HeavensLive — Build All Platforms"
echo "================================="

# Mobile (requires Flutter)
if command -v flutter &> /dev/null; then
  echo "📱 Building Android APK..."
  cd mobile && flutter build apk --release && cd ..
  echo "📱 Building iOS (requires macOS)..."
  cd mobile && flutter build ios --release --no-codesign 2>/dev/null && cd ..
else
  echo "⚠️ Flutter not installed — skipping mobile builds"
fi

# Desktop (requires Rust + Tauri)
if command -v cargo &> /dev/null; then
  echo "🖥 Building Windows..."
  cd desktop && cargo tauri build --target x86_64-pc-windows-msvc 2>/dev/null && cd ..
  echo "🖥 Building macOS..."
  cd desktop && cargo tauri build --target x86_64-apple-darwin 2>/dev/null && cd ..
  echo "🖥 Building Linux AppImage..."
  cd desktop && cargo tauri build --target x86_64-unknown-linux-gnu && cd ..
else
  echo "⚠️ Rust not installed — skipping desktop builds"
fi

echo "✅ Build complete"
echo "📱 Android: mobile/build/app/outputs/flutter-apk/app-release.apk"
echo "🍎 iOS: mobile/build/ios/iphoneos/Runner.app"
echo "🪟 Windows: desktop/src-tauri/target/release/bundle/msi/"
echo "🍏 macOS: desktop/src-tauri/target/release/bundle/dmg/"
echo "🐧 Linux: desktop/src-tauri/target/release/bundle/appimage/"
