
BEGIN;

CREATE TABLE contact_enquiries (
  id BIGSERIAL PRIMARY KEY,
  title TEXT CHECK (
    title IS NULL OR title IN ('Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Other')
  ),
  full_name TEXT NOT NULL CHECK (
    length(trim(full_name)) BETWEEN 1 AND 100
  ),
  email TEXT NOT NULL CHECK (
    length(email) BETWEEN 3 AND 254
  ),
  company TEXT NOT NULL CHECK (
    length(trim(company)) BETWEEN 1 AND 150
  ),
  job_title TEXT CHECK (
    job_title IS NULL OR length(trim(job_title)) <= 100
  ),
  department TEXT CHECK (
    department IS NULL OR length(trim(department)) <= 100
  ),
  subject TEXT CHECK (
    subject IS NULL OR length(trim(subject)) BETWEEN 1 AND 200
  ),
  message TEXT NOT NULL CHECK (
    length(trim(message)) BETWEEN 1 AND 5000
  ),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX contact_enquiries_status_created_idx
  ON contact_enquiries (status, created_at DESC);

CREATE INDEX contact_enquiries_email_created_idx
  ON contact_enquiries (email, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('009_contact_enquiries');

COMMIT;
