# Gift Card Marketplace - Multi-Tenant Platform

A seller-centric, multi-tenant gift card marketplace built with Next.js 15, MongoDB, and NextAuth.js.

## 🎯 Project Overview

This marketplace allows **sellers** to:
- Create and manage multiple companies (tenants)
- Each company operates independently with its own:
  - Listings and inventory
  - Payment settings (Stripe, PayPal, Crypto, PGPay)
  - Team members with role-based access
  - Branding and storefront
  - KYB verification and payouts

## 🏗️ Architecture

- **Multi-Tenant**: One seller can own/manage multiple companies
- **Role-Based Access Control**: Owner, Admin, Manager, Agent, Viewer
- **API Versioning**: All endpoints under `/api/v1/*`
- **Security First**: HTTP-only cookies, row-level isolation, audit logging

## ✅ Current Implementation Status

### **Backend (COMPLETE ✅)**
- ✅ MongoDB + Mongoose models (User, Company, CompanyMembership, AuditLog)
- ✅ NextAuth.js authentication with credentials provider
- ✅ User registration & company creation services
- ✅ RBAC middleware for company-scoped access control
- ✅ API routes for companies and authentication
- ✅ Zod validation on all inputs
- ✅ Comprehensive error handling

### **Frontend (IN PROGRESS 🚧)**
- 🚧 Auth pages (signup, signin)
- 🚧 Dashboard with company switcher
- 🚧 Company settings page
- ⏳ Team management
- ⏳ Listing management
- ⏳ KYB/KYC flows

**See `IMPLEMENTATION_STATUS.md` for complete details.**

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- MongoDB (local or Atlas)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 3. Copy environment file
cp .env.example .env.local

# 4. Generate NextAuth secret
openssl rand -base64 32  # Copy this value

# 5. Edit .env.local with your values
# MONGODB_URI=mongodb://localhost:27017/giftcard-marketplace
# NEXTAUTH_SECRET=<paste secret here>
# NEXTAUTH_URL=http://localhost:3000

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/v1/              # Versioned API routes
│   │   ├── auth/            # Authentication
│   │   └── companies/       # Company management
│   └── auth/                # Auth UI pages
├── lib/
│   ├── auth/                # NextAuth config
│   ├── db/
│   │   ├── mongodb.ts       # Connection
│   │   └── models/          # Mongoose models
│   ├── services/            # Business logic
│   ├── validation/          # Zod schemas
│   ├── middleware/          # RBAC
│   └── errors.ts            # Error handling
└── types/                   # TypeScript types
```

## 🔑 Key Features

### Multi-Tenancy
- Sellers create companies with unique slugs
- All data scoped by `companyId`
- Row-level security
- Company switcher UI

### RBAC Hierarchy
```
Owner > Admin > Manager > Agent > Viewer
```

### API Endpoints (v1)

**Authentication:**
- `POST /api/v1/auth/register` - Register user + company

**Companies:**
- `GET  /api/v1/companies` - List user's companies
- `POST /api/v1/companies` - Create company
- `GET  /api/v1/companies/:id` - Get details
- `PATCH /api/v1/companies/:id` - Update settings

## 🧪 Development

```bash
# Run dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format

# Run tests
npm test
```

## 📚 Documentation

- **`AGENTS.md`** - Development guidelines (MUST READ)
- **`IMPLEMENTATION_STATUS.md`** - Implementation progress
- **`.claude/agent.md`** - AI assistant context

## 🔐 Security

- ✅ HTTP-only cookies for sessions
- ✅ RBAC at company level
- ✅ Row-level data isolation
- ✅ Audit logging
- ✅ Zod input validation
- ✅ bcrypt password hashing

## 🛣️ Roadmap

- [x] **Phase 1**: Auth & Company Management (CURRENT)
- [ ] **Phase 2**: Team Invitations
- [ ] **Phase 3**: KYB/KYC Verification
- [ ] **Phase 4**: Listings & Inventory
- [ ] **Phase 5**: Payment Integrations
- [ ] **Phase 6**: Orders & Fulfillment

## 🧰 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB + Mongoose
- **Auth**: NextAuth.js v5
- **Validation**: Zod
- **UI**: shadcn/ui + Tailwind CSS v4
- **Forms**: React Hook Form
- **Testing**: Vitest + Playwright

## 📝 Key Guidelines (from AGENTS.md)

1. **TypeScript Strict** - No `any` unless justified
2. **API Versioning Mandatory** - All routes under `/api/v1/`
3. **Mobile-First** - Design from 320px up
4. **shadcn/ui Only** - No ad-hoc CSS
5. **Security by Default** - Cookies > localStorage
6. **Multi-Tenancy** - All data scoped by companyId

## 🆘 Troubleshooting

**MongoDB Connection:**
```bash
docker ps              # Check if running
docker logs mongodb    # View logs
```

**NextAuth Issues:**
```bash
# Regenerate secret
openssl rand -base64 32
# Clear browser cookies
```

**Type Errors:**
```bash
npm run typecheck
```

## 📄 License

MIT

---

**Next Steps**: Complete auth UI pages → Dashboard with company switcher → Settings page

See `IMPLEMENTATION_STATUS.md` for full roadmap.
