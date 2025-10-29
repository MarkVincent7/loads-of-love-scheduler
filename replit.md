# Christ's Loving Hands - Loads of Love Event Scheduling Application

## Overview

This is a mobile-first event scheduling application for Christ's Loving Hands "Loads of Love" free laundry program. The application allows community members to reserve time slots for free laundry events and provides administrators with tools to manage events, registrations, and user access.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 29, 2025**
- **CRITICAL FIX**: Fixed recurring event date calculation bug that generated events on Mondays instead of Tuesdays
- Root cause: Date calculations at midnight UTC converted to previous day (Monday) in Eastern Time
- Solution: Simplified getNthWeekdayOfMonth function to create dates at noon instead of midnight
- Verified fix generates events on correct Tuesday dates (2nd and 4th Tuesday of each month)
- All auto-generated events now correctly appear on Tuesdays as intended

**October 16, 2025**
- **DST HANDLING FIX**: Fixed timezone bug in recurring event automation that caused 1-hour time shift
- Events created across DST boundaries (October EDT vs November EST) displayed incorrect times
- Implemented proper DST-aware time slot cloning using date-fns-tz library
- Time slots now preserve Eastern Time display (9:30 AM) regardless of DST changes
- Template events in EDT correctly clone to EST months with same Eastern Time display

**October 14, 2025**
- **RECURRING EVENT AUTOMATION**: Implemented automatic monthly event creation system
- Added scheduled job that runs hourly to check for recurring event creation
- Morning Loads of Love Event automatically duplicates on Wednesday after 2nd Tuesday for next month's 2nd Tuesday
- Evening Loads of Love automatically duplicates on Wednesday after 4th Tuesday for next month's 4th Tuesday
- All automation uses America/New_York timezone for accurate date calculations
- Implemented idempotent event creation - system prevents duplicate event creation for the same month
- Added database tracking table (recurring_event_tracking) to record created events by type and month
- Created utility functions for calculating nth weekday of month (2nd Tuesday, 4th Tuesday, etc.)
- System finds template events by title ("Morning Loads of Love" and "Evening Loads of Love")
- Automatically clones all event details including time slots, capacity, and location information
- Comprehensive logging shows automation status and event creation confirmations

**September 3, 2025**
- **CRITICAL SECURITY FIX**: Fixed zip code restriction bypass vulnerability
- Server-side validation was completely missing for zip code restrictions
- Users could bypass frontend validation using direct API calls, browser dev tools, or disabled JavaScript
- Added proper server-side zip code validation in shared schema with VALID_ZIP_CODES array
- Server now correctly rejects registrations with invalid zip codes (returns 400 error)
- Zip code validation is now enforced on both frontend and backend for security
- Updated shared schema to make zipCode required field instead of optional
- Frontend and backend now share the same VALID_ZIP_CODES constant for consistency
- Testing confirmed: invalid zip codes (99999) are rejected, valid zip codes (45247) are accepted

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
- Implemented complete waitlist functionality with automatic promotion and email notifications
- Added yellow "Join Waitlist" buttons for full time slots with waitlist count display  
- Created waitlist confirmation and promotion emails with professional styling
- Redesigned time slot cards with improved date/time formatting and clear action buttons
- Enhanced visual hierarchy with structured event information display (Event Date, Event Time, Slots Left, Event Location)
- Added laundromat name and address fields to event creation form in admin dashboard
- Updated time slot cards to display detailed laundromat information (name, address) when available
- Enhanced registration success page to properly handle waitlist vs confirmed status with color-coded indicators
- Updated database schema with laundromat_name and laundromat_address columns for detailed location information
- Redesigned waitlist system from automatic promotion to notification-based approach
- Simplified waitlist registration to collect only name and email (no full address details required)
- Created dedicated waitlist form component with streamlined user experience
- Added slot availability notification emails that link users to complete registration
- Updated time slot cards to open waitlist dialog instead of redirecting to full registration form
- Modified backend to notify all waitlist members when slots become available (no automatic promotion)
- Enhanced admin dashboard functionality to trigger waitlist notifications on all status changes
- Added waitlist notification system to admin actions: status updates, cancellations, deletions, and no-show markings
- All admin registration management actions now automatically notify waitlist when confirmed slots become available
- Fixed critical date display issue where events showed incorrect dates due to timezone conversion problems
- Updated event creation, editing, and cloning to use consistent local date parsing without UTC conversion
- Resolved discrepancy between admin dashboard date input (07/29/25) and public display (Monday 07/28)
- Implemented proper date handling across frontend forms and backend processing for accurate date display
- Added comprehensive admin notification system for Mark@ChristsLovingHands.org and Melanie@ChristsLovingHands.org
- Created automated email notifications for: new registrations, cancellations, waitlist additions
- All admin actions (status changes, deletions, no-show markings) now trigger notifications to administrators
- Email notifications include complete event and registrant details with professional styling
- Admin notifications use SendGrid with info@ChristsLovingHands.org as sender address
- Added calendar integration to confirmation emails with "Add to Calendar" buttons
- Calendar buttons support Google Calendar, Outlook, and Yahoo Calendar with proper event details
- Calendar events include event title, date, time, location, and detailed description for easy scheduling
- Enhanced confirmation emails to specify "3 loads of laundry for free" service offering
- Added duplicate cancel buttons at top and bottom of emails for better accessibility
- Added rich links to registration dashboard contact information for direct email and phone actions
- Added tabs to registration management: "Upcoming Events" and "Past Events" for better organization
- Events automatically transition to past events after all time slots conclude
- Modified duplicate registration logic to allow multiple registrations from same browser with different personal information
- Duplicate check now requires exact match of both email AND phone (full registrations) or just email (waitlist only)
- Fixed email reminder timezone issue where times were displayed in server timezone instead of Eastern Time
- Updated scheduler to use proper Eastern Time formatting for all reminder emails
- Added individual event print functionality to registration dashboard for confirmed registrations
- Print buttons added to each event header for targeted printing of specific events
- Print reports sorted by signup time with complete contact details (name, email, phone, address)
- Print layout optimized for individual events with professional formatting and signup timestamps

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