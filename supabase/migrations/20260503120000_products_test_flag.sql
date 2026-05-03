ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_test_product boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_is_test_product_idx ON public.products (is_test_product);
