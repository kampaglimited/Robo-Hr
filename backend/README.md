# ROBOHR Backend

AI-Enabled Next Generation HRMS Backend Service

## Features

- Employee Management
- Attendance & Leave Management
- Payroll Processing
- Recruitment Management
- Performance Management
- AI Command Center
- Analytics & Reports
- Admin & Settings

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone and setup:
```bash
git clone <repository>
cd backend
./start.sh
```

2. Or manual setup:
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### API Endpoints

- **Health Check**: `GET /health`
- **Employees**: `GET|POST|PUT|DELETE /api/employee`
- **Attendance**: `GET|POST /api/attendance`
- **Payroll**: `GET|POST /api/payroll`
- **Commands**: `POST /api/command/text`
- **Admin**: `POST /api/admin/login`

### Authentication

Most endpoints require JWT authentication:
```bash
Authorization: Bearer <jwt_token>
```

### Testing

```bash
npm test
npm run test:watch
```

### Production Deployment

```bash
npm install --production
NODE_ENV=production npm start
```

Or with PM2:
```bash
pm2 start ecosystem.config.js --env production
```
