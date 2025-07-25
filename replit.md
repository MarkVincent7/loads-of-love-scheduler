# Christ's Loving Hands - Loads of Love Event Scheduling Application

## Overview

This is a mobile-first event scheduling application for Christ's Loving Hands "Loads of Love" free laundry program. The application allows community members to reserve time slots for free laundry events and provides administrators with tools to manage events, registrations, and user access.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 25, 2025**
- Added delete registration functionality for admins
- Created delete confirmation dialog with warning messages
- Added automatic waitlist promotion when confirmed registrations are deleted
- Updated backend routes to separate cancel vs delete operations
- Identified MailerSend trial account limitations (quota reached, can only send to verified addresses)
- Switched email system from MailerSend to MailerLite, then to SendGrid
- Updated email configuration to use info@ChristsLovingHands.org domain  
- Implemented SendGrid integration with professional email templates
- Email system ready for immediate transactional email sending
- Redesigned registration management dashboard with chronological event organization
- Added expandable table view for event registrations with comprehensive details
- Implemented no-show tracking system with automatic blacklist functionality
- Enhanced backend storage methods for no-show processing and blacklist operations
- Updated registration status enum to include 'no_show' status for attendance tracking
- Replaced static status badges with interactive dropdown menus for quick status changes
- Fixed blacklist display routing and authentication issues
- Added remove functionality to blacklist management with proper API integration
- Fixed event creation display issue by adjusting date filtering in getActiveEvents method

**July 24, 2025**
- Fixed registration display issue in admin dashboard
- Resolved API route conflict between path-based and query-based endpoints
- Updated frontend authentication handling for admin routes
- Verified registration data flow from public form to admin dashboard
- All registration functionality now working correctly

**January 23, 2025**
- Removed header component from home page for embedding capability
- Created admin user creation script
- Set up default admin credentials (admin/password123)
- Admin login available at `/admin/login`

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for authentication state, React Query for server state
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Public User Flow
1. **Landing Page**: Clean, mobile-first interface displaying available time slots
2. **Time Slot Selection**: Interactive cards showing date, time, and availability
3. **Registration Form**: Inline form with name, email, phone validation
4. **Confirmation System**: Email and SMS notifications with unique cancel tokens

### Admin Dashboard
1. **Event Management**: Create, edit, clone, and delete events with time slots
2. **Registration Management**: View all registrations, manage waitlists
3. **Blacklist Management**: Add/remove users from blacklist with reason tracking
4. **Authentication**: Protected routes with JWT-based admin login

### Database Schema
- **Events**: Store event details (title, description, date, location)
- **Time Slots**: Individual bookable slots within events with capacity limits
- **Registrations**: User bookings with status tracking (confirmed/waitlist/cancelled)
- **Blacklist**: Blocked users with contact info and reason
- **Admins**: Administrative users with encrypted passwords

## Data Flow

### Registration Process
1. User selects time slot from available options
2. Form validation occurs client-side with Zod schemas
3. Server checks blacklist status before processing
4. Registration created with unique cancel token
5. Confirmation email/SMS sent asynchronously
6. Real-time UI updates reflect new availability

### Admin Operations
1. Admin authentication via JWT tokens stored in localStorage
2. Protected API routes verify admin permissions
3. Real-time data synchronization with React Query
4. Optimistic updates for better user experience

## External Dependencies

### Communication Services
- **Email**: MailerSend API for confirmation and reminder emails
- **SMS**: VOIP service API for text message notifications
- **Environment Variables**: Configure service credentials and endpoints

### Database
- **Neon**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless with WebSocket support
- **Migrations**: Drizzle Kit for schema management

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Date-fns**: Date formatting and manipulation

## Deployment Strategy

### Development
- **Hot Module Replacement**: Vite dev server with Express middleware
- **Type Safety**: Full TypeScript coverage across client and server
- **Development Tools**: Replit integration with runtime error overlay

### Production
- **Build Process**: Vite builds client assets, esbuild bundles server
- **Asset Serving**: Express serves static files from dist/public
- **Environment**: NODE_ENV-based configuration
- **Database**: Automatic schema deployment with Drizzle push

### Key Architectural Decisions

1. **Mobile-First Design**: Prioritizes mobile experience with responsive breakpoints
2. **Real-time Updates**: React Query provides 30-second polling for live availability
3. **Blacklist Protection**: Middleware prevents blocked users from registering
4. **Unique Cancel Tokens**: UUID-based cancellation links for user privacy
5. **Session Security**: HTTP-only cookies for admin sessions, JWT for API access
6. **Error Handling**: Graceful degradation with user-friendly error messages
7. **Accessibility**: Radix UI ensures WCAG-compliant components
8. **Performance**: Optimistic updates and efficient re-rendering strategies