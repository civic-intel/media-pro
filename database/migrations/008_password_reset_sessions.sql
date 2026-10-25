BEGIN;

ALTER TABLE users
  ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;

INSERT INTO schema_migrations(version)
VALUES ('008_password_reset_sessions');

COMMIT;
