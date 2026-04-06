# Deployment Guide - Coolify on Hostinger VPS

## Prerequisites
- Hostinger VPS with Coolify installed
- Git repository pushed to GitHub/GitLab

## Step 1: Create PostgreSQL Database in Coolify

1. Go to Coolify Dashboard → **Resources** → **New**
2. Select **Database** → **PostgreSQL**
3. Configure:
   - Name: `909-postgres`
   - Version: `16` (recommended)
4. Click **Deploy**
5. Once deployed, copy the **Internal URL** (looks like: `postgresql://postgres:password@postgres-xxxxx:5432/postgres`)

## Step 2: Deploy the Application

### Option A: Deploy via Docker Compose (Recommended)

1. Go to Coolify Dashboard → **Resources** → **New**
2. Select **Docker Compose**
3. Connect your Git repository
4. Set the **Docker Compose Location**: `docker-compose.yml`
5. Add Environment Variables (in Coolify UI):

```env
# Database - Use the Internal URL from Step 1
DATABASE_URL=postgresql://postgres:password@postgres-xxxxx:5432/postgres?schema=public

# JWT Secret - Generate a strong random string
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# API URLs - Use your actual domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

6. Click **Deploy**

### Option B: Deploy Each Service Separately

If you prefer more control, deploy each service individually:

#### Backend
1. New → Docker → Select repo
2. Dockerfile path: `apps/backend/Dockerfile`
3. Port: `3001`
4. Add all environment variables

#### Marketing (Next.js)
1. New → Docker → Select repo
2. Dockerfile path: `apps/marketing/Dockerfile`
3. Port: `3000`
4. Add: `NEXT_PUBLIC_API_URL`

#### CMS (Vite)
1. New → Docker → Select repo
2. Dockerfile path: `apps/cms/Dockerfile`
3. Port: `80` (nginx)
4. Add: `VITE_API_URL`

## Step 3: Configure Domains

In Coolify, for each service:

1. Go to **Settings** → **Domains**
2. Add your domains:
   - Marketing: `yourdomain.com`, `www.yourdomain.com`
   - Backend API: `api.yourdomain.com`
   - CMS: `cms.yourdomain.com` or `admin.yourdomain.com`

3. Enable **SSL** (Let's Encrypt)

## Step 4: Database Migration

After first deployment, the backend will automatically run migrations (`prisma migrate deploy`).

To seed the database manually:
```bash
# SSH into your VPS
docker exec -it 909-backend sh
bun run prisma/seed.ts
```

## File Structure

```
909/
├── docker-compose.yml          # Main compose file
├── .env.example                 # Environment template
├── .dockerignore                # Docker ignore rules
├── apps/
│   ├── backend/
│   │   └── Dockerfile          # Bun + Elysia + Prisma
│   ├── marketing/
│   │   └── Dockerfile          # Next.js standalone
│   └── cms/
│       ├── Dockerfile          # Vite + nginx
│       └── nginx.conf          # SPA routing config
└── packages/
    ├── shared-types/
    └── shared-utils/
```

## Environment Variables Reference

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Secret for JWT tokens (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | backend | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | backend | Cloudinary API secret |
| `NEXT_PUBLIC_API_URL` | marketing | Backend API URL (public) |
| `VITE_API_URL` | cms | Backend API URL |

## Networking

All services are connected via the `app-network` bridge network. The backend is accessible to other services via `backend:3001` internally.

For Coolify's managed PostgreSQL, use the **Internal URL** provided by Coolify - it will be accessible within the same network.

## Troubleshooting

### Database Connection Issues
- Ensure the PostgreSQL service is running in Coolify
- Use the **Internal URL** (not external) for `DATABASE_URL`
- Check if the database network is accessible from your app's network

### Build Failures
- Check Docker build logs in Coolify
- Ensure all workspace packages are included in the Dockerfile COPY commands
- Verify `pnpm-lock.yaml` is committed

### 502 Bad Gateway
- Check if the container is running: `docker ps`
- Check container logs: `docker logs 909-backend`
- Verify port mappings match Coolify's proxy settings

## Updating

To update after code changes:
1. Push to your Git repository
2. In Coolify, click **Redeploy** on the service
3. Or enable **Auto Deploy** for automatic deployments on push
