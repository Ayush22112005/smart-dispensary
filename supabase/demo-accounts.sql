-- Creates one ready-to-use login for every role. Run AFTER update.sql (or a fresh schema.sql):
-- Supabase -> SQL Editor -> paste this whole file -> Run. Safe to run again.
--
--   role        email                       password
--   admin       admin@dispensary.test       Dispensary@123
--   doctor      doctor@dispensary.test      Dispensary@123   (linked to Dr. Ritu Bassi)
--   reception   reception@dispensary.test   Dispensary@123
--   ambulance   ambulance@dispensary.test   Dispensary@123
--   chemist     chemist@dispensary.test     Dispensary@123
--   student     student@dispensary.test     Dispensary@123
--
-- Change these passwords (Forgot password, or Supabase -> Authentication -> Users) before
-- real use. Accounts are created already email-confirmed.

DO $$
DECLARE
  acc record;
  uid uuid;
  pw constant text := 'Dispensary@123';
BEGIN
  IF to_regclass('public.doctor_unavailability') IS NULL THEN
    RAISE EXCEPTION 'Run supabase/update.sql first, then run this file again.';
  END IF;

  FOR acc IN
    SELECT * FROM (VALUES
      ('admin@dispensary.test',     'Dispensary Admin',   'admin',     '+91 90000 00001', NULL),
      ('doctor@dispensary.test',    'Dr. Ritu Bassi',     'doctor',    '+91 90000 00002', NULL),
      ('reception@dispensary.test', 'Front Desk',         'reception', '+91 90000 00003', NULL),
      ('ambulance@dispensary.test', 'Ambulance Crew',     'ambulance', '+91 82880 08122', NULL),
      ('chemist@dispensary.test',   'Abhishek Bhardwaj',  'chemist',   '+91 90000 00005', NULL),
      ('student@dispensary.test',   'Demo Student',       'student',   '+91 90000 00006', '102303999')
    ) AS t(email, full_name, role, phone, roll_no)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE lower(email) = acc.email;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', acc.email,
        extensions.crypt(pw, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', acc.full_name, 'student_id', acc.roll_no),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), uid, uid::text,
        jsonb_build_object('sub', uid::text, 'email', acc.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    END IF;

    -- the signup trigger normally creates the profile; make sure it exists and is filled in
    INSERT INTO public.profiles (id, email, full_name, phone, student_id)
    VALUES (uid, acc.email, acc.full_name, acc.phone, acc.roll_no)
    ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
          student_id = coalesce(EXCLUDED.student_id, public.profiles.student_id);

    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'student')
    ON CONFLICT DO NOTHING;
    EXECUTE 'INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::public.app_role) ON CONFLICT DO NOTHING'
      USING uid, acc.role;
  END LOOP;

  -- link the demo doctor login to an existing doctor profile
  UPDATE public.doctors SET email = 'doctor@dispensary.test'
  WHERE name = 'Dr. Ritu Bassi' AND (email IS NULL OR email = '');
END $$;
