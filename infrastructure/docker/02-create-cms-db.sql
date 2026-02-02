-- Create CMS database for Strapi
-- Must connect to postgres DB to create new database

\connect postgres

CREATE DATABASE grandgold_cms;
GRANT ALL PRIVILEGES ON DATABASE grandgold_cms TO postgres;

\connect grandgold_dev
