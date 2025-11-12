# Christ's Loving Hands - Loads of Love Event Scheduling Application

## Overview
This project is a mobile-first event scheduling application for the Christ's Loving Hands "Loads of Love" free laundry program. Its core purpose is to enable community members to reserve free laundry time slots and provide administrators with comprehensive tools for managing events, registrations, and user access. The application aims to streamline the process of connecting those in need with essential laundry services.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a clean, mobile-first interface designed with a responsive approach. It utilizes Radix UI components styled with shadcn/ui and Tailwind CSS, ensuring accessibility and a consistent user experience. Interactive cards display event details and availability, while registration forms are inline for a streamlined user flow.

### Technical Implementations

#### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: Zustand (authentication), React Query (server state)
- **UI Framework**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS, custom CSS variables
- **Build Tool**: Vite

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM (hosted on Neon)
- **Authentication**: JWT tokens, bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store
- **Recurring Event Automation**: Hourly scheduled job to create monthly events, using America/New_York timezone for calculations.

#### Feature Specifications
- **Public User Flow**: Landing page, time slot selection, inline registration form, email/SMS confirmation with unique cancel tokens.
- **Admin Dashboard**: Event creation/editing/cloning/deletion, registration management (including waitlists and no-show tracking), blacklist management, and protected routes with JWT-based login.
- **SMS Webhook Integration**: Webhook support for SMS messaging, sending registration data to a configured URL upon user registration.
- **Waitlist Functionality**: Notification-based waitlist system, notifying members when slots become available.
- **Admin Notifications**: Automated email notifications to administrators for new registrations, cancellations, waitlist additions, and all admin actions impacting slot availability.
- **Calendar Integration**: "Add to Calendar" buttons (Google, Outlook, Yahoo) in confirmation emails.
- **Security**: Server-side zip code validation, blacklist protection, unique cancel tokens, HTTP-only cookies for admin sessions.
- **Date Handling**: Consistent local date parsing without UTC conversion to prevent timezone-related display issues.

### System Design Choices
- **Mobile-First Design**: Prioritizes the mobile user experience.
- **Real-time Updates**: React Query provides near real-time data synchronization.
- **Blacklist Protection**: Prevents blocked users from registering.
- **Unique Cancel Tokens**: Ensures user privacy for cancellations.
- **Idempotent Event Creation**: Prevents duplicate recurring events.

## External Dependencies

- **Database**: Neon (serverless PostgreSQL), @neondatabase/serverless for connection pooling, Drizzle Kit for migrations.
- **Email Services**: SendGrid (for transactional emails including confirmations, reminders, and admin notifications).
- **SMS**: A VOIP service API for text message notifications.
- **UI Components**: Lucide React (icons), Date-fns (date manipulation).