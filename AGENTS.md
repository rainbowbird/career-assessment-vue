# AGENTS.md - Career Assessment System

## Project Overview
Full-stack student career potential assessment system (学生职场潜能测评系统).

**Architecture**: Vue 3 + Express + MySQL + Docker

## Project Structure

```
career-assessment/
├── apps/
│   ├── web/                 # Vue 3 Frontend
│   │   ├── src/
│   │   │   ├── api/         # API clients
│   │   │   ├── components/  # Vue components
│   │   │   ├── router/      # Vue Router
│   │   │   ├── stores/      # Pinia stores
│   │   │   └── views/       # Page views
│   │   └── package.json
│   └── api/                 # Express Backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── middleware/  # Express middleware
│       │   └── index.ts     # Entry point
│       └── package.json
├── packages/
│   ├── database/            # Prisma + MySQL
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── shared/              # Shared types
└── compose.yml              # Docker Compose V2
```

## Build/Test Commands

### Development
```bash
# Install dependencies
pnpm install

# Start database (Docker Compose V2)
docker compose up -d mysql

# Run database migrations
pnpm db:migrate
pnpm db:seed

# Start all services
pnpm dev

# Start individual services
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only
```

### Build
```bash
# Build for production
pnpm build

# Build specific apps
pnpm build:web
pnpm build:api
```

### Database Commands
```bash
pnpm db:generate   # Generate Prisma Client
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed initial data
pnpm db:studio     # Open Prisma Studio
```

### Docker Commands (V2)
```bash
# Development
docker compose up -d
docker compose down

# Production
docker compose -f compose.prod.yml up -d
docker compose -f compose.prod.yml down

# Package.json scripts
pnpm docker:up
pnpm docker:down
pnpm docker:prod:up
pnpm docker:prod:down
```

## Code Style Guidelines

### TypeScript/JavaScript
- **Style**: Modern ES2020+ with TypeScript
- **Indentation**: 2 spaces
- **Semicolons**: Optional (prefer none)
- **Quotes**: Single quotes for strings
- **Functions**: Arrow functions preferred
- **Variables**: Use `const` by default, `let` when reassignment needed
- **Comments**: Chinese for UI text, English for technical logic

### Vue 3 (Frontend)
- Use Composition API with `<script setup>`
- Component names: PascalCase
- Props/Emits: Explicitly typed with TypeScript

Example:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
}

const props = defineProps<Props>()
const count = ref(0)

const doubled = computed(() => count.value * 2)
</script>
```

### Express (Backend)
- Use async/await for async operations
- Error handling with try-catch
- Zod for input validation
- Prisma for database operations

Example:
```typescript
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany()
    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
})
```

### Database (Prisma)
- Schema changes require migration
- Use meaningful model and field names
- Add indexes for frequently queried fields

### Naming Conventions
- **Files**: kebab-case for components, camelCase for utilities
- **Components**: PascalCase
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### Tailwind CSS
- Use utility classes
- Custom colors defined in tailwind.config.js
- Responsive prefixes: sm:, md:, lg:, xl:

### Error Handling
- Always catch and handle errors
- Return structured error responses
- Log errors server-side
- Show user-friendly messages

```typescript
try {
  // Operation
} catch (error) {
  console.error('操作失败:', error)
  res.status(500).json({
    success: false,
    error: '操作失败，请稍后重试'
  })
}
```

## External Libraries

### Frontend
- Vue 3.4+, Vue Router 4, Pinia
- Tailwind CSS 3.x
- Chart.js 4.x + vue-chartjs
- jsPDF 2.5.1 + html2canvas 1.4.1
- Font Awesome 6.x

### Backend
- Express 4.x
- Prisma 5.x + @prisma/client
- Zod for validation
- JWT for authentication
- bcryptjs for password hashing

### Database
- MySQL 8.0

## Environment Variables

Create `.env` file from `.env.example`:
```
DATABASE_URL=mysql://user:pass@localhost:3306/career_assessment
JWT_SECRET=your-secret-key
PORT=3000
```

## Default Credentials
- Admin password: `admin123`

## Docker Compose V2
This project uses Docker Compose V2 (docker compose) not V1 (docker-compose).
Compose files: `compose.yml` and `compose.prod.yml`

## No Existing Rules
- No .cursorrules file
- No .cursor/rules/ directory
- No .github/copilot-instructions.md
