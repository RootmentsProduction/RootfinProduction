-- Setup script for PostgreSQL database
-- Run this in PostgreSQL command line or pgAdmin

-- Create the databases
CREATE DATABASE rootfin;
CREATE DATABASE rootfin_dev;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON DATABASE rootfin TO postgres;
GRANT ALL PRIVILEGES ON DATABASE rootfin_dev TO postgres;

-- Connect to the database and create extensions if needed
\c rootfin;
-- Add any extensions here if needed

\c rootfin_dev;
-- Add any extensions here if needed