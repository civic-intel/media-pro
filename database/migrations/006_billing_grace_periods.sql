BEGIN;
-- 1. Billing failure and suspension state.
-- NULL grace_period_days means use the applicable plan or contract policy.
ALTER TABLE subscriptions
ADD COLUMN grace_period_days INTEGER CHECK (
    grace_period_days IS NULL
    OR grace_period_days >= 0
  ),
  ADD COLUMN payment_failed_at TIMESTAMPTZ,
  ADD COLUMN grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN suspended_at TIMESTAMPTZ,
  ADD COLUMN suspension_reason TEXT;
-- Retain all existing status values and permit explicit suspension.
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'suspended',
      'cancelled',
      'expired'
    )
  );
CREATE INDEX subscriptions_grace_period_idx ON subscriptions(grace_period_ends_at)
WHERE status = 'past_due'
  AND grace_period_ends_at IS NOT NULL;
CREATE INDEX subscriptions_suspended_idx ON subscriptions(suspended_at)
WHERE status = 'suspended';
-- 2. Verified billing-provider events.
-- Store event identifiers and processing metadata, not secret payloads.
CREATE TABLE billing_provider_events (
  id BIGSERIAL PRIMARY KEY,
  billing_provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processed', 'failed', 'ignored')
  ),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  failure_reason TEXT,
  UNIQUE (billing_provider, provider_event_id)
);
CREATE INDEX billing_provider_events_processing_idx ON billing_provider_events(processing_status, received_at);
-- 3. Auditable billing access changes.
CREATE TABLE billing_access_events (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE RESTRICT,
  organisation_id BIGINT REFERENCES organisations(id) ON DELETE
  SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    event_type TEXT NOT NULL CHECK (
      event_type IN (
        'payment_failed',
        'grace_started',
        'grace_extended',
        'access_suspended',
        'access_reinstated',
        'subscription_cancelled',
        'subscription_expired',
        'admin_override'
      )
    ),
    reason TEXT,
    source TEXT NOT NULL DEFAULT 'system',
    billing_provider_event_id BIGINT REFERENCES billing_provider_events(id) ON DELETE
  SET NULL,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX billing_access_events_subscription_idx ON billing_access_events(subscription_id, created_at DESC);
CREATE INDEX billing_access_events_organisation_idx ON billing_access_events(organisation_id, created_at DESC);
INSERT INTO schema_migrations(version)
VALUES ('006_billing_grace_periods');
COMMIT;
