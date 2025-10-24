# Setup Guide

I'm not sure if any of this is accurate, I just had copilot spit this shit out.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn**

## Step 1: Database Setup

### Install PostgreSQL

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### On macOS (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### On Windows:
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE contest_db;
CREATE USER contest_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE contest_db TO contest_user;
\q
```

## Step 2: Project Setup

### Clone and Install Dependencies

```bash
git clone <repository-url>
cd contest-backend
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file with your settings:
```env
DATABASE_URL="postgresql://contest_user:your_password@localhost:5432/contest_db?schema=public"
JWT_SECRET="change-this-to-a-random-secure-string"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
```

**Important:** Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Database Migration

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Run Migrations

```bash
npm run prisma:migrate
```

This will create all necessary database tables.

## Step 4: Seed Initial Data (Optional)

Create an admin user and sample data:

```bash
node scripts/seed.js
```

This creates:
- Admin user: `admin` / `admin123`
- Sample languages (C++, Java, Python)
- Sample contest

## Step 5: Build and Run

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## Step 6: Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Authentication

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Expected response (with token):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-01-02T00:00:00.000Z",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["ADMIN"]
  }
}
```

## Step 7: Explore the API

### Using Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` to view and edit database records.

### Using API Documentation

Refer to `API.md` for complete API documentation.

### Example: Create a Team

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "affiliation": "University XYZ",
    "members": [
      {
        "name": "John Doe",
        "role": "Contestant"
      }
    ]
  }'
```

## Troubleshooting

### Database Connection Issues

**Error:** `Connection refused`
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in `.env` file
- Verify database and user exist

**Error:** `Authentication failed`
- Check username and password in DATABASE_URL
- Ensure user has proper permissions on the database

### Port Already in Use

**Error:** `Port 3000 is already in use`
- Change PORT in `.env` file
- Or stop the process using the port:
  ```bash
  lsof -ti:3000 | xargs kill -9  # On Linux/Mac
  ```

### Migration Issues

**Error:** `Migration failed`
- Drop and recreate database:
  ```bash
  npm run prisma:migrate reset
  ```
  **Warning:** This deletes all data!

### Build Errors

**Error:** TypeScript compilation errors
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Runtime Errors

**Error:** `Cannot find module '@prisma/client'`
- Regenerate Prisma client: `npm run prisma:generate`

**Error:** `JWT_SECRET is not defined`
- Ensure `.env` file exists and JWT_SECRET is set

## Advanced Configuration

### Database Connection Pooling

For production, configure connection pooling in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  connectionLimit = 10
}
```

### HTTPS Configuration

For production deployment, use a reverse proxy like nginx:

```nginx
server {
    listen 443 ssl;
    server_name contest.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@db-server:5432/contest_db?schema=public&connection_limit=20&pool_timeout=20"
JWT_SECRET="<secure-random-string>"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV=production
```

### Running as a Service (systemd)

Create `/etc/systemd/system/contest-backend.service`:

```ini
[Unit]
Description=Contest Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=contest
WorkingDirectory=/opt/contest-backend
ExecStart=/usr/bin/node /opt/contest-backend/dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable contest-backend
sudo systemctl start contest-backend
sudo systemctl status contest-backend
```

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: contest_db
      POSTGRES_USER: contest_user
      POSTGRES_PASSWORD: contest_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://contest_user:contest_password@postgres:5432/contest_db
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Run with Docker Compose:
```bash
docker-compose up -d
```

## Monitoring and Logging

### Viewing Logs

Development:
```bash
npm run dev  # Logs to console
```

Production (with systemd):
```bash
journalctl -u contest-backend -f
```

Production (with Docker):
```bash
docker-compose logs -f backend
```

### Health Checks

Set up periodic health checks:
```bash
# Cron job
*/5 * * * * curl -f http://localhost:3000/health || systemctl restart contest-backend
```

## Backup and Restore

### Database Backup

```bash
pg_dump -U contest_user -d contest_db > backup.sql
```

### Database Restore

```bash
psql -U contest_user -d contest_db < backup.sql
```

### Automated Backups

Add to crontab:
```bash
0 2 * * * pg_dump -U contest_user contest_db | gzip > /backups/contest_$(date +\%Y\%m\%d).sql.gz
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular dependency updates

## Next Steps

1. Review the [API Documentation](API.md)
2. Create your first contest
3. Configure languages and problems
4. Set up teams
5. Test submission workflow

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs for error messages
- Open an issue on GitHub

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) for understanding JWT tokens
