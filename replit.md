# Overview

This is a mobile-first full-stack web application inspired by Rizz AI that provides AI-powered chat enhancement through image analysis with user authentication. The primary feature allows users to upload screenshots of chat conversations, which are then analyzed using OpenAI's GPT-4o model to extract text and generate contextually appropriate reply suggestions in different tones (flirty, funny, respectful, sarcastic). The app features a clean retro-styled mobile UI with comprehensive OCR capabilities, cost-optimized hybrid AI model strategy (95% cost savings), and secure user authentication via Supabase with personalized data storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom retro theme variables and design system
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Data Storage**: In-memory storage using Map data structures (privacy-first approach)
- **File Processing**: Built-in image processing for OCR functionality
- **Middleware**: Custom logging middleware for API request tracking

## Database and Storage
- **Primary Storage**: Supabase PostgreSQL with Drizzle ORM configured
- **User Data**: Secure authentication with users, sessions, chat analysis, and pickup lines storage
- **Schema Management**: Drizzle Kit for database migrations and schema generation
- **Connection**: Supabase pooler connection via postgres-js driver

## Authentication and Security
- **User Authentication**: Complete JWT-based authentication system with Supabase
- **Session Management**: Database-stored sessions with secure token validation
- **Password Security**: Bcrypt hashing with salt rounds for secure password storage
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Privacy Design**: User-controlled data storage with optional authentication
- **Input Sanitization**: Comprehensive validation for image uploads and text inputs

## AI Integration
- **Cost-Optimized Strategy**: Hybrid model approach - GPT-4o mini for text generation (95% cost savings), GPT-4o for image analysis
- **Image Processing**: Vision API for OCR and chat message extraction
- **Response Formatting**: Structured JSON responses with error handling
- **Tone Customization**: Multi-tone reply generation (flirty, funny, respectful, sarcastic)
- **Performance**: Maintained quality while achieving 90%+ overall cost reduction

## File Structure
- **`/client`**: React frontend application with component-based architecture
- **`/server`**: Express.js backend with route handlers and services
- **`/shared`**: Common TypeScript types and Zod schemas shared between client and server
- **Component Organization**: Atomic design with reusable UI components and custom retro-styled elements

# External Dependencies

## Database Services
- **Supabase**: PostgreSQL database hosting with authentication
- **Drizzle ORM**: Type-safe database queries and schema management
- **postgres-js**: PostgreSQL client for database connections

## AI Services
- **OpenAI API**: GPT-4o model for text generation and image analysis
- **Vision API**: Integrated OCR capabilities for chat image processing

## UI and Design
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Google Fonts**: Custom typography (Space Mono, Quicksand)

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **Replit Integration**: Development environment plugins and error overlay

## Frontend Libraries
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing solution
- **React Hook Form**: Form state management
- **Authentication**: React Context API for user state management
- **Class Variance Authority**: Type-safe CSS class variants
- **CLSX/Tailwind Merge**: Conditional CSS class utilities

## Authentication Libraries
- **bcrypt**: Secure password hashing
- **jsonwebtoken**: JWT token generation and validation
- **Local Storage**: Client-side session persistence