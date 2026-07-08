# 🚀 Bitwise Learning - BTech Study Resources Portal

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119eff?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)

Bitwise Learning is a highly optimized, premium hybrid application (Web & Native Mobile) designed specifically for **BTech engineering students**. The portal provides hand-written subject syllabus notes, previous years' board exam question papers (PYQs), and synchronized course playlists. It features a robust administration dashboard to manage items, bundle notes, and license study content.

---

## 🌟 Core Features

### 👨‍🎓 Student Portal
*   **🔒 Auth Gate Security**: Hides all navigation features for logged-out users, redirecting them to a modern glassmorphic glowing authentication portal.
*   **📚 Subject Catalog**: Material organized dynamically by Academic Year (1st, 2nd, 3rd, 4th Year) and Semester (1 & 2).
*   **📝 PYQs Locker**: Previous Year Questions separated into a dedicated locker view.
*   **🔐 Anti-Piracy PDF Viewer**: Pure canvas-based web PDF renderer designed to block piracy. It disables text selection, right-click context menus, printing, screenshot keyboard shortcut combinations, and Developer Console inspector hooks.
*   **🛍️ Premium Combo Packs**: Students can buy single files or unlock cost-effective semester bundles.
*   **🎥 Video Lectures**: Linked course playlists directly from YouTube.

### 👩‍💼 Administrator Control Console
*   **📊 Live Dashboard Statistics**: Overview of total files, combos, active user accounts, and active library licenses.
*   **📝 Note & PYQ Publisher**: Multi-form uploader with page count tracking, price, year, and resource type selector.
*   **🔗 Playlist Sync Engine**: Sync YouTube playlists using the playlist ID with automatic oEmbed thumbnail fetching.
*   **🎟️ Manual Licensing**: Grant custom license durations (6 or 12 months) by entering the student's email.
*   **📦 Bundle Creator**: Package individual notes together for combined purchase.

---

## 🛠️ Technology Stack Directory

### 💻 Web Platform
*   **Frontend**: React 19.x (TypeScript)
*   **Bundler**: Vite 8.x
*   **Styling**: Custom Vanilla CSS (Dark glassmorphism, glowing neon outlines, responsive layouts).
*   **Icons**: Lucide Icons
*   **Hosting**: Deployed on Render

### 📱 Android Application
*   **Runtime Container**: Capacitor 8.x
*   **Asset Pipeline**: `@capacitor/assets` (Generates Android-compliant launcher icon mipmaps and splash screen layouts from a single file).
*   **Build Engine**: Gradle (Compiles production release packages: `.apk` for testing, `.aab` for Play Store publishing).

---

## 🗄️ Database Schema (Supabase PostgreSQL)

Configure your Supabase dashboard using the following table structures:

```sql
-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin'))
);

-- 2. Notes Table
CREATE TABLE public.notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    year TEXT NOT NULL,
    semester INTEGER NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    description TEXT,
    previewUrl TEXT NOT NULL DEFAULT '',
    pagesCount INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'notes' CHECK (type IN ('notes', 'pyqs'))
);

-- 3. Bundles Table
CREATE TABLE public.bundles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    year TEXT NOT NULL,
    semester INTEGER NOT NULL,
    notesIds TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- 4. Purchases Table
CREATE TABLE public.purchases (
    id TEXT PRIMARY KEY,
    userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    itemId TEXT NOT NULL,
    itemType TEXT NOT NULL CHECK (itemType IN ('notes', 'bundle')),
    purchasedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

## 🚀 Local Installation & Setup

### Prerequisites
*   NodeJS (v18+)
*   NPM / Yarn
*   Android SDK & JDK 17 (for compiling mobile app)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/bitwiselearning0-creator/notes-selling-app.git
cd notes-selling-app
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📱 Compiling the Android App

### 1. Build and Sync Web Assets
```bash
npm run build
npx cap sync
```

### 2. Generate Android Icons & Splash Screens
Place your source logo in `assets/logo.png` (min size 1024x1024 px) and run:
```bash
npx @capacitor/assets generate --iconBackgroundColor '#070c26' --splashBackgroundColor '#070c26'
```

### 3. Compile Testing APK & Play Store AAB
To compile the installable testing `.apk` and the publishing `.aab` package:
```bash
cd android
./gradlew assembleDebug assembleRelease bundleRelease
```
*   **Installable APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
*   **Play Store App Bundle**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ✍️ Credits & Author Info
Proudly Designed & Developed with ❤️ by **Saket Choudhary**.
*   **Instagram Profile**: [@hackwithsaket](https://www.instagram.com/hackwithsaket/)
*   **Developer Portal**: [saket-choudhary](https://www.instagram.com/hackwithsaket/)
