# System Architecture

More AI yappitudes

## Overview

The Contest Backend is a RESTful API server built with Node.js, Express, and TypeScript, designed to manage programming contests in various formats (ACM/ICPC, IOI, etc.). It supports single-site and multi-site contest configurations with real-time scoreboard updates and comprehensive judging capabilities.

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express.js 5.x
- **ORM**: Prisma 6.x
- **Database**: PostgreSQL 14+

### Security & Authentication
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Security Headers**: Helmet
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit

### File Handling
- **File Uploads**: Multer
- **UUID Generation**: uuid

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (Web UI, Mobile App, Judge Client, External Systems)       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  CORS    │  │  Helmet  │  │   Rate   │  │  Morgan  │   │
│  │          │  │ Security │  │ Limiting │  │ Logging  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  JWT Validation → Session Check → Role Verification │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Routing Layer                            │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │
│  │  Auth   │ │  Users  │ │  Teams   │ │   Contests   │    │
│  │ Routes  │ │ Routes  │ │  Routes  │ │    Routes    │    │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘    │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │
│  │Problems │ │ Submis- │ │Scoreboard│ │   Events     │    │
│  │ Routes  │ │  sions  │ │  Routes  │ │    Routes    │    │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic, Request Validation, Error Handling  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │   Prisma   │ │    Event     │ │  Audit Logging     │   │
│  │   Client   │ │  Publisher   │ │     Service        │   │
│  └────────────┘ └──────────────┘ └────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  24 Tables: Users, Teams, Contests, Problems, etc.  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Entities

#### User Management
- **User**: User accounts with authentication
- **UserRole**: Many-to-many relationship for roles
- **UserSession**: Active login sessions with JWT tokens
- **Notification**: User notifications

#### Contest Structure
- **Contest**: Contest configuration and state
- **ContestLanguage**: Languages allowed in contest
- **Problem**: Contest problems with test data
- **TestData**: Input/output test cases
- **ProblemFile**: Problem statement files

#### Team & Site Management
- **Team**: Team registration and info
- **TeamMember**: Team members and their roles
- **Site**: Multi-site contest locations
- **SyncExport/SyncImport**: Site data synchronization

#### Submission & Judging
- **Submission**: Code submissions from teams
- **Judgement**: Verdict and execution results
- **SubmissionFile**: Submission attachments

#### Scoring & Results
- **Score**: Team scores and rankings
- **Award**: Contest awards
- **TeamAward**: Award assignments

#### Communication
- **Clarification**: Team-judge Q&A
- **Announcement**: Broadcast messages

#### System
- **Event**: Event feed for real-time updates
- **AuditLog**: Complete audit trail
- **Configuration**: Multi-level settings
- **Webhook**: External integrations

### Entity Relationships

```
User ──< UserRole
User ──< UserSession
User ──< TeamMember
User ──< Notification

Team ──< TeamMember
Team ──< Submission
Team ──< Score
Team ──< TeamAward
Team >── Site

Contest ──< Problem
Contest ──< ContestLanguage
Contest ──< Submission
Contest ──< Clarification
Contest ──< Score
Contest ──< Award

Problem ──< TestData
Problem ──< ProblemFile
Problem ──< Submission

Submission ──< Judgement
Submission ──< SubmissionFile
```

## Request Flow

### 1. Authentication Flow

```
Client Request
    ↓
Extract JWT from Authorization header
    ↓
Verify JWT signature
    ↓
Check session exists in database
    ↓
Check session not expired
    ↓
Load user and roles
    ↓
Attach user to request
    ↓
Proceed to route handler
```

### 2. Authorization Flow

```
Authenticated Request
    ↓
Check required roles for endpoint
    ↓
Verify user has at least one required role
    ↓
If authorized → Proceed
    ↓
If not → Return 403 Forbidden
```

### 3. Standard Request Flow

```
HTTP Request
    ↓
Middleware Stack (CORS, Helmet, etc.)
    ↓
Authentication Middleware
    ↓
Authorization Middleware
    ↓
Route Handler
    ↓
Controller Method
    ↓
Business Logic & Validation
    ↓
Database Operations (via Prisma)
    ↓
Audit Logging (for critical operations)
    ↓
Event Publishing (for real-time updates)
    ↓
Response Formatting
    ↓
HTTP Response
```

### 4. Error Handling Flow

```
Error Occurs
    ↓
Throw HttpError or native Error
    ↓
Caught by Error Middleware
    ↓
Log Error Details
    ↓
Format Error Response
    ↓
Return appropriate HTTP status
```

## Key Design Patterns

### 1. Controller Pattern

Controllers handle HTTP requests and responses:

```typescript
class UserController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Validation
      // Business logic
      // Database operations
      // Response
    } catch (error) {
      next(error); // Pass to error handler
    }
  }
}
```

### 2. Middleware Chain

Request processing through middleware:

```typescript
app.use(helmet());          // Security headers
app.use(cors());            // CORS handling
app.use(authenticate);      // JWT validation
app.use(authorize('ADMIN')) // Role check
```

### 3. Repository Pattern (via Prisma)

Database access abstracted through Prisma:

```typescript
const user = await prisma.user.create({
  data: { username, email, passwordHash },
  include: { roles: true },
});
```

### 4. Error Handling Strategy

Centralized error handling:

```typescript
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Usage
throw new HttpError(400, 'Invalid input');
```

## Security Architecture

### Authentication
- JWT tokens with configurable expiration
- Tokens stored in database sessions
- Session validation on each request
- Force logout capability

### Authorization
- Role-Based Access Control (RBAC)
- Five roles: ADMIN, JUDGE, TEAM, SCOREBOARD_VIEWER, GUEST
- Hierarchical permissions
- Resource-level access control

### Data Protection
- Password hashing with bcrypt (10 rounds)
- Sensitive data never logged
- SQL injection prevention (Prisma)
- XSS protection (Helmet)

### Audit Trail
- All critical operations logged
- User ID, action, timestamp recorded
- IP address tracking
- Change history for entities

## Scalability Considerations

### Database
- Indexed columns for common queries
- Connection pooling supported
- Read replicas can be added
- Partitioning for large tables

### API
- Stateless design (JWT)
- Horizontal scaling ready
- Load balancer compatible
- Caching can be added

### Multi-Site
- Three modes supported:
  1. **Single-Site**: Standard operation
  2. **Tightly-Coupled**: Real-time sync
  3. **Loosely-Coupled**: Periodic sync

## Event-Driven Architecture

### Event Types
- Contest lifecycle events
- Submission events
- Judgement events
- Scoreboard updates
- Site connectivity changes

### Event Flow
```
Action Occurs
    ↓
Create Event Record
    ↓
Store in Database
    ↓
Publish to Event Feed
    ↓
Trigger Webhooks (if configured)
    ↓
Real-time Updates (via WebSocket - future)
```

## API Design Principles

### RESTful Design
- Resource-based URLs
- HTTP methods (GET, POST, PATCH, DELETE)
- Standard status codes
- Consistent response format

### Versioning
- URL-based versioning ready (`/api/v1/`)
- Backward compatibility maintained
- Deprecation notices for old endpoints

### Response Format
```json
{
  "data": {},
  "error": null,
  "pagination": {
    "page": 1,
    "perPage": 30,
    "total": 100
  }
}
```

## Performance Optimization

### Database Queries
- Select only needed fields
- Use includes wisely
- Batch operations when possible
- Avoid N+1 queries

### Caching Strategy (Future)
- Response caching for read-heavy endpoints
- Cache invalidation on updates
- Redis integration ready

### Rate Limiting
- Per-endpoint limits
- User-based quotas
- Configurable thresholds

## Deployment Architecture

### Production Setup
```
Internet
    ↓
Load Balancer (nginx)
    ↓
    ├─→ App Server 1
    ├─→ App Server 2
    └─→ App Server N
         ↓
    PostgreSQL Primary
         ↓
    PostgreSQL Replica(s)
```

### Container Deployment
- Docker containerization
- Docker Compose for development
- Kubernetes-ready
- Environment-based configuration

## Monitoring & Observability

### Logging
- Request/response logging (Morgan)
- Error logging
- Audit logging
- Structured logs

### Metrics (Future)
- Request rate
- Response times
- Error rates
- Database query performance

### Health Checks
- `/health` endpoint
- Database connectivity check
- Dependency status check

## Future Enhancements

### Planned Features
1. WebSocket support for real-time updates
2. Advanced caching layer
3. Message queue for async operations
4. File storage service integration
5. Automated judging system
6. Advanced analytics and reporting
7. GraphQL API option
8. Microservices architecture

### Technical Improvements
1. Comprehensive test suite
2. API documentation with OpenAPI/Swagger
3. Performance monitoring
4. Advanced security features (2FA, etc.)
5. Internationalization support

## Development Workflow

### Local Development
```
npm run dev → Hot reload
npm run prisma:studio → Database GUI
npm run prisma:migrate → Schema updates
```

### Testing Strategy (Future)
- Unit tests for controllers
- Integration tests for APIs
- E2E tests for workflows
- Load testing for scalability

### CI/CD Pipeline
- Automated builds
- Test execution
- Security scanning
- Deployment automation

## Best Practices

### Code Organization
- Feature-based structure
- Separation of concerns
- DRY principles
- SOLID principles

### Error Handling
- Always use try-catch
- Proper error types
- Meaningful error messages
- Centralized error handling

### Database Operations
- Always use transactions for multiple operations
- Handle unique constraint violations
- Use appropriate indexes
- Optimize queries

### Security
- Validate all input
- Sanitize user data
- Use parameterized queries
- Implement rate limiting
- Keep dependencies updated

## Conclusion

The Contest Backend is designed to be:
- **Scalable**: Handle multiple contests and thousands of teams
- **Secure**: Protect data and prevent unauthorized access
- **Flexible**: Support various contest formats and configurations
- **Maintainable**: Clean code and clear architecture
- **Extensible**: Easy to add new features

For more information, see the documentation files:
- [README.md](README.md) - Overview
- [SETUP.md](SETUP.md) - Setup guide
- [API.md](API.md) - API documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide
