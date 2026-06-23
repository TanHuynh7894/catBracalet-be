CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS store_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  shop_address varchar(500) NOT NULL,
  province varchar(100) NOT NULL,
  district varchar(100) NOT NULL,
  ward varchar(100) NOT NULL,
  detail_address varchar(500) NOT NULL,
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

ALTER TABLE store_locations
  ADD COLUMN IF NOT EXISTS province varchar(100),
  ADD COLUMN IF NOT EXISTS district varchar(100),
  ADD COLUMN IF NOT EXISTS ward varchar(100),
  ADD COLUMN IF NOT EXISTS detail_address varchar(500);

UPDATE store_locations
SET
  province = COALESCE(province, ''),
  district = COALESCE(district, ''),
  ward = COALESCE(ward, ''),
  detail_address = COALESCE(detail_address, shop_address)
WHERE province IS NULL
  OR district IS NULL
  OR ward IS NULL
  OR detail_address IS NULL;

ALTER TABLE store_locations
  ALTER COLUMN province SET NOT NULL,
  ALTER COLUMN district SET NOT NULL,
  ALTER COLUMN ward SET NOT NULL,
  ALTER COLUMN detail_address SET NOT NULL;

DROP INDEX IF EXISTS uq_store_locations_one_active;

CREATE TABLE IF NOT EXISTS shop_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_location_id uuid NOT NULL REFERENCES store_locations(id),
  variant_id uuid NOT NULL REFERENCES product_variants(variant_id),
  stock_quantity int NOT NULL DEFAULT 0,
  CONSTRAINT uq_shop_inventory_shop_variant UNIQUE (shop_location_id, variant_id),
  CONSTRAINT chk_shop_inventory_stock CHECK (stock_quantity >= 0)
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_origin_shop_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_orders_shipping_origin_shop'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_shipping_origin_shop
      FOREIGN KEY (shipping_origin_shop_id)
      REFERENCES store_locations(id);
  END IF;
END $$;
