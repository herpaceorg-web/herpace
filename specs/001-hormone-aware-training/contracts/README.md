# API Contracts - HerPace

This directory contains the API contract specifications for the Hormone-Aware Training Plan System.

## Files

- **api-spec.yaml**: OpenAPI 3.0 specification for the REST API
  - All endpoints mapped to functional requirements
  - Request/response schemas derived from data-model.md
  - Authentication flows (JWT bearer tokens via NextAuth.js)
  - Error handling patterns

## Viewing the Specification

### Option 1: Swagger UI (Recommended)
```bash
npx @redocly/cli preview-docs contracts/api-spec.yaml
```
Opens interactive documentation at http://localhost:8080

### Option 2: Online Viewers
Upload `api-spec.yaml` to:
- https://editor.swagger.io
- https://redocly.github.io/redoc/

### Option 3: VS Code Extension
Install "OpenAPI (Swagger) Editor" extension and open the YAML file.

## Generating Client Code

### TypeScript Client (Frontend)
```bash
npx openapi-typescript contracts/api-spec.yaml --output shared/types/api-client.ts
```

### Server Stubs (Backend)
```bash
npx @openapitools/openapi-generator-cli generate \
  -i contracts/api-spec.yaml \
  -g typescript-node \
  -o backend/generated
```

## Validation

Validate the spec:
```bash
npx @redocly/cli lint contracts/api-spec.yaml
```

## Key Endpoints

| Endpoint | Purpose | FR Reference |
|----------|---------|--------------|
| POST /auth/signup | User registration | FR-001 |
| POST /profiles/me | Create runner profile | FR-001 |
| POST /races | Create race goal | FR-002 |
| POST /plans | Generate training plan | FR-003 |
| GET /sessions/today | Get today's workout | FR-007, SC-003 |
| PATCH /sessions/{id} | Complete/skip/modify workout | FR-008 |
| POST /cycle/logs | Log cycle event | FR-012 |

## Authentication Flow

1. User signs up: POST /auth/signup → receives JWT token
2. All subsequent requests include: `Authorization: Bearer <token>`
3. Token validated via NextAuth.js middleware

## Error Handling

Standard HTTP status codes:
- 200: Success
- 201: Created
- 204: No content (successful delete/archive)
- 400: Bad request (validation error)
- 401: Unauthorized (missing/invalid token)
- 404: Not found
- 409: Conflict (e.g., active plan already exists)
- 500: Server error

All error responses include:
```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of validation errors"]
}
```

## Contract-First Development

This OpenAPI spec serves as the **source of truth** for API development:

1. **Frontend**: Generate TypeScript types from this spec (ensures type safety)
2. **Backend**: Implement endpoints matching this contract
3. **Testing**: Use contract testing tools (Dredd, Prism) to validate implementation
4. **Documentation**: Auto-generated docs stay in sync with code

## Updates

When modifying the API:
1. Update api-spec.yaml first
2. Validate with `npx @redocly/cli lint`
3. Regenerate client types
4. Update implementation to match
5. Update this README if major changes

## Related Files

- [data-model.md](../data-model.md) - Database schema that backs these endpoints
- [research.md](../research.md) - Technology decisions (TypeScript, REST, etc.)
- [spec.md](../spec.md) - Functional requirements driving these endpoints
