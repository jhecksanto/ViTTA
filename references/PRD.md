# Product Requirements Document (PRD) - ViTTA Health

## 1. Product Overview
**ViTTA Health** is a comprehensive healthcare management platform designed to bridge the gap between patients, healthcare professionals, and commercial partners. The application provides users with tools to track their health metrics, manage medical appointments, access exam results, and benefit from exclusive discounts at partner establishments.

## 2. Target Audience
- **General Users:** Individuals looking for a centralized way to manage their health, appointments, and access healthcare-related benefits.
- **Healthcare Professionals:** Specialists looking to offer their services through a streamlined platform.
- **Commercial Partners:** Businesses (pharmacies, gyms, etc.) looking to offer exclusive discounts to a health-conscious audience.
- **Administrators:** System managers who oversee the ecosystem, manage users, and curate partnerships.

## 3. Key Features

### 3.1. User Dashboard
- **Health Metrics Tracking:** Real-time monitoring of steps, sleep, heart rate, and water intake.
- **Summary View:** Quick access to upcoming appointments and active health stats.

### 3.2. Appointment Management
- **Booking System:** Users can browse professionals by specialty and request appointments via WhatsApp integration.
- **Appointment History:** View upcoming and past consultations.
- **Admin Control:** Administrators can manage, reschedule, or cancel appointments.

### 3.3. Professional Directory
- **Specialist Search:** Browse healthcare professionals with ratings, reviews, and availability.
- **Detailed Profiles:** Includes registration numbers (CRM/CRP), cities of operation, and consultation prices.

### 3.4. Partnership Ecosystem
- **Exclusive Discounts:** Access to a wide range of partners (pharmacies, optics, gyms) with member-only offers.
- **Category Browsing:** Partners organized by industry for easy discovery.
- **Benefit Redemption:** Direct link to claim discounts via WhatsApp.

### 3.5. Medical Exams
- **Result Repository:** Centralized location to view and download exam results.
- **Status Tracking:** Monitor if exams are pending, ready, or scheduled.

### 3.6. Pharmacies on Duty
- **Real-time On-Call Info:** View which pharmacies are currently on duty in the region.
- **Automatic Updates:** Blocks are automatically updated based on the current date.

### 3.7. Entertainment & Engagement
- **ViTTA Radio:** Built-in streaming radio for user engagement within the app.

### 3.8. Administrative Panel
- **User Management:** Oversee user profiles and account statuses.
- **Content Management:** Full CRUD (Create, Read, Update, Delete) capabilities for professionals, partners, exams, and offers.
- **System Configuration:** Manage radio streams and global app settings.

## 4. User Personas

### 4.1. Maria (The Health-Conscious User)
- **Goal:** Wants to keep all her medical info in one place and save money on her monthly vitamins.
- **Usage:** Checks her step count daily, books her nutritionist through the app, and uses the pharmacy discount.

### 4.2. Dr. Ricardo (The Specialist)
- **Goal:** Wants to reach more local patients without complex marketing.
- **Usage:** Maintains an updated profile on ViTTA to receive appointment requests directly.

### 4.3. João (The Admin)
- **Goal:** Ensure the platform data is accurate and partnerships are active.
- **Usage:** Updates the "Pharmacies on Duty" list weekly and approves new partner offers.

## 5. Technical Stack
- **Frontend:** React with Vite, TypeScript.
- **Styling:** Tailwind CSS, Lucide React (Icons), Motion/React (Animations).
- **Backend/Database:** Firebase (Firestore, Authentication).
- **State Management:** React Hooks (useState, useEffect).

## 6. Data Model (Firestore)
- `users`: Profiles, roles, and health preferences.
- `appointments`: Consultation details and statuses.
- `professionals`: Specialist data, registration info, and pricing.
- `partners`: Commercial partner info and discount details.
- `categories`: Taxonomies for professionals and partners.
- `exams`: Medical result records.
- `offers`: Promotional content.
- `pharmacies`: On-call schedule data.

## 7. Future Roadmap
- **Telemedicine Integration:** Direct video consultations within the app.
- **Wearable Sync:** Automatic data import from Apple Health and Google Fit.
- **Prescription Management:** Digital storage for medical prescriptions.
- **Gamification:** Rewards and badges for achieving health goals.
