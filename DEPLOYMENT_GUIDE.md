# Prime Academic Manager - Production Deployment Guide

This guide provides step-by-step instructions for deploying **Prime Academic Manager** across three production environments:
1. **Docker / Docker Compose** (Recommended for containerized deployment)
2. **PM2 Process Manager** (Recommended for bare-metal VPS or Linux/Windows Servers)
3. **Vercel + Render / Railway** (Cloud Serverless / Managed PaaS)

---

## 🛠️ Prerequisites

Before deploying, ensure you have configured your environment variables in `.env`:

```env
# Server Ports
PORT=3001

# Database Credentials
DATABASE_URL="postgresql://postgres.eekxnosfptejywsncowa:Happy%4026005TPC@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Security & Secrets
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Google Sheets Spreadsheet IDs
GOOGLE_SERVICE_ACCOUNT_EMAIL="sheets-database-connector@standard-gcp-project-485906.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_LOGIN_SHEET_ID="1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI"
GOOGLE_CLASSES_STUDENTS_SHEET_ID="1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs"
GOOGLE_ADMISSIONS_SHEET_ID="1StEreMtS9_mbt4Np-T0J4WK5ILwDqyxmtqwxw8ZebOA"
GOOGLE_DEPARTMENTS_SHEET_ID="1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA"
GOOGLE_HOMEWORK_SHEET_ID="1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8"
GOOGLE_COMPLAINT_SHEET_ID="1cQtrY026MlF7yvEg8YtsPyB_DKxTV9Da_0BC7W6E9Nw"
```

---

## Option 1: Docker Compose Deployment (Containerized)

### Step 1: Build & Launch Containers
Run the following command in the monorepo root directory:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 2: Check Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Step 3: Access Application
- **Frontend App**: `http://<your-server-ip>:3000`
- **Backend API**: `http://<your-server-ip>:3001/api/v1`
- **API Swagger Docs**: `http://<your-server-ip>:3001/api/docs`

---

## Option 2: PM2 Bare-Metal / VPS Deployment

### Step 1: Install PM2 Globally
```bash
npm install -g pm2
```

### Step 2: Build Production Code
```bash
npm run build
```

### Step 3: Start Services with PM2
```bash
pm2 start ecosystem.config.js
```

### Step 4: Save PM2 State & Auto-Start on Boot
```bash
pm2 save
pm2 startup
```

### Useful PM2 Operations:
- **Check Status**: `pm2 status`
- **View Live Logs**: `pm2 logs`
- **Restart Services**: `pm2 restart ecosystem.config.js`
- **Monitor System Usage**: `pm2 monit`

---

## Option 3: Cloud Hosting (Vercel + Render / Railway)

### Deploying Frontend to Vercel
1. Connect your GitHub repository to Vercel.
2. Set Root Directory to `apps/frontend`.
3. Framework Preset: **Next.js**.
4. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-api-domain.com/api/v1`
5. Click **Deploy**.

### Deploying Backend to Render / Railway / Fly.io
1. Create a Web Service on Render / Railway.
2. Set Root Directory to `apps/backend` or repository root.
3. Build Command: `npm run build --workspace=@prime/backend`
4. Start Command: `node apps/backend/dist/main.js`
5. Add all `.env` environment variables.
6. Click **Deploy Web Service**.

---

## 🔒 Security Best Practices for Production

1. **SSL/TLS Certificates**: Setup Nginx or Caddy reverse proxy with Let's Encrypt SSL certificates for HTTPS encryption.
2. **Environment Protection**: Ensure `.env` is never committed to public repositories.
3. **CORS Configuration**: In `apps/backend/src/main.ts`, ensure `cors.origin` is set to your exact production domain.
