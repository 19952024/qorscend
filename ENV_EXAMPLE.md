# QORSCEND Environment Configuration

This document describes the environment variables needed for the QORSCEND application.

## Required Environment Variables

### Database Configuration
```env
MONGODB_URI=mongodb://localhost:27017/qorscend
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/qorscend?retryWrites=true&w=majority
```

### JWT Authentication
```env
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Server Configuration
```env
NODE_ENV=development
PORT=5000
```

## Optional Environment Variables

### CORS & URL Configuration
```env
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

### OAuth Configuration (Optional)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Payment Configuration (Optional)
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Development Flags
```env
DEV_CONTINUE_WITHOUT_DB=false
DEV_BYPASS_AUTH=false
```

## Setup Instructions

1. Copy this configuration to your `.env.local` file in the `qorscend` directory
2. Update `MONGODB_URI` with your actual database connection string
3. Generate a secure `JWT_SECRET` (use: `openssl rand -base64 32`)
4. Configure optional services (OAuth, payments) as needed
5. Restart the development server after making changes

## Notes

- The backend is integrated into Next.js, so no separate backend server is needed
- All API routes are accessible at `/api/*` paths
- For production, update URLs to match your deployment environment
- Never commit `.env.local` to version control (it's in .gitignore) 