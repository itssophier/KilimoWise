-- KiliMoWise initial schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS farmer (
    id            BIGSERIAL PRIMARY KEY,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    phone_number  VARCHAR(20)  NOT NULL UNIQUE,
    dob           DATE,
    gender        VARCHAR(10)  NOT NULL,
    location      VARCHAR(100),
    password      VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmer_phone_number ON farmer (phone_number);

CREATE TABLE IF NOT EXISTS expenses (
    id            BIGSERIAL PRIMARY KEY,
    category      VARCHAR(20)  NOT NULL,
    amount        DOUBLE PRECISION NOT NULL,
    description   VARCHAR(200),
    expense_date  TIMESTAMP    NOT NULL,
    farmer_id     BIGINT       NOT NULL REFERENCES farmer(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expenses_farmer_id      ON expenses (farmer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_farmer_expdate ON expenses (farmer_id, expense_date);

CREATE TABLE IF NOT EXISTS advisory (
    id                   BIGSERIAL PRIMARY KEY,
    farmer_id            BIGINT       NOT NULL REFERENCES farmer(id) ON DELETE CASCADE,
    type                 VARCHAR(10)  NOT NULL,
    problem_description  TEXT,
    ai_response          TEXT
);

CREATE INDEX IF NOT EXISTS idx_advisory_farmer_id ON advisory (farmer_id);
