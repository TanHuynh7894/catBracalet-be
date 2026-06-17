CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shop_locations (
  shop_location_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name varchar(255) NOT NULL,
  address varchar(500) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  google_place_id varchar(255),
  note text,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_shop_locations_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT chk_shop_locations_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT chk_shop_locations_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shop_locations_one_active
  ON shop_locations ((status))
  WHERE status = 'ACTIVE';
