-- =============================================================================
-- DATABASE SCHEMA: PORTAL TECHNICAL REVIEW & QA LAPORAN
-- TARGET: OPINI NSR QUALITY GATEKEEPER (KJPP NANANG RAHAYU SIGIT PARYANTO & REKAN)
-- COMPATIBILITY: PostgreSQL 14+, Prisma, SQLAlchemy
-- =============================================================================

-- 1. ENUM DEFINITIONS
DO $$ BEGIN
    CREATE TYPE qa_verdict AS ENUM (
      'ACCEPTABLE', 
      'ACCEPTABLE_WITH_REVISION', 
      'REQUIRES_MAJOR_REVISION', 
      'NOT_ACCEPTABLE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE finding_severity AS ENUM (
      'CRITICAL', 
      'MAJOR', 
      'MODERATE', 
      'MINOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. QA REVIEWS MASTER TABLE
CREATE TABLE IF NOT EXISTS qa_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    status qa_verdict DEFAULT 'REQUIRES_MAJOR_REVISION',
    compliance_score NUMERIC(5,2) NOT NULL,
    total_market_value NUMERIC(18,2),
    total_liquidation_value NUMERIC(18,2),
    discrepancy_amount NUMERIC(18,2) DEFAULT 0,
    generated_report_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEX FOR FAST JO LOOKUP & GATEKEEPING
CREATE INDEX IF NOT EXISTS idx_qa_reviews_job_order_id ON qa_reviews(job_order_id);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_status ON qa_reviews(status);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_file_hash ON qa_reviews(file_hash);

-- 3. QA FINDINGS DETAIL TABLE
CREATE TABLE IF NOT EXISTS qa_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_review_id UUID REFERENCES qa_reviews(id) ON DELETE CASCADE,
    severity finding_severity NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'CALCULATION', 'METHODOLOGY', 'CLERICAL', 'SPI_COMPLIANCE'
    title TEXT NOT NULL,
    condition_found TEXT NOT NULL,
    standard_reference TEXT NOT NULL, -- 'SPI 105', 'KEPI Butir 3', dll.
    impact_analysis TEXT NOT NULL,
    corrective_action TEXT NOT NULL,
    page_numbers INTEGER[] NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_findings_review_id ON qa_findings(qa_review_id);
CREATE INDEX IF NOT EXISTS idx_qa_findings_severity ON qa_findings(severity);
CREATE INDEX IF NOT EXISTS idx_qa_findings_category ON qa_findings(category);
