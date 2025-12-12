# QORSCEND Frontend

A modern, beautiful, and clean frontend for the QORSCEND quantum computing tools suite. This Next.js application provides a comprehensive interface for quantum code conversion, benchmarking, data analysis, and workflow automation.

## 🚀 Features

### ✅ Authentication & User Management
- **OAuth Integration**: Google and GitHub login support
- **JWT Sessions**: Secure token-based authentication
- **User Profiles**: Manage account settings and preferences
- **Subscription Management**: View and manage subscription tiers

### ✅ Core Tools

#### QCode Convert™
- Convert quantum code between different Python libraries (Qiskit, Cirq, Braket, PennyLane, PyQuil)
- Real-time syntax validation
- Code preview and comparison
- Conversion history tracking
- Library-specific guides and examples

#### QBenchmark Live™
- Real-time quantum provider performance metrics
- Live queue time monitoring
- Cost comparison across providers
- Error rate tracking
- Provider availability status
- Performance analytics and charts

#### QData Clean™
- Upload and process quantum experiment data
- Support for JSON and CSV formats
- Data normalization and cleaning
- Statistical analysis and visualization
- Export capabilities
- File storage with pre-signed URLs

### ✅ Workflows
- **Pipeline Builder**: Create automated workflows combining multiple tools
- **Templates**: Pre-built workflow templates for common use cases
- **History**: Track and manage workflow execution history
- **Real-time Monitoring**: Live status updates for running workflows

### ✅ Billing & Subscriptions
- **Subscription Plans**: Free, Pro, and Enterprise tiers
- **Payment Methods**: Credit card and PayPal integration
- **Billing History**: Invoice management and download
- **Usage Tracking**: Monitor feature usage and limits

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Authentication**: JWT with OAuth providers
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📁 Project Structure

```
qorscend/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (backend integrated)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── convert/              # Code conversion endpoint
│   │   ├── qcode-convert/        # Code conversion routes
│   │   ├── qdata-clean/          # Data processing routes
│   │   ├── quantum-libraries/    # Library information
│   │   └── users/                # User endpoints
│   ├── dashboard/                # Dashboard and tool pages
│   │   ├── qcode-convert/        # Code conversion tool
│   │   ├── qbenchmark-live/      # Live benchmarking
│   │   ├── qdata-clean/          # Data processing
│   │   ├── workflows/            # Workflow management
│   │   └── billing/              # Subscription & billing
│   ├── signup/                   # Signup page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── qcode-convert/            # Code conversion components
│   ├── qbenchmark-live/          # Benchmarking components
│   ├── qdata-clean/              # Data processing components
│   ├── workflows/                # Workflow components
│   ├── billing/                  # Billing components
│   ├── ui/                       # shadcn/ui components
│   └── theme-provider.tsx        # Theme configuration
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions and backend code
│   └── backend/                  # Backend code (integrated)
│       ├── config/               # Configuration files
│       ├── models/               # Mongoose models
│       ├── services/             # Business logic
│       └── middleware/           # Auth middleware
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- MongoDB database (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qorscend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the `qorscend` directory:
   ```env
   # Database Configuration (Required)
   MONGODB_URI=mongodb://localhost:27017/qorscend
   
   # JWT Configuration (Required)
   JWT_SECRET=your-super-secure-jwt-secret-key
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Optional: OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) for development

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | No (default: 7d) |
| `NODE_ENV` | Environment (development/production) | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | No |

### API Routes

The application uses Next.js API routes (backend integrated):

- **Authentication**: `/api/auth/*` (register, login, me, profile, password, google, github)
- **Code Conversion**: `/api/convert` and `/api/qcode-convert/convert`
- **Conversion History**: `/api/history` and `/api/qcode-convert/history`
- **Data Processing**: `/api/qdata-clean/upload` and `/api/qdata-clean/files`
- **Quantum Libraries**: `/api/quantum-libraries`
- **User Stats**: `/api/users/stats`

## 🎨 UI Components

The application uses shadcn/ui components for a consistent and modern design:

- **Cards**: Information display and grouping
- **Buttons**: Actions and navigation
- **Forms**: Data input and validation
- **Tables**: Data display and sorting
- **Charts**: Data visualization
- **Modals**: Overlay dialogs
- **Navigation**: Sidebar and breadcrumbs

## 🔐 Security Features

- **JWT Authentication**: Secure token-based sessions
- **OAuth Integration**: Third-party authentication
- **CORS Protection**: Cross-origin request handling
- **Input Validation**: Client-side and server-side validation
- **Secure File Upload**: Pre-signed URLs for file storage

## 📊 Data Flow

1. **Authentication**: User logs in via OAuth or credentials
2. **API Calls**: Frontend makes authenticated requests to backend
3. **Data Processing**: Backend processes requests and returns responses
4. **State Management**: Frontend updates UI based on responses
5. **Real-time Updates**: WebSocket connections for live data

## 🧪 Testing

Note: Test scripts are not currently configured. To add testing:

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Add test scripts to package.json
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🚀 Deployment

The application can be deployed to various platforms:

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Static site hosting
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: See `MIGRATION_COMPLETE.md` for integration details
- **Environment Setup**: See `.env.local` file or `ENV_EXAMPLE.md`
- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub Discussions for questions

## 🔄 API Integration Examples

### Code Conversion
```typescript
const response = await fetch('/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sourceLibrary: 'qiskit',
    targetLibrary: 'cirq',
    code: inputCode
  })
})
```

### File Upload
```typescript
// Upload file metadata
const uploadResponse = await fetch('/api/qdata-clean/upload', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    filename, 
    originalName, 
    contentType, 
    size, 
    description, 
    tags 
  })
})
const fileData = await uploadResponse.json()
```

### Get User Stats
```typescript
const response = await fetch('/api/users/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const stats = await response.json()
```

This frontend provides a complete, modern interface for all the backend functionality while maintaining a clean, professional design that's easy to use and navigate.
