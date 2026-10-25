BEGIN;
ALTER TABLE users
ALTER COLUMN email
SET NOT NULL;
INSERT INTO schema_migrations(version)
VALUES ('004_require_user_email');
COMMIT;
