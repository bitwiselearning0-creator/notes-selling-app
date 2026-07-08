# Bitwise Learning: Project Handover & System Documentation Report

This document serves as the comprehensive A-to-Z technical report and handover documentation for the **Bitwise Learning** educational resources portal (web application and native mobile app).

---

## 1. Executive Summary
**Bitwise Learning** is a premium learning resources marketplace designed specifically for BTech engineering students. It provides a structured workspace for students to view hand-written subject syllabus notes, download and read previous years' examination papers (PYQs), and follow synchronized video courses. The platform features an administrator portal allowing notes uploads, combo bundling, manual student keys authorization, and statistics management.

---

## 2. System Architecture & Technology Stack

The project is architected as a hybrid single-page application (SPA) running in standard web environments and compiled as a native container for mobile systems.

```
       +---------------------------------------------+
       |             REACT / VITE SPA                |
       |       (TypeScript / CSS Styling / React)    |
       +----------------------++----------------------+
                              ||
        +---------------------++---------------------+
        |                                            |
        v                                            v
+-------+---------------+                    +-------+---------------+
|     MOBILE APP        |                    |      WEB PLATFORM     |
| (Capacitor Container) |                    | (Render Web Hosting)  |
+-----------------------+                    +-----------------------+
        |                                            |
        +---------------------+------+---------------+
                              |
                              v
                   +----------+----------+
                   |   SUPABASE BACKEND  |
                   |  (Auth, DB, Storage)|
                   +---------------------+
```

### 💻 Web Platform Tech Stack
*   **Core Framework**: React 19.x (TypeScript)
*   **Bundler & Dev Server**: Vite 8.x
*   **Styling System**: Custom Vanilla CSS (Glassmorphism design, neon glows, responsive cards)
*   **Icons**: Lucide React
*   **Deployment**: Hosted on Render (`bitwise-learning.onrender.com`)

### 📱 Mobile App (Android) Tech Stack
*   **Container Runtime**: Capacitor 8.x (Capacitor Android Core + CLI)
*   **Asset Generator**: `@capacitor/assets` (Generates Android-compliant adaptive mipmap icons, launch layouts, and splash screens from a single source).
*   **Build Engine**: Gradle (Compiles production packages as `.apk` and `.aab`).
*   **Runtime Bridges**: JavaScript Bridge to Native WebViews.

---

## 3. Core Functionalities

### Student Portal Features
1.  **Auth Locks**: The app blocks unauthenticated navigation. Unauthenticated users are redirected directly to a glowing neon sign-in/sign-up page.
2.  **Organized Catalog**: Resources are categorized by Academic Year (1st, 2nd, 3rd, 4th Year) and Semester (1 & 2).
3.  **Split Resources**: Material is organized into:
    *   *Study Notes*: Standard subject reference files.
    *   *Previous Year Questions (PYQs)*: Solved board examination papers.
    *   *Video Solution Channels*: Youtube course playlists.
4.  **Locker Room (My Library)**: Unlocked materials are sorted into folders (Notes and PYQs) with 6-month license tracking.
5.  **Secure PDF Viewer**:
    *   Simulated canvas PDF renderer.
    *   *Anti-Piracy Security*: Screenshot protection, text selection disabling, right-click locking, and keyboard shortcuts disabled (`Ctrl+P`, `F12`, `Ctrl+U`).

### Admin Dashboard Features
1.  **Dashboard Statistics**: Live counters for total notes, combo bundles, active student accounts, and active licenses.
2.  **Resource Upload Forms**: Form to add Notes/PYQs with details (price, description, year, semester, and resource type selector).
3.  **Playlist Syncer**: Sync YouTube playlists using the playlist ID with automatic oEmbed thumbnail fetching.
4.  **Manual Licensing**: Grant custom license durations (6 or 12 months) by entering the student's email.
5.  **Combo Bundling**: Bundle individual notes together into packages.

---

## 4. Database Models & Supabase Schema

The backend uses Supabase (PostgreSQL). The database consists of 4 primary tables:

### 1. `profiles`
Stores student accounts and roles.
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin'))
);
```

### 2. `notes`
Stores study notes and PYQ entries.
```sql
CREATE TABLE public.notes (
    id TEXT PRIMARY KEY, -- e.g., 'note_xxx' or 'pyq_xxx'
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
    semester INTEGER NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    description TEXT,
    previewUrl TEXT NOT NULL DEFAULT '',
    pagesCount INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'notes' CHECK (type IN ('notes', 'pyqs'))
);
```

### 3. `bundles`
Stores grouped packages of notes.
```sql
CREATE TABLE public.bundles (
    id TEXT PRIMARY KEY, -- e.g., 'bundle_xxx'
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
    semester INTEGER NOT NULL,
    notesIds TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);
```

### 4. `purchases`
Stores purchased licenses.
```sql
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

## 5. Credentials & Access Directory

| Portal Account | Role | Email ID | Password / Details |
| :--- | :--- | :--- | :--- |
| **System Administrator** | Admin | `bitwiselearning0@gmail.com` | User-defined admin login credentials |
| **Play Store Tester** | Student | `googleplaytest@gmail.com` | `PlayStoreTest123` (Set in Supabase for review tests) |

---

## 6. System Data Flows

```
[Student Logs In]
       ||
       v
[Checks Credentials in profiles]
       ||
       v
[Grants access to Catalog] =======> [Locks unauthenticated routes]
       ||
       v
[User buys Note / Bundle]
       ||
       v
[Creates entry in purchases table with +6 months expiresAt]
       ||
       v
[Locker Room checks expiresAt] ======> [Valid? Render PDF Viewer]
                               ======> [Expired? Prompt Unlock]
```

---

## 7. Handover Checklists for Clients
1.  **Supabase SQL console**: Make sure to run the `ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'notes';` script.
2.  **Environment Variables**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in the Render environment configuration.
3.  **Android App**: Compile the release bundle using `./gradlew bundleRelease` in Android Studio and sign it with a production key.
