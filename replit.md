# Overview

This is a mobile-first full-stack web application inspired by Rizz AI that provides AI-powered chat enhancement through image analysis. The primary feature allows users to upload screenshots of chat conversations, which are then analyzed using OpenAI's GPT-4o model to extract text and generate contextually appropriate reply suggestions in different tones (flirty, funny, respectful, sarcastic). The app features a clean retro-styled mobile UI with comprehensive OCR capabilities and privacy-first design (no permanent data storage).

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
- **Primary Storage**: PostgreSQL with Drizzle ORM configured
- **Development Storage**: In-memory storage implementation for privacy
- **Schema Management**: Drizzle Kit for database migrations and schema generation
- **Connection**: Neon Database serverless PostgreSQL adapter

## Authentication and Security
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Privacy Design**: Temporary in-memory storage to avoid persistent data retention
- **Input Sanitization**: Comprehensive validation for image uploads and text inputs

## AI Integration
- **Provider**: OpenAI GPT-4o model for text generation and image analysis
- **Image Processing**: Vision API for OCR and chat message extraction
- **Response Formatting**: Structured JSON responses with error handling
- **Tone Customization**: Multi-tone reply generation (flirty, funny, respectful, sarcastic)

## File Structure
- **`/client`**: React frontend application with component-based architecture
- **`/server`**: Express.js backend with route handlers and services
- **`/shared`**: Common TypeScript types and Zod schemas shared between client and server
- **Component Organization**: Atomic design with reusable UI components and custom retro-styled elements

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and schema management
- **Connect-pg-simple**: PostgreSQL session store for Express

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
- **Class Variance Authority**: Type-safe CSS class variants
- **CLSX/Tailwind Merge**: Conditional CSS class utilities