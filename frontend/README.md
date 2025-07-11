# ROBOHR Frontend

AI-Enabled Next Generation HRMS Frontend Application

## Features

- 🎨 **Modern UI**: Built with React 18 and Tailwind CSS
- 🌍 **Multi-language**: Support for English, Spanish, and French
- 🎤 **Voice Commands**: AI-powered voice interface
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Built-in dark/light theme toggle
- ⚡ **Fast**: Optimized performance with React Query
- 🔐 **Secure**: JWT-based authentication
- ♿ **Accessible**: WCAG compliant interface

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Setup:**
```bash
./start.sh
```

2. **Manual Setup:**
```bash
npm install
cp .env.example .env
npm start
```

### Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout/      # Layout components
│   │   ├── UI/          # UI components
│   │   └── Forms/       # Form components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── contexts/        # React contexts
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── i18n/            # Internationalization
│   └── assets/          # Images, icons, etc.
├── tests/               # Test files
└── package.json
```

## Pages

- **Dashboard**: Overview and quick actions
- **Employees**: Employee management
- **Attendance**: Time tracking and leave management
- **Payroll**: Salary processing and reports
- **Recruitment**: Job posting and applications
- **Performance**: Goals and reviews
- **AI Command Center**: Voice/text commands
- **Analytics**: Reports and insights
- **Settings**: User preferences and admin

## API Integration

The frontend connects to:
- **Backend API**: `http://localhost:5000` (Express.js)
- **AI Service**: `http://localhost:8000` (FastAPI)

## Features

### Authentication
- JWT-based login
- Role-based access control
- Demo accounts for testing

### AI Command Center
- Voice-to-text commands
- Natural language processing
- Multi-language support
- Text-to-speech responses

### Multi-language
- English, Spanish, French
- RTL support ready
- Dynamic language switching

### Theme Support
- Light/Dark mode
- System preference detection
- Persistent theme selection

## Environment Variables

```bash
# API URLs
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_URL=http://localhost:8000

# Feature flags
REACT_APP_ENABLE_VOICE=true
REACT_APP_ENABLE_ANALYTICS=true

# External services
REACT_APP_GOOGLE_ANALYTICS_ID=
REACT_APP_SENTRY_DSN=
```

## Technologies

- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React Query**: Data fetching
- **React Router**: Navigation
- **i18next**: Internationalization
- **Lucide React**: Icons
- **React Hook Form**: Form management
- **Framer Motion**: Animations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Lighthouse score: 90+

## Accessibility

- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- High contrast mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit a pull request

## Deployment

### Production Build
```bash
npm run build
```

### Docker
```bash
docker build -t robohr-frontend .
docker run -p 3000:3000 robohr-frontend
```

### Environment-specific builds
- Development: Auto-reload, debugging
- Staging: Production build with debugging
- Production: Optimized, minified
