-- Step 1: Add 'pastor' to app_role enum only (must be committed before usage)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pastor';