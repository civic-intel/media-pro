# Adlas

Commercial market intelligence connecting companies, brands, people,
agencies, campaigns and the relationships between them.

## Technology

- Web: Next.js and TypeScript
- Backend: Go
- Database: PostgreSQL
- Integration: Model Context Protocol (MCP)

## Repository layout

- `web/` — web application
- `services/api/` — Go HTTP API
- `services/mcp/` — MCP integration server
- `db/migrations/` — database migrations
- `docs/` — architecture and product decisions
- `scripts/` — development utilities

## Development status

Foundation stage. Application services and database migrations
will be added incrementally.

## Security

Never commit real credentials, tokens or local environment files.
All application access must be authorised by the backend.
