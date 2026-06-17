CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS store_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  shop_address varchar(500) NOT NULL,
  phone_number varchar(20) NOT NULL,
  working_hours varchar(255) NOT NULL,
  shop_latitude numeric NOT NULL,
  shop_longitude numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_store_locations_latitude CHECK (shop_latitude >= -90 AND shop_latitude <= 90),
  CONSTRAINT chk_store_locations_longitude CHECK (shop_longitude >= -180 AND shop_longitude <= 180)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_locations_one_active
  ON store_locations ((is_active))
  WHERE is_active = true;
