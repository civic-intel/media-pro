BEGIN;

CREATE TABLE password_reset_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX password_reset_codes_user_created_idx
  ON password_reset_codes(user_id, created_at DESC);

CREATE INDEX password_reset_codes_expiry_idx
  ON password_reset_codes(expires_at)
  WHERE used_at IS NULL;

INSERT INTO schema_migrations(version)
VALUES ('010_password_reset_codes');

COMMIT;
