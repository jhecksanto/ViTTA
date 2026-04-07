# ViTTA Health — Architecture Document

> **Purpose:** This document provides a complete technical reference for the ViTTA Health platform. Use it as context to assist with development decisions, code generation, debugging, and feature planning.

---

## 1. Project Overview

**ViTTA Health** is a healthcare management platform that connects patients, healthcare professionals, and commercial partners. Built as a React SPA with Firebase as the backend, the application covers health metric tracking, appointment booking, exam results, pharmacy duty schedules, partner discounts, and an admin panel.

**Core stack:** React + Vite + TypeScript · Tailwind CSS · Firebase (Auth, Firestore, Storage, Functions) · Lucide React · Motion/React

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Web App (React/Vite)    │    Admin Panel (role-gated)     │
│   PWA (offline + push)    │    Mobile App (future roadmap)  │
└──────────────┬────────────┴────────────┬────────────────────┘
               │                         │
┌──────────────▼─────────────────────────▼────────────────────┐
│                    FRONTEND MODULES                         │
│  Dashboard · Appointments · Professionals · Partners        │
│  Exams · Pharmacies · ViTTA Radio · Auth Pages              │
│                                                             │
│  State: React Hooks (useState, useEffect, custom hooks)     │
│  Routing: React Router v6 (protected routes by role)        │
│  Styling: Tailwind CSS · Animations: Motion/React           │
└──────────────────────────┬──────────────────────────────────┘
                           │  Firebase SDK (client-side)
┌──────────────────────────▼──────────────────────────────────┐
│                      FIREBASE LAYER                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │     Auth     │  │  Firestore   │  │     Storage      │  │
│  │ Email/Social │  │  NoSQL DB    │  │  PDFs · Images   │  │
│  │ Role claims  │  │  Realtime    │  │  Exam files      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Functions  │  │   Hosting    │  │    Analytics     │  │
│  │ Notifications│  │  CDN global  │  │  Usage tracking  │  │
│  │ Auto updates │  │  CI/CD       │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  WhatsApp API · Radio Stream · Wearables (roadmap)          │
│  Telemedicine/Video (roadmap) · Push Notifications          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
src/
├── assets/                  # Static assets (images, icons, fonts)
├── components/
│   ├── ui/                  # Reusable primitives (Button, Card, Badge, Modal)
│   ├── layout/              # AppShell, Sidebar, Header, BottomNav
│   └── shared/              # Domain-agnostic shared components
├── features/
│   ├── dashboard/           # Health metrics, summary cards
│   ├── appointments/        # Booking, history, admin management
│   ├── professionals/       # Directory, profiles, search
│   ├── partners/            # Discounts, categories, redemption
│   ├── exams/               # Result list, viewer, status tracking
│   ├── pharmacies/          # On-duty schedule, auto-update
│   ├── radio/               # ViTTA Radio streaming widget
│   └── admin/               # Full CRUD panel, user management
├── hooks/
│   ├── useAuth.ts           # Firebase Auth state and helpers
│   ├── useFirestore.ts      # Generic Firestore CRUD hook
│   ├── useAppointments.ts
│   ├── useProfessionals.ts
│   ├── usePartners.ts
│   └── useExams.ts
├── lib/
│   ├── firebase.ts          # Firebase app initialization
│   ├── firestore.ts         # Firestore instance and helpers
│   └── storage.ts           # Storage upload/download helpers
├── pages/                   # Route-level page components
├── routes/
│   ├── AppRouter.tsx        # React Router v6 configuration
│   ├── ProtectedRoute.tsx   # Role-based route guard
│   └── AdminRoute.tsx       # Admin-only route guard
├── types/                   # Global TypeScript type definitions
│   ├── user.ts
│   ├── appointment.ts
│   ├── professional.ts
│   └── ...
└── utils/                   # Pure utility functions
```

### 3.2 Routing Strategy

```typescript
// Route structure (React Router v6)
/                     → Dashboard (requires auth)
/appointments         → Appointment list + booking
/professionals        → Directory with search/filter
/professionals/:id    → Professional profile
/partners             → Partner categories
/partners/:category   → Partner list by category
/exams                → Exam result repository
/pharmacies           → On-duty pharmacies
/radio                → ViTTA Radio
/profile              → User profile + health settings
/auth/login           → Login page
/auth/register        → Registration page
/admin                → Admin panel (requires role: admin)
/admin/users          → User management
/admin/professionals  → Professional CRUD
/admin/partners       → Partner CRUD
/admin/exams          → Exam management
/admin/pharmacies     → Pharmacy schedule management
/admin/offers         → Offer/promotion management
/admin/settings       → App configuration + radio settings
```

### 3.3 Authentication Flow

```
User visits protected route
        │
        ▼
useAuth() checks Firebase Auth state
        │
  ┌─────┴─────┐
  │           │
Not logged  Logged in
  │           │
  ▼           ▼
Redirect   Check custom claim (role)
/auth/login   │
         ┌────┴────┐
         │         │
       user      admin
         │         │
         ▼         ▼
    User routes  Admin routes
    accessible   accessible
```

**Role claims are set via Firebase Admin SDK (Cloud Function)** when a user is promoted to admin. Firestore Security Rules validate the same claims server-side.

---

## 4. Firebase Data Model

### 4.1 Collections Schema

#### `users`
```typescript
{
  uid: string;                    // Firebase Auth UID (document ID)
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  healthPreferences: {
    dailyStepsGoal: number;       // default: 8000
    dailyWaterGoal: number;       // ml, default: 2000
    sleepGoal: number;            // hours, default: 8
  };
  healthMetrics: {
    steps: number;
    heartRate: number;
    waterIntake: number;          // ml consumed today
    sleepHours: number;
    lastUpdated: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `appointments`
```typescript
{
  id: string;                     // Auto-generated document ID
  userId: string;                 // ref: users.uid
  professionalId: string;         // ref: professionals.id
  professionalName: string;       // denormalized for display
  specialty: string;              // denormalized for display
  scheduledAt: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `professionals`
```typescript
{
  id: string;
  name: string;
  specialty: string;
  categoryId: string;             // ref: categories.id
  registrationNumber: string;     // CRM / CRP
  city: string;
  state: string;
  consultationPrice: number;      // BRL
  rating: number;                 // 0–5
  reviewCount: number;
  bio?: string;
  avatarUrl?: string;
  whatsappNumber: string;         // for appointment deep link
  available: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `partners`
```typescript
{
  id: string;
  name: string;
  categoryId: string;             // ref: categories.id
  description: string;
  logoUrl?: string;
  discountDescription: string;    // e.g. "15% off all products"
  whatsappNumber: string;         // for benefit redemption
  website?: string;
  active: boolean;
  createdAt: Timestamp;
}
```

#### `categories`
```typescript
{
  id: string;
  name: string;
  type: 'professional' | 'partner' | 'both';
  iconName: string;               // Lucide icon name
  order: number;                  // display order
}
```

#### `exams`
```typescript
{
  id: string;
  userId: string;                 // ref: users.uid
  name: string;                   // e.g. "Hemograma Completo"
  type: string;                   // e.g. "Sangue", "Imagem"
  status: 'pending' | 'ready' | 'scheduled';
  scheduledAt?: Timestamp;
  resultUrl?: string;             // Firebase Storage URL
  resultFileName?: string;
  lab?: string;
  requestedBy?: string;           // doctor name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `offers`
```typescript
{
  id: string;
  partnerId: string;              // ref: partners.id
  title: string;
  description: string;
  imageUrl?: string;
  discount: number;               // percentage
  validUntil?: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}
```

#### `pharmacies`
```typescript
{
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsappNumber?: string;
  onDutyDates: string[];          // ISO date strings: ["2025-01-15", "2025-01-22"]
  openingHours: string;           // e.g. "08:00–22:00"
  active: boolean;
}
```

### 4.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users: read own profile, admin reads all
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Appointments: user sees own, admin sees all
    match /appointments/{appointmentId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Professionals, Partners, Categories, Pharmacies: public read, admin write
    match /professionals/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /partners/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /categories/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /pharmacies/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /offers/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Exams: user sees own only
    match /exams/{examId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

## 5. Key Feature Implementations

### 5.1 Health Metrics Dashboard

- Metrics are stored in `users/{uid}.healthMetrics` and updated via the user's profile page.
- **Realtime listener** (`onSnapshot`) keeps the dashboard live without manual refresh.
- Steps, sleep, water intake, and heart rate are displayed as progress rings using CSS or a lightweight chart library.
- Future: Cloud Function scheduled daily at midnight to reset `steps` and `waterIntake`.

### 5.2 Appointment Booking Flow

```
User browses /professionals
        │
        ▼
Selects specialist → opens profile
        │
        ▼
Taps "Agendar" → generates WhatsApp deep link:
https://wa.me/{whatsappNumber}?text=Olá, gostaria de agendar uma consulta via ViTTA Health
        │
        ▼
Appointment record created in Firestore (status: 'pending')
        │
        ▼
Admin confirms via /admin/appointments → status: 'confirmed'
        │
        ▼
User sees updated status in /appointments
```

### 5.3 Pharmacies on Duty

- Firestore collection `pharmacies` stores `onDutyDates[]` per pharmacy.
- Frontend queries: `where('onDutyDates', 'array-contains', todayISOString)`.
- Admin updates the schedule weekly via `/admin/pharmacies`.
- No Cloud Function needed — the date comparison is client-side.

### 5.4 Partner Discount Redemption

```
User opens /partners → browses by category
        │
        ▼
Selects partner → views discount details
        │
        ▼
Taps "Resgatar Benefício" → WhatsApp deep link:
https://wa.me/{whatsappNumber}?text=Olá, sou cliente ViTTA Health e gostaria de utilizar o desconto de {discountDescription}
```

### 5.5 ViTTA Radio

- Widget is a persistent bottom bar rendered in the AppShell layout.
- Streams an external audio URL via the HTML5 `<audio>` API.
- Stream URL is configured in Firestore (`/config/radio`) by the admin.
- State (playing/paused, volume) lives in a React context so it persists across route changes.

---

## 6. Cloud Functions

### 6.1 `onUserCreate` — Set default role
```typescript
// Triggered: Firebase Auth onCreate
// Action: Sets custom claim role='user' and creates Firestore user document
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, { role: 'user' });
  await admin.firestore().collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    name: user.displayName || '',
    role: 'user',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
```

### 6.2 `setAdminRole` — Promote user to admin
```typescript
// Triggered: HTTPS callable (admin only)
export const setAdminRole = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') throw new functions.https.HttpsError('permission-denied', 'Admins only');
  await admin.auth().setCustomUserClaims(data.uid, { role: 'admin' });
  await admin.firestore().collection('users').doc(data.uid).update({ role: 'admin' });
});
```

### 6.3 `sendAppointmentNotification` — Push on status change
```typescript
// Triggered: Firestore onUpdate for appointments/{id}
// Action: Sends FCM push notification when status changes to 'confirmed' or 'cancelled'
```

---

## 7. Custom Hooks Reference

### `useAuth`
```typescript
const { user, loading, role, signIn, signOut, signUp } = useAuth();
// user: Firebase User | null
// role: 'user' | 'admin' | null
// loading: boolean (true while resolving auth state)
```

### `useFirestore` (generic)
```typescript
const { data, loading, error, add, update, remove } = useFirestore<T>('collectionName');
// Wraps onSnapshot for realtime data + CRUD helpers
```

### `useProfessionals`
```typescript
const { professionals, loading, filterBySpecialty, search } = useProfessionals();
// Returns filtered list; search is client-side on the loaded dataset
```

### `useExams`
```typescript
const { exams, loading, getByStatus } = useExams(userId);
// Scoped to current user; getByStatus('ready') returns filtered array
```

---

## 8. Environment Variables

```env
# .env (Vite — all variables must be prefixed with VITE_)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

---

## 9. Non-Functional Requirements

| Concern | Approach |
|---|---|
| Performance | Lazy-load all feature routes via `React.lazy()` + `Suspense` |
| Offline | PWA service worker caches shell + last-viewed data |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigation on modals |
| Security | Firestore rules as source of truth; never trust client-side role checks alone |
| Scalability | Firestore horizontal scales natively; Functions scale per-invocation |
| SEO | Not a priority (auth-gated app); basic meta tags only |
| Error handling | Global error boundary + per-feature inline error states |

---

## 10. Roadmap (Not Yet Implemented)

| Feature | Complexity | Notes |
|---|---|---|
| Telemedicine (video) | High | Evaluate Daily.co or Agora SDK |
| Wearable sync | Medium | Apple HealthKit + Google Fit APIs |
| Prescription management | Medium | New Firestore collection + Storage |
| Gamification / badges | Low | Client-side logic + `users.badges[]` array |
| Mobile app | High | React Native + Firebase React Native SDK |
| Notifications (push) | Medium | FCM via Cloud Functions (foundation exists) |

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **CRM** | Conselho Regional de Medicina — Brazilian medical registration number |
| **CRP** | Conselho Regional de Psicologia — Psychology registration number |
| **Plantão** | On-duty pharmacy shift (pharmacies rotate coverage) |
| **Admin** | Platform operator; manages all content and users |
| **Professional** | Healthcare specialist listed in the directory |
| **Partner** | Commercial establishment offering member discounts |
