CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE job_status AS ENUM (
    'Created',
    'Funded',
    'InProgress',
    'Completed',
    'Cancelled',
    'Disputed',
    'Resolved'
);

CREATE TYPE milestone_status AS ENUM (
    'Pending',
    'Submitted',
    'Approved',
    'Released',
    'RevisionRequested',
    'Disputed',
    'Resolved'
);

CREATE TYPE dispute_status AS ENUM (
    'Opened',
    'Resolved'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address CITEXT NOT NULL UNIQUE,
    display_name TEXT,
    role_preference TEXT CHECK (role_preference IN ('client', 'freelancer', 'both')),
    profile_visibility TEXT NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    contract_address CITEXT NOT NULL,
    onchain_job_id NUMERIC(78, 0) NOT NULL,
    client_wallet CITEXT NOT NULL,
    freelancer_wallet CITEXT NOT NULL,
    token_address CITEXT NOT NULL,
    title TEXT,
    public_summary TEXT,
    private_description TEXT,
    metadata_hash TEXT,
    total_amount_raw NUMERIC(78, 0) NOT NULL,
    released_amount_raw NUMERIC(78, 0) NOT NULL DEFAULT 0,
    status job_status NOT NULL DEFAULT 'Created',
    onchain_created_at TIMESTAMPTZ,
    funded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_jobs_onchain UNIQUE (chain_id, contract_address, onchain_job_id)
);

CREATE INDEX ix_jobs_client_wallet ON jobs (client_wallet);
CREATE INDEX ix_jobs_freelancer_wallet ON jobs (freelancer_wallet);
CREATE INDEX ix_jobs_status ON jobs (status);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    onchain_milestone_id NUMERIC(78, 0) NOT NULL,
    sequence BIGINT NOT NULL,
    title TEXT,
    acceptance_criteria_private TEXT,
    amount_raw NUMERIC(78, 0) NOT NULL,
    evidence_hash TEXT,
    submitted_at TIMESTAMPTZ,
    review_deadline TIMESTAMPTZ,
    status milestone_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_milestones_onchain UNIQUE (job_id, onchain_milestone_id)
);

CREATE INDEX ix_milestones_status ON milestones (status);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    onchain_dispute_id NUMERIC(78, 0) NOT NULL,
    opened_by_wallet CITEXT NOT NULL,
    arbitrator_wallet CITEXT NOT NULL,
    evidence_hash TEXT,
    freelancer_share_bps BIGINT,
    status dispute_status NOT NULL DEFAULT 'Opened',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT uq_disputes_onchain UNIQUE (job_id, onchain_dispute_id)
);

CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
    uploader_wallet CITEXT NOT NULL,
    storage_uri TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    content_type TEXT,
    size_bytes BIGINT,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_evidence_files_job_id ON evidence_files (job_id);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sender_wallet CITEXT NOT NULL,
    body_ciphertext TEXT NOT NULL,
    attachment_file_id UUID REFERENCES evidence_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    redacted_at TIMESTAMPTZ
);

CREATE INDEX ix_chat_messages_job_created ON chat_messages (job_id, created_at);

CREATE TABLE swipe_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_wallet CITEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('job', 'freelancer')),
    target_id UUID NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('left', 'right', 'super')),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_swipe_actions_actor ON swipe_actions (actor_wallet, created_at);

CREATE TABLE indexed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    contract_address CITEXT NOT NULL,
    block_number BIGINT NOT NULL,
    tx_hash TEXT NOT NULL,
    log_index BIGINT NOT NULL,
    event_name TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_indexed_events_log UNIQUE (
        chain_id,
        contract_address,
        block_number,
        tx_hash,
        log_index
    )
);

CREATE INDEX ix_indexed_events_name ON indexed_events (event_name);
CREATE INDEX ix_indexed_events_block ON indexed_events (block_number);

CREATE TABLE indexer_cursors (
    chain_id BIGINT NOT NULL,
    contract_address CITEXT NOT NULL,
    last_finalized_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, contract_address)
);

CREATE TABLE user_reputation_snapshots (
    wallet_address CITEXT PRIMARY KEY,
    completed_jobs BIGINT NOT NULL DEFAULT 0,
    verified_volume_raw NUMERIC(78, 0) NOT NULL DEFAULT 0,
    verified_volume_tier TEXT NOT NULL DEFAULT 'new',
    direct_approval_rate_bps BIGINT NOT NULL DEFAULT 0,
    dispute_rate_bps BIGINT NOT NULL DEFAULT 0,
    repeat_client_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reputation_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet CITEXT NOT NULL,
    viewer_wallet CITEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'contract_details',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_active_reputation_grants
    ON reputation_access_grants (owner_wallet, viewer_wallet, scope)
    WHERE revoked_at IS NULL;

CREATE TABLE sybil_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_a CITEXT NOT NULL,
    wallet_b CITEXT NOT NULL,
    signal_type TEXT NOT NULL,
    score NUMERIC(10, 4) NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_sybil_signals_pair ON sybil_signals (wallet_a, wallet_b);
