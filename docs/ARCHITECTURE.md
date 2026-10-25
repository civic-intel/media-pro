# Adlas Architecture

## Principles

1. Maintain one canonical identity for each entity.
2. Represent commercial relationships as typed, independently
   evidenced records between canonical entities.
3. Preserve source provenance, review status and audit history.
4. Enforce authentication, authorisation and entitlements on the server.
5. Share domain services across HTTP and MCP entry points.
6. Keep the initial architecture modular and deployable without
   requiring microservices or a dedicated graph database.
7. Use version-controlled database migrations for schema changes.

## Initial components

- Next.js / TypeScript web application
- Go HTTP API
- Go MCP integration layer
- PostgreSQL relational database
- Background workers when required

## Domain modules

- Entities
- Relationships
- Evidence and provenance
- Research and insights
- Workspaces
- Identity, entitlements and usage

## Security boundary

The HTTP API and MCP server must apply the same domain authorization
and entitlement rules. MCP is an integration interface, not a
replacement for application security.
