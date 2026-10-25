BEGIN;
-- 1. External provider registry.
CREATE TABLE api_providers (
  id BIGSERIAL PRIMARY KEY,
  provider_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'disabled', 'maintenance')),
  credential_reference TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 2. Provider request quotas: one policy per provider and time window.
-- Examples: 60 requests per 60 seconds, 5,000 per day.
CREATE TABLE provider_quota_policies (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  request_limit BIGINT NOT NULL CHECK (request_limit > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, window_seconds)
);
-- 3. Provider concurrency limits, kept separate from time-window quotas.
CREATE TABLE provider_concurrency_policies (
  provider_id BIGINT PRIMARY KEY REFERENCES api_providers(id) ON DELETE RESTRICT,
  max_concurrent_requests INTEGER NOT NULL CHECK (max_concurrent_requests > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE provider_inflight_leases (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  usage_event_id BIGINT,
  lease_token UUID NOT NULL UNIQUE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  CHECK (expires_at > acquired_at)
);
CREATE INDEX provider_inflight_active_idx ON provider_inflight_leases(provider_id, expires_at)
WHERE released_at IS NULL;
-- 4. Provider spending policy.
-- Amounts are in the provider's configured currency.
CREATE TABLE provider_budget_policies (
  provider_id BIGINT PRIMARY KEY REFERENCES api_providers(id) ON DELETE RESTRICT,
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  daily_hard_cap NUMERIC(18, 6) CHECK (
    daily_hard_cap IS NULL
    OR daily_hard_cap >= 0
  ),
  monthly_hard_cap NUMERIC(18, 6) CHECK (
    monthly_hard_cap IS NULL
    OR monthly_hard_cap >= 0
  ),
  max_single_request_cost NUMERIC(18, 6) CHECK (
    max_single_request_cost IS NULL
    OR max_single_request_cost >= 0
  ),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  block_when_cost_unknown BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Configurable alerts at percentages such as 50, 75, 90 and 100.
CREATE TABLE provider_budget_alert_thresholds (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  period_kind TEXT NOT NULL CHECK (period_kind IN ('daily', 'monthly')),
  threshold_percent NUMERIC(5, 2) NOT NULL CHECK (
    threshold_percent > 0
    AND threshold_percent <= 100
  ),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, period_kind, threshold_percent)
);
-- 5. Budget period ledger.
-- A period row stores the cap in force for that period and the atomic totals.
CREATE TABLE provider_budget_periods (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  period_kind TEXT NOT NULL CHECK (period_kind IN ('daily', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  hard_cap_snapshot NUMERIC(18, 6) CHECK (
    hard_cap_snapshot IS NULL
    OR hard_cap_snapshot >= 0
  ),
  reserved_amount NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (reserved_amount >= 0),
  spent_amount NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end > period_start),
  UNIQUE (provider_id, period_kind, period_start)
);
CREATE INDEX provider_budget_period_lookup_idx ON provider_budget_periods(provider_id, period_kind, period_end);
-- 6. Durable event log for each logical provider operation.
CREATE TABLE api_usage_events (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  user_id INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE
  SET NULL,
    operation TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
      status IN (
        'pending',
        'succeeded',
        'failed',
        'timed_out',
        'rejected'
      )
    ),
    provider_request_id TEXT,
    http_status INTEGER CHECK (
      http_status IS NULL
      OR http_status BETWEEN 100 AND 599
    ),
    error_category TEXT,
    error_code TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    latency_ms BIGINT CHECK (
      latency_ms IS NULL
      OR latency_ms >= 0
    ),
    estimated_cost NUMERIC(18, 6) CHECK (
      estimated_cost IS NULL
      OR estimated_cost >= 0
    ),
    actual_cost NUMERIC(18, 6) CHECK (
      actual_cost IS NULL
      OR actual_cost >= 0
    ),
    currency CHAR(3) CHECK (
      currency IS NULL
      OR currency ~ '^[A-Z]{3}$'
    ),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, idempotency_key),
    CHECK (
      finished_at IS NULL
      OR finished_at >= started_at
    )
);
CREATE INDEX api_usage_events_provider_time_idx ON api_usage_events(provider_id, started_at DESC);
CREATE INDEX api_usage_events_user_time_idx ON api_usage_events(user_id, started_at DESC);
CREATE INDEX api_usage_events_organisation_time_idx ON api_usage_events(organisation_id, started_at DESC);
CREATE INDEX api_usage_events_status_idx ON api_usage_events(status, started_at);
-- 7. Individual budget reservations. One event can reserve against
-- both its daily and monthly budget periods.
CREATE TABLE provider_budget_reservations (
  id BIGSERIAL PRIMARY KEY,
  usage_event_id BIGINT NOT NULL REFERENCES api_usage_events(id) ON DELETE RESTRICT,
  budget_period_id BIGINT NOT NULL REFERENCES provider_budget_periods(id) ON DELETE RESTRICT,
  reserved_amount NUMERIC(18, 6) NOT NULL CHECK (reserved_amount >= 0),
  settled_amount NUMERIC(18, 6) CHECK (
    settled_amount IS NULL
    OR settled_amount >= 0
  ),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'settled', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  UNIQUE (usage_event_id, budget_period_id)
);
CREATE INDEX provider_budget_reservations_recovery_idx ON provider_budget_reservations(status, created_at);
-- 8. Atomic request-window counters for provider quotas.
CREATE TABLE provider_usage_windows (
  id BIGSERIAL PRIMARY KEY,
  quota_policy_id BIGINT NOT NULL REFERENCES provider_quota_policies(id) ON DELETE RESTRICT,
  window_start TIMESTAMPTZ NOT NULL,
  request_count BIGINT NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quota_policy_id, window_start)
);
CREATE INDEX provider_usage_windows_cleanup_idx ON provider_usage_windows(window_start);
-- 9. Application-level rate limits for users, organisations and plans.
-- subject_key is a canonical identifier, not a secret or API key.
CREATE TABLE api_rate_limit_policies (
  id BIGSERIAL PRIMARY KEY,
  policy_code TEXT NOT NULL UNIQUE,
  scope_type TEXT NOT NULL CHECK (
    scope_type IN ('global', 'user', 'organisation', 'plan')
  ),
  requests_limit BIGINT NOT NULL CHECK (requests_limit > 0),
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE api_rate_limit_windows (
  id BIGSERIAL PRIMARY KEY,
  policy_id BIGINT NOT NULL REFERENCES api_rate_limit_policies(id) ON DELETE RESTRICT,
  subject_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count BIGINT NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (policy_id, subject_key, window_start)
);
CREATE INDEX api_rate_limit_windows_cleanup_idx ON api_rate_limit_windows(window_start);
-- 10. Durable alert deduplication and policy-change audit.
CREATE TABLE provider_budget_alert_events (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES api_providers(id) ON DELETE RESTRICT,
  period_kind TEXT NOT NULL CHECK (period_kind IN ('daily', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  threshold_percent NUMERIC(5, 2) NOT NULL CHECK (
    threshold_percent > 0
    AND threshold_percent <= 100
  ),
  observed_spend NUMERIC(18, 6) NOT NULL CHECK (observed_spend >= 0),
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  UNIQUE (
    provider_id,
    period_kind,
    period_start,
    threshold_percent
  )
);
CREATE TABLE api_usage_policy_audit (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES api_providers(id) ON DELETE RESTRICT,
  policy_type TEXT NOT NULL,
  policy_id BIGINT,
  action TEXT NOT NULL CHECK (
    action IN ('created', 'updated', 'enabled', 'disabled')
  ),
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    change_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO schema_migrations(version)
VALUES ('005_api_usage_service');
COMMIT;
