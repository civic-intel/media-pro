BEGIN;
-- Track applied database migrations.
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Database-owned plan defaults and support entitlements.
CREATE TABLE account_plans (
  plan_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  ads_enabled BOOLEAN NOT NULL,
  throttling_enabled BOOLEAN NOT NULL,
  included_seats INTEGER,
  support_level TEXT NOT NULL CHECK (
    support_level IN (
      'self_service',
      'standard',
      'priority',
      'contract'
    )
  ),
  support_channels TEXT [] NOT NULL DEFAULT '{}',
  support_hours TEXT,
  first_response_target_minutes INTEGER,
  support_sla_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    included_seats IS NULL
    OR included_seats >= 1
  ),
  CHECK (
    first_response_target_minutes IS NULL
    OR first_response_target_minutes > 0
  ),
  CHECK (
    (
      plan_code = 'enterprise'
      AND included_seats IS NULL
    )
    OR (
      plan_code <> 'enterprise'
      AND included_seats IS NOT NULL
    )
  )
);
INSERT INTO account_plans (
    plan_code,
    display_name,
    ads_enabled,
    throttling_enabled,
    included_seats,
    support_level,
    support_channels,
    support_hours,
    first_response_target_minutes
  )
VALUES (
    'member',
    'Member',
    TRUE,
    TRUE,
    1,
    'self_service',
    ARRAY ['documentation', 'help_centre'],
    NULL,
    NULL
  ),
  (
    'pro',
    'Pro',
    FALSE,
    TRUE,
    1,
    'standard',
    ARRAY ['documentation', 'email', 'ticket'],
    'Business days',
    960
  ),
  (
    'business',
    'Business',
    FALSE,
    TRUE,
    3,
    'priority',
    ARRAY ['documentation', 'email', 'ticket'],
    'Business days',
    480
  ),
  (
    'enterprise',
    'Enterprise',
    FALSE,
    FALSE,
    NULL,
    'contract',
    ARRAY ['contract_defined'],
    NULL,
    NULL
  );
-- Organisation records. Enterprise provisioning is controlled by
-- server-side authorisation, not by allowing arbitrary client inserts.
CREATE TABLE organisations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'suspended', 'closed')
  ),
  created_by INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE organisation_members (
  id BIGSERIAL PRIMARY KEY,
  organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, user_id)
);
CREATE INDEX organisation_members_user_idx ON organisation_members(user_id, status);
CREATE INDEX organisation_members_org_status_idx ON organisation_members(organisation_id, status);
-- Invitations store only a hash of the secret invitation token.
CREATE TABLE organisation_invitations (
  id BIGSERIAL PRIMARY KEY,
  organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX organisation_invitations_org_idx ON organisation_invitations(organisation_id);
CREATE UNIQUE INDEX organisation_invitation_pending_email_idx ON organisation_invitations(organisation_id, LOWER(invited_email))
WHERE accepted_at IS NULL
  AND revoked_at IS NULL;
-- A subscription belongs to either an individual or an organisation.
-- Personal subscriptions remain separate from organisation membership.
CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  plan_code TEXT NOT NULL REFERENCES account_plans(plan_code),
  billing_scope TEXT NOT NULL CHECK (billing_scope IN ('personal', 'organisation')),
  user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  organisation_id BIGINT REFERENCES organisations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'cancelled',
      'expired'
    )
  ),
  billing_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  additional_seats INTEGER NOT NULL DEFAULT 0 CHECK (additional_seats >= 0),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (
      billing_scope = 'personal'
      AND user_id IS NOT NULL
      AND organisation_id IS NULL
      AND plan_code IN ('member', 'pro')
    )
    OR (
      billing_scope = 'organisation'
      AND organisation_id IS NOT NULL
      AND user_id IS NULL
      AND plan_code IN ('business', 'enterprise')
    )
  )
);
CREATE INDEX subscriptions_user_status_idx ON subscriptions(user_id, status);
CREATE INDEX subscriptions_org_status_idx ON subscriptions(organisation_id, status);
CREATE UNIQUE INDEX subscriptions_one_current_personal_idx ON subscriptions(user_id)
WHERE billing_scope = 'personal'
  AND status IN ('pending', 'trialing', 'active', 'past_due');
CREATE UNIQUE INDEX subscriptions_one_current_org_idx ON subscriptions(organisation_id)
WHERE billing_scope = 'organisation'
  AND status IN ('pending', 'trialing', 'active', 'past_due');
-- Negotiated Enterprise terms. An active contract overrides plan defaults.
CREATE TABLE enterprise_contracts (
  id BIGSERIAL PRIMARY KEY,
  organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  contract_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'pending',
      'active',
      'expired',
      'terminated'
    )
  ),
  seat_limit INTEGER NOT NULL CHECK (seat_limit >= 1),
  usage_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  support_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  currency CHAR(3),
  contract_value NUMERIC(14, 2),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
      ends_at IS NULL
      OR starts_at IS NULL
      OR ends_at > starts_at
    )
);
CREATE UNIQUE INDEX enterprise_one_active_contract_idx ON enterprise_contracts(organisation_id)
WHERE status = 'active';
-- Affiliate identities and referral codes.
CREATE TABLE affiliates (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE
  SET NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
      status IN ('pending', 'approved', 'suspended', 'closed')
    ),
    payout_threshold NUMERIC(12, 2) NOT NULL DEFAULT 50 CHECK (payout_threshold >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE affiliate_codes (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- A referral may be captured before registration, then linked to a user.
CREATE TABLE referral_attributions (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  affiliate_code_id BIGINT REFERENCES affiliate_codes(id) ON DELETE
  SET NULL,
    referred_user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE
  SET NULL,
    anonymous_referral_id TEXT,
    first_touch_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
      referred_user_id IS NOT NULL
      OR anonymous_referral_id IS NOT NULL
    )
);
CREATE INDEX referral_attributions_affiliate_idx ON referral_attributions(affiliate_id, first_touch_at);
-- Immutable commission ledger; payment processing is implemented
-- server-side and must be idempotent.
CREATE TABLE affiliate_commissions (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  referral_attribution_id BIGINT NOT NULL REFERENCES referral_attributions(id) ON DELETE RESTRICT,
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  commission_type TEXT NOT NULL CHECK (
    commission_type IN ('recurring', 'one_off', 'adjustment')
  ),
  rate_percent NUMERIC(5, 2),
  eligible_revenue NUMERIC(14, 2) NOT NULL,
  commission_amount NUMERIC(14, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'approved',
      'payable',
      'paid',
      'reversed'
    )
  ),
  provider_payment_reference TEXT UNIQUE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payable_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (eligible_revenue >= 0),
  CHECK (commission_amount >= 0),
  CHECK (
    rate_percent IS NULL
    OR (
      rate_percent >= 0
      AND rate_percent <= 100
    )
  )
);
CREATE INDEX affiliate_commissions_payout_idx ON affiliate_commissions(affiliate_id, status, payable_at);
-- Support cases and escalation records.
CREATE TABLE support_cases (
  id BIGSERIAL PRIMARY KEY,
  case_reference TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE
  SET NULL,
    subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE
  SET NULL,
    category TEXT NOT NULL CHECK (
      category IN (
        'technical',
        'account',
        'billing',
        'security',
        'other'
      )
    ),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (
      status IN (
        'open',
        'in_progress',
        'waiting_on_customer',
        'resolved',
        'closed'
      )
    ),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE
  SET NULL,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX support_cases_user_status_idx ON support_cases(user_id, status, created_at);
CREATE INDEX support_cases_org_status_idx ON support_cases(organisation_id, status, created_at);
INSERT INTO schema_migrations(version)
VALUES ('001_auth'), ('002_platform');
COMMIT;
