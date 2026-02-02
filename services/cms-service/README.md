# GrandGold CMS Service (Strapi)

Headless CMS for marketing content, FAQs, legal pages, and announcements.

## Quick Start

### First-time setup

1. **Create CMS database** (if using existing Docker Postgres):
   ```bash
   docker exec -it grandgold-postgres psql -U postgres -c "CREATE DATABASE grandgold_cms;"
   ```

2. **Install & run**:
   ```bash
   cd services/cms-service
   pnpm install
   RUN_CMS_SEED=true pnpm develop
   ```

3. **Admin panel**: http://localhost:1337/admin  
   Create your first admin user on first visit.

4. **Seed content**: Set `RUN_CMS_SEED=true` on first run to populate homepage, FAQs, and legal pages. Seed runs only when no content exists.

### With Docker Compose

```bash
# From project root
docker-compose up -d postgres
docker-compose up -d cms-service
```

CMS: http://localhost:1337  
Admin: http://localhost:1337/admin

## Content Types

| Type | Purpose |
|------|---------|
| Homepage | Hero, trust badges, testimonials |
| Banner | Promotional banners with scheduling |
| FAQ | Help articles by category |
| Blog Post | News and guides |
| Legal Page | Terms, privacy, refund policies |
| Announcement | Site-wide alerts |
| Metal Education | Gold/precious metal guides |
| Collection Page | Marketing pages for collections |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUN_CMS_SEED` | - | Set to `true` to run seed on startup |
| `DATABASE_CLIENT` | postgres | postgres or sqlite |
| `DATABASE_NAME` | grandgold_cms | Database name |
| `PORT` | 1337 | Server port |

## API

- **REST**: `/api/homepage`, `/api/faqs`, `/api/banners`, etc.
- **GraphQL**: http://localhost:1337/graphql
