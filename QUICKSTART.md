# 🚀 Quick Start Guide

## Prerequisites Installed ✅
- Node.js 20+
- npm
- All dependencies

## Step 1: Start MongoDB

```bash
# Using Docker (Recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify it's running
docker ps
```

## Step 2: Environment Variables

The `.env.local` file has been created with:
- ✅ MONGODB_URI (local connection)
- ✅ NEXTAUTH_URL (localhost:3000)
- ✅ NEXTAUTH_SECRET (auto-generated)

## Step 3: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Test the Complete Flow

### 1. **Sign Up** (`/auth/signup`)
- Enter your name, email, password
- Provide a company name (your first company will be created)
- Click "Create account"

### 2. **Sign In** (`/auth/signin`)
- Use your email and password
- Click "Sign in"

### 3. **Dashboard** (`/dashboard`)
- View your dashboard
- See the company switcher in the header
- Explore quick actions cards

### 4. **Company Settings**
- Click on company switcher
- Select your company
- Navigate to settings via the company slug URL
- Or go directly to `/dashboard/[your-company-slug]/settings`
- Update display name, support email, bio
- Save changes

### 5. **Create Another Company** (Optional)
- Click company switcher
- Click "Create Company"
- Implement the company creation page (TODO)

## 📊 Implemented Features

### ✅ Backend (Complete)
- MongoDB + Mongoose models
- NextAuth.js authentication
- User registration with company creation
- RBAC middleware
- Company CRUD operations
- API versioning (v1)
- Error handling
- Audit logging

### ✅ Frontend (Complete)
- Landing page with hero
- Signup page with company creation
- Signin page with NextAuth
- Dashboard layout with:
  - Protected routes
  - Session provider
  - Company switcher component
  - User menu
  - Responsive navigation
- Company settings page
- Mobile-first responsive design

## 🗂️ Pages Available

| Route | Description |
|-------|-------------|
| `/` | Landing page (redirects to `/dashboard` if authenticated) |
| `/auth/signup` | User registration + company creation |
| `/auth/signin` | Sign in with credentials |
| `/dashboard` | Main dashboard (protected) |
| `/dashboard/[slug]/settings` | Company settings (protected) |

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user + create company |
| GET | `/api/v1/companies` | List user's companies |
| POST | `/api/v1/companies` | Create new company |
| GET | `/api/v1/companies/:id` | Get company details |
| PATCH | `/api/v1/companies/:id` | Update company settings |

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker ps

# View logs
docker logs mongodb

# Restart MongoDB
docker restart mongodb
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### NextAuth Session Issues
```bash
# Clear browser cookies
# Regenerate secret if needed
openssl rand -base64 32
```

### Type Errors
```bash
# Run type check
npm run typecheck

# Check for issues
npm run lint
```

## 📝 Next Steps

1. **Create company creation page** (`/dashboard/companies/new`)
2. **Implement team member invitations**
3. **Add KYB/KYC flows**
4. **Create listing management**
5. **Integrate payment providers**

## 🔍 What to Explore

1. **Multi-Tenancy**
   - Sign up and create a company
   - Create another company from the switcher
   - See how data is isolated

2. **RBAC System**
   - Check the `CompanyMembership` model
   - See role hierarchy (owner > admin > manager > agent > viewer)
   - Test permission checks

3. **API Architecture**
   - All endpoints under `/api/v1/*`
   - Zod validation on inputs
   - Typed responses
   - Error handling

4. **Database Schema**
   - Check MongoDB Compass
   - View collections: users, companies, companymemberships, auditlogs
   - See indexes

## 🎨 Customization

### Update Branding
- Edit `src/app/page.tsx` for landing page
- Modify `src/app/dashboard/layout.tsx` for dashboard header
- Update `src/app/layout.tsx` metadata

### Add Features
- Reference `AGENTS.md` for guidelines
- Follow TypeScript strict mode
- Use Zod for validation
- Add tests with Vitest

### Styling
- Uses Tailwind CSS v4
- shadcn/ui components
- CSS variables in `src/app/globals.css`
- Mobile-first approach

## 📚 Documentation

- **README.md** - Project overview
- **AGENTS.md** - Development guidelines (MUST READ!)
- **IMPLEMENTATION_STATUS.md** - What's built and what's next
- **.claude/agent.md** - AI assistant context

## ✅ Verification Checklist

- [ ] MongoDB running (`docker ps`)
- [ ] `.env.local` configured
- [ ] `npm run dev` successful
- [ ] Can access `http://localhost:3000`
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Company switcher functional
- [ ] Settings page works

---

**Built with:** Next.js 15, MongoDB, NextAuth.js, shadcn/ui, TypeScript

**Ready to code!** 🚀
