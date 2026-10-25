BEGIN;
CREATE TABLE user_plan_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES account_plans(plan_code),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'ended')),
  assignment_source TEXT NOT NULL DEFAULT 'system',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    valid_until IS NULL
    OR valid_until > valid_from
  ),
  CHECK (plan_code IN ('member', 'pro'))
);
CREATE UNIQUE INDEX user_one_current_plan_idx ON user_plan_assignments(user_id)
WHERE status = 'active';
CREATE INDEX user_plan_assignments_lookup_idx ON user_plan_assignments(user_id, status, valid_from DESC);
INSERT INTO schema_migrations(version)
VALUES ('003_user_plan_assignments');
COMMIT;
