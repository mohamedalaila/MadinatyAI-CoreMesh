# Business Sub-Tenancy — Business & Technical Documentation

> **MadinatyAI Ecosystem Hub** — Row-level sub-multi-tenancy for Kitchen & Tutor apps.
> Version 1.0 · June 2026

---

## 1. Business Overview

### 1.1 What Is Business Sub-Tenancy?

Business Sub-Tenancy allows individual businesses (restaurants, tutor centres) to register within a tenant app and get their own:

- **Visual identity** — logo, colors, fonts, hero images, custom CSS
- **Subdomain** — `ali.kitchen.madinatyai.com` resolves to Ali Kitchen
- **Data isolation** — all menu items, bookings, etc. are scoped to the business
- **Business profile** — description, cuisine type, opening hours, subjects, hourly rates

### 1.2 Why Sub-Tenancy?

| Problem (Without Sub-Tenancy) | Solution (With Sub-Tenancy) |
|-------------------------------|------------------------------|
| All Kitchen restaurants share one flat schema — no visual differentiation | Each restaurant gets its own branding JSON and subdomain |
| No way to give a restaurant its own landing page | `ali.kitchen.madinatyai.com` loads Ali's branded page |
| Menu items mixed across all restaurants | `KitchenMenuItem.businessId` FK scopes data per restaurant |
| No SEO per individual business | Each business slug is a unique, indexable URL |
| Admin must deploy code to change a restaurant's look | Branding API lets owners update colors/logo without code changes |

### 1.3 Which Tenants Support Sub-Tenancy?

| Tenant | Supports Sub-Tenancy | Reason |
|--------|---------------------|--------|
| **Kitchen** | ✅ | Multiple restaurants, each needs visual identity |
| **Tutor** | ✅ | Multiple tutor centres, each needs profile & branding |
| **Souq** | ❌ | Marketplace — listings belong to users, not businesses |
| **TimeBank** | ❌ | Peer-to-peer — no business entity between users |

---

## 2. Business Flows

### 2.1 Business Registration

```
Restaurant owner signs up on Kitchen tenant
        ↓
Admin or owner calls POST /api/business { slug, name, branding }
        ↓
Hub creates KitchenBusiness row in tenant_kitchen schema
        ↓
Business is accessible at ali.kitchen.madinatyai.com
        ↓
Owner adds menu items via POST /api/tenant/items (scoped by businessId)
```

### 2.2 Visual Identity Customization

```
Owner calls PATCH /api/business/:id/branding
  { branding: { primaryColor: "#FF6B35", logoUrl: "/storage/...", fontFamily: "Cairo" } }
        ↓
Hub updates KitchenBusiness.branding JSON
        ↓
Frontend fetches branding on page load, applies CSS variables
        ↓
Restaurant page now shows custom colors, logo, and font
```

### 2.3 Sub-Subdomain Routing

```
Browser requests ali.kitchen.madinatyai.com
        ↓
TenantMiddleware resolves "kitchen" → tenant_kitchen schema
        ↓
BusinessMiddleware extracts "ali" from sub-subdomain
        ↓
Business slug stored in TenantContext.businessSlug
        ↓
API queries KitchenBusiness WHERE slug = 'ali'
        ↓
Returns business data + branding for frontend rendering
```

---

## 3. Technical Architecture

### 3.1 Data Model

**Kitchen (tenant_kitchen schema):**

```prisma
model KitchenBusiness {
  id              String   @id @default(uuid())
  ownerGlobalUserId String
  slug            String   @unique   // "ali-kitchen"
  name            String
  isActive        Boolean  @default(true)
  branding        Json     @default("{}")  // Visual identity
  description     String?
  cuisineType     String?
  address         String?
  phone           String?
  openingHours    Json?
  menuItems       KitchenMenuItem[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model KitchenMenuItem {
  id          String   @id @default(uuid())
  businessId  String
  business    KitchenBusiness @relation(...)
  title       String
  description String?
  price       Float?
  category    String?
  imageUrl    String?
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

**Tutor (tenant_tutor schema):**

```prisma
model TutorBusiness {
  id              String   @id @default(uuid())
  ownerGlobalUserId String
  slug            String   @unique   // "ahmed-math"
  name            String
  isActive        Boolean  @default(true)
  branding        Json     @default("{}")  // Visual identity
  description     String?
  subjects        String[]  // ["Math", "Physics"]
  qualifications  String?
  hourlyRate      Float?
  address         String?
  phone           String?
  availability    Json?
  bookings        TutorBooking[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model TutorBooking {
  id          String   @id @default(uuid())
  businessId  String
  business    TutorBusiness @relation(...)
  studentId   String
  title       String
  subject     String?
  scheduledAt DateTime?
  status      String   @default("PENDING")
  notes       String?
  createdAt   DateTime @default(now())
}
```

### 3.2 Branding JSON Schema

The `branding` JSON field supports arbitrary keys. Recommended structure:

```json
{
  "primaryColor": "#FF6B35",
  "secondaryColor": "#004E89",
  "accentColor": "#FFD166",
  "backgroundColor": "#FFFFFF",
  "textColor": "#333333",
  "fontFamily": "Cairo",
  "headingFont": "Cairo",
  "logoUrl": "/storage/kitchen/ali/logo.png",
  "heroImageUrl": "/storage/kitchen/ali/hero.jpg",
  "faviconUrl": "/storage/kitchen/ali/favicon.ico",
  "customCss": "...",
  "socialLinks": {
    "instagram": "https://instagram.com/alikitchen",
    "facebook": "https://facebook.com/alikitchen",
    "whatsapp": "201000000001"
  }
}
```

### 3.3 Service Layer (`@madinatyai/business`)

```typescript
class BusinessService {
  createBusiness(tenant, dto)          // Register business with slug + branding
  getBusiness(tenant, slug)            // Lookup by slug
  listBusinesses(tenant, activeOnly?)  // Paginated listing
  updateBranding(tenant, id, branding) // Update visual identity
  updateProfile(tenant, id, profile)   // Update business info
  deactivateBusiness(tenant, id)       // Soft delete (isActive = false)
}
```

### 3.4 Middleware Chain

```
Request
  → TenantMiddleware (resolves subdomain → schema)
  → BusinessMiddleware (resolves sub-subdomain or x-business-slug header → businessSlug)
  → BusinessGuard (ensures business context present)
  → Controller
```

### 3.5 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/business` | Create business |
| GET | `/api/business/:slug` | Get business by slug |
| GET | `/api/business` | List businesses (query: `activeOnly`) |
| PATCH | `/api/business/:id/branding` | Update visual identity |
| PATCH | `/api/business/:id/profile` | Update business profile |
| DELETE | `/api/business/:id` | Deactivate business |

---

## 4. Frontend Integration Guide

### 4.1 Loading Business Branding

```typescript
// 1. Fetch business data
const business = await fetch('/api/business/ali-kitchen').then(r => r.json());

// 2. Apply branding as CSS variables
const branding = business.branding;
document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
document.documentElement.style.setProperty('--font-family', branding.fontFamily);

// 3. Set logo
document.querySelector('.logo').src = branding.logoUrl;

// 4. Apply custom CSS if present
if (branding.customCss) {
  const style = document.createElement('style');
  style.textContent = branding.customCss;
  document.head.appendChild(style);
}
```

### 4.2 Subdomain Resolution (Next.js Example)

```typescript
// next.config.js - wildcard subdomain
module.exports = {
  async rewrites() {
    return [
      { source: '/:slug(\\w[-\\w]*)', destination: '/business/:slug' },
    ];
  },
};
```

---

## 5. Security & Data Isolation

| Aspect | Implementation |
|--------|---------------|
| **Row-level isolation** | All queries filtered by `businessId` FK — no cross-business data leakage |
| **Slug uniqueness** | `@@unique([slug])` per schema prevents duplicate business identifiers |
| **Soft delete** | `deactivateBusiness` sets `isActive = false` instead of hard delete |
| **Branding validation** | `@IsJSON()` decorator ensures only valid JSON objects |
| **Owner scoping** | `ownerGlobalUserId` tracks who owns the business for authorization |

---

## 6. Future Extensibility

| Feature | Status | Implementation Path |
|---------|--------|---------------------|
| **Business analytics** | Not in v1 | Add `BusinessAnalytics` model with views, orders, revenue aggregations |
| **Custom domain** | Not in v1 | CNAME mapping + SSL cert provisioning per business |
| **Business reviews** | Not in v1 | Add `BusinessReview` model in tenant schema |
| **Multi-owner** | Not in v1 | Add `BusinessOwner` junction table for shared ownership |
| **Branding templates** | Not in v1 | Pre-built themes (restaurant, cafe, tutor) as starting points |
| **Business API keys** | Not in v1 | Scoped API keys for business-level integrations |

---

## 7. Glossary

| Term | Definition |
|------|-----------|
| **Business** | A sub-tenant entity within a tenant app (e.g., a restaurant in Kitchen, a tutor centre in Tutor) |
| **Slug** | URL-friendly unique identifier for a business (e.g., "ali-kitchen") |
| **Branding** | JSON object containing visual identity configuration (colors, fonts, images, CSS) |
| **Sub-subdomain** | Third-level domain like `ali.kitchen.madinatyai.com` that resolves to a specific business |
| **Row-level isolation** | Data scoping via `businessId` foreign key rather than separate database schemas |
