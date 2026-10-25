BEGIN;
CREATE TABLE auth_action_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (
    purpose IN ('email_verification', 'password_reset')
  ),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX auth_action_tokens_user_purpose_idx ON auth_action_tokens(user_id, purpose, created_at DESC);
CREATE INDEX auth_action_tokens_expiry_idx ON auth_action_tokens(expires_at)
WHERE used_at IS NULL;
INSERT INTO schema_migrations(version)
VALUES ('007_auth_action_tokens');
COMMIT;
