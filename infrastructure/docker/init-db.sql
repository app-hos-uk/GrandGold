-- GrandGold Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create public schema tables will be created by Drizzle migrations
-- This script just sets up the necessary extensions and initial configurations

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grandgold_dev TO postgres;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function for generating order numbers
CREATE OR REPLACE FUNCTION generate_order_number(country_code TEXT)
RETURNS TEXT AS $$
DECLARE
    seq_val BIGINT;
    order_num TEXT;
BEGIN
    -- Get next sequence value
    SELECT nextval('order_number_seq') INTO seq_val;
    
    -- Format: GG-{COUNTRY}-{YYYYMMDD}-{SEQUENCE}
    order_num := 'GG-' || country_code || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_val::TEXT, 6, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create function for tenant schema creation
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Grant permissions
    EXECUTE format('GRANT ALL ON SCHEMA %I TO postgres', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'GrandGold database initialized successfully';
END $$;
