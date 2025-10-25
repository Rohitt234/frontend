# Krushi Mitra - Farmer Support Platform

## Overview
Krushi Mitra (Friend of Farmers) is a comprehensive digital platform that brings guidance, government schemes, product listings, weather updates, and expert Q&A into a single farmer-friendly interface.

**Project Type**: Static Frontend Web Application (HTML/CSS/JavaScript)
**Last Updated**: October 25, 2025
**Status**: Active Development

## Features
- **Multi-role Authentication**: Farmer, Expert, Visitor, and Admin roles
- **Crop Guidance**: Personalized crop suggestions and best practices
- **Expert Support**: Q&A system for farmers to ask agriculture experts
- **Weather & Market**: Real-time weather and market price tracking
- **Schemes & Subsidies**: Government scheme information
- **Product Listings**: Agricultural products and supplies

## Architecture

### Frontend
- Pure HTML5, CSS3, and vanilla JavaScript
- No build process required
- Responsive design with mobile support
- Modal-based authentication flows

### Backend Integration
- Designed to work with Spring Boot backend at `/api` endpoint
- Fallback to mock data when backend is unavailable
- API endpoints expected:
  - `/api/auth/login` - User authentication
  - `/api/auth/register` - User registration
  - `/api/questions/public` - Public questions
  - `/api/crops` - Crop recommendations
  - `/api/government-schemes/public` - Government schemes
  - `/api/weather/:location` - Weather data
  - `/api/market-prices` - Market prices

### Current Setup
- Static file server using Python's http.server module
- Served on port 5000 for Replit compatibility
- Mock mode enabled when backend API is unavailable

## File Structure
```
.
├── index.html              # Landing page with role selection
├── farmer-dashboard.html   # Farmer dashboard
├── expert-dashboard.html   # Expert Q&A interface
├── admin.html             # Admin panel
├── visitor.html           # Public visitor view
├── schemes.html           # Government schemes page
├── products.html          # Products listing
├── weather.html           # Weather information
├── qa.html               # Q&A page
├── main.js               # Main JavaScript with API integration
├── style.css             # Global styles
└── replit.md            # This file
```

## Development Notes

### Running Locally
The application runs on a simple Python HTTP server:
```bash
python3 -m http.server 5000
```

### Mock Data
When the backend is unavailable, the application automatically falls back to mock data stored in `main.js` for:
- User authentication (stored in localStorage)
- Questions and answers
- Crop recommendations
- Government schemes
- Market prices
- Weather information

## User Preferences
- No specific preferences recorded yet

## Recent Changes
- **2025-10-25**: Initial import and Replit environment setup
  - Configured Python HTTP server on port 5000
  - Added .gitignore for common files
  - Created replit.md documentation
