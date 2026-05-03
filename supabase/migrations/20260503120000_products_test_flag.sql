DO $$
DECLARE
  products_table regclass;
BEGIN
  products_table := COALESCE(to_regclass('public.products'), to_regclass('products'));

  IF products_table IS NULL THEN
    RAISE EXCEPTION
      'Cannot apply test-product flag migration: products table was not found in current database.';
  END IF;

  EXECUTE format(
    'ALTER TABLE %s ADD COLUMN IF NOT EXISTS is_test_product boolean NOT NULL DEFAULT false',
    products_table
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS products_is_test_product_idx ON %s (is_test_product)',
    products_table
  );
END
$$;
