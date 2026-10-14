-- Run this in Supabase -> SQL Editor if your database was created from an older schema.sql.
-- Paste the whole file and run it once. Safe to run more than once.

-- ---------- 20-minute slots: one student per slot ----------

-- If this fails with "could not create unique index", older bookings share a slot.
-- Cancel the extras (status = 'cancelled') and run again.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_one_per_slot
  ON public.appointments (doctor_id, appointment_date, start_time)
  WHERE status <> 'cancelled';

-- Students can only read their own appointments, so this exposes just which
-- doctor/time pairs are taken on a date (no student details).
CREATE OR REPLACE FUNCTION public.booked_slot_times(_date date)
RETURNS TABLE (doctor_id uuid, start_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.doctor_id, a.start_time
  FROM public.appointments a
  WHERE a.appointment_date = _date AND a.status <> 'cancelled';
$$;
REVOKE EXECUTE ON FUNCTION public.booked_slot_times(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.booked_slot_times(date) TO authenticated;

-- ---------- commonly available dispensary medicines ----------

INSERT INTO public.medicines (name, category, description, price, stock, requires_prescription)
SELECT v.name, v.category, v.description, v.price, v.stock, v.rx
FROM (VALUES
  -- Pain & fever
  ('Paracetamol 500 mg (Crocin)', 'Pain & fever', 'Fever, headache, body ache · strip of 10', 20.00, 200, false),
  ('Paracetamol 650 mg (Dolo 650)', 'Pain & fever', 'High fever, body ache · strip of 15', 32.00, 200, false),
  ('Ibuprofen 400 mg (Brufen)', 'Pain & fever', 'Pain, swelling, fever · strip of 15', 18.00, 120, false),
  ('Aceclofenac + Paracetamol (Zerodol-P)', 'Pain & fever', 'Muscle and joint pain · strip of 10', 65.00, 80, true),
  ('Mefenamic acid + Dicyclomine (Meftal-Spas)', 'Pain & fever', 'Period cramps, abdominal pain · strip of 10', 48.00, 100, false),
  ('Diclofenac gel (Volini)', 'Pain & fever', 'Sprains, muscle pain · 30 g tube', 115.00, 60, false),
  -- Cold, cough & allergy
  ('Cetirizine 10 mg', 'Cold & allergy', 'Sneezing, runny nose, itching · strip of 10', 18.00, 150, false),
  ('Levocetirizine 5 mg', 'Cold & allergy', 'Allergy, cold symptoms · strip of 10', 25.00, 150, false),
  ('Montelukast + Levocetirizine (Montair-LC)', 'Cold & allergy', 'Allergic cold, wheezing · strip of 10', 180.00, 60, true),
  ('Phenylephrine + Chlorpheniramine + Paracetamol (Sinarest)', 'Cold & allergy', 'Common cold, blocked nose · strip of 10', 55.00, 120, false),
  ('Cough syrup (Benadryl)', 'Cold & allergy', 'Dry or wet cough · 100 ml', 120.00, 70, false),
  ('Xylometazoline nasal drops (Otrivin)', 'Cold & allergy', 'Blocked nose · 10 ml', 95.00, 60, false),
  ('Throat lozenges (Strepsils)', 'Cold & allergy', 'Sore throat · pack of 8', 40.00, 150, false),
  ('Steam inhalation capsules (Karvol Plus)', 'Cold & allergy', 'Nasal congestion · strip of 10', 60.00, 80, false),
  -- Stomach & digestion
  ('ORS sachet (Electral)', 'Stomach & digestion', 'Dehydration, loose motions · 21.8 g sachet', 22.00, 300, false),
  ('Antacid gel (Digene)', 'Stomach & digestion', 'Acidity, gas, heartburn · 200 ml', 130.00, 60, false),
  ('Pantoprazole 40 mg (Pan 40)', 'Stomach & digestion', 'Acidity, gastritis · strip of 15', 110.00, 100, true),
  ('Ondansetron 4 mg (Emeset)', 'Stomach & digestion', 'Nausea, vomiting · strip of 10', 45.00, 80, true),
  ('Domperidone 10 mg', 'Stomach & digestion', 'Nausea, bloating · strip of 10', 35.00, 80, true),
  ('Loperamide 2 mg (Eldoper)', 'Stomach & digestion', 'Loose motions · strip of 10', 25.00, 80, false),
  ('Dicyclomine 20 mg (Cyclopam)', 'Stomach & digestion', 'Stomach cramps · strip of 10', 45.00, 80, false),
  ('Isabgol husk (Sat-Isabgol)', 'Stomach & digestion', 'Constipation · 100 g', 110.00, 40, false),
  -- Antibiotics (prescription only)
  ('Amoxicillin + Clavulanic acid 625 mg (Augmentin)', 'Antibiotics', 'Bacterial infections · strip of 10', 200.00, 50, true),
  ('Azithromycin 500 mg (Azithral)', 'Antibiotics', 'Throat and chest infections · strip of 3', 120.00, 50, true),
  ('Metronidazole 400 mg (Flagyl)', 'Antibiotics', 'Stomach infections · strip of 15', 22.00, 60, true),
  ('Ciprofloxacin 500 mg (Ciplox)', 'Antibiotics', 'Urinary and gut infections · strip of 10', 45.00, 50, true),
  -- First aid & skin
  ('Povidone-iodine ointment (Betadine)', 'First aid & skin', 'Cuts, wounds · 20 g', 75.00, 80, false),
  ('Silver sulfadiazine cream (Silverex)', 'First aid & skin', 'Minor burns · 20 g', 85.00, 50, false),
  ('Clotrimazole cream (Candid)', 'First aid & skin', 'Fungal skin infections · 20 g', 90.00, 60, false),
  ('Calamine lotion (Lacto Calamine)', 'First aid & skin', 'Rashes, itching, sunburn · 120 ml', 105.00, 50, false),
  ('Antiseptic liquid (Dettol)', 'First aid & skin', 'Cleaning wounds · 125 ml', 70.00, 80, false),
  ('Adhesive bandages (Band-Aid)', 'First aid & skin', 'Small cuts · pack of 10', 40.00, 150, false),
  ('Crepe bandage 10 cm', 'First aid & skin', 'Sprains, support · 1 roll', 95.00, 40, false),
  ('Sterile cotton & gauze', 'First aid & skin', 'Dressing wounds · 50 g + 5 pads', 45.00, 100, false),
  -- Vitamins & supplements
  ('Vitamin C 500 mg (Limcee)', 'Vitamins', 'Immunity · strip of 15', 25.00, 150, false),
  ('Vitamin B-complex (Becosules)', 'Vitamins', 'Mouth ulcers, weakness · strip of 20', 48.00, 120, false),
  ('Calcium + Vitamin D3 (Shelcal 500)', 'Vitamins', 'Bone health · strip of 15', 115.00, 80, false),
  ('Iron + Folic acid', 'Vitamins', 'Low haemoglobin · strip of 10', 22.00, 80, false),
  -- Eye & ear
  ('Lubricating eye drops (Refresh Tears)', 'Eye & ear', 'Dry, tired eyes from screens · 10 ml', 140.00, 50, false),
  ('Ciprofloxacin eye/ear drops (Ciplox)', 'Eye & ear', 'Eye or ear infection · 5 ml', 25.00, 50, true)
) AS v(name, category, description, price, stock, rx)
WHERE NOT EXISTS (SELECT 1 FROM public.medicines m WHERE m.name = v.name);

-- =====================================================================
-- Roles: doctor, admin, student (user), reception, ambulance, chemist
-- =====================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reception';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ambulance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chemist';

-- compares as text so it can be used in the same run that adds the enum values
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = ANY(_roles));
$$;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, text[]) TO authenticated;

-- ---------- doctors log in with the email set by the admin ----------

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION public.my_doctor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id FROM public.doctors d
  WHERE d.user_id = auth.uid()
     OR (d.email IS NOT NULL AND lower(d.email) = lower(auth.jwt() ->> 'email'))
  ORDER BY (d.user_id = auth.uid()) DESC NULLS LAST
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.my_doctor_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_doctor_id() TO authenticated;

-- ---------- desk staff can see who they are serving ----------

DROP POLICY IF EXISTS "desk staff read profiles" ON public.profiles;
CREATE POLICY "desk staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['reception','ambulance','chemist']));

DROP POLICY IF EXISTS "ambulance read contacts" ON public.emergency_contacts;
CREATE POLICY "ambulance read contacts" ON public.emergency_contacts FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ambulance']));

-- ---------- reception: add and cancel appointments for anyone ----------

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "appointments reception" ON public.appointments;
CREATE POLICY "appointments reception" ON public.appointments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['reception','admin']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['reception','admin']));

-- ---------- ambulance crew: see and update requests ----------

DROP POLICY IF EXISTS "ambulance crew read" ON public.ambulance_requests;
CREATE POLICY "ambulance crew read" ON public.ambulance_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ambulance']));
DROP POLICY IF EXISTS "ambulance crew update" ON public.ambulance_requests;
CREATE POLICY "ambulance crew update" ON public.ambulance_requests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ambulance']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ambulance']));

-- ---------- chemist: medicines and orders ----------

DROP POLICY IF EXISTS "chemist manage medicines" ON public.medicines;
CREATE POLICY "chemist manage medicines" ON public.medicines FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['chemist']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['chemist']));

DROP POLICY IF EXISTS "chemist read orders" ON public.medicine_requests;
CREATE POLICY "chemist read orders" ON public.medicine_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['chemist']));
DROP POLICY IF EXISTS "chemist update orders" ON public.medicine_requests;
CREATE POLICY "chemist update orders" ON public.medicine_requests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['chemist']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['chemist']));

DROP POLICY IF EXISTS "chemist read order items" ON public.medicine_request_items;
CREATE POLICY "chemist read order items" ON public.medicine_request_items FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['chemist']));

DROP POLICY IF EXISTS "chemist read prescriptions" ON storage.objects;
CREATE POLICY "chemist read prescriptions" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'health-files' AND public.has_any_role(auth.uid(), ARRAY['chemist']));

-- The chemist's phone (from their profile) is only shown to students who have placed a
-- cash-on-delivery order.
CREATE OR REPLACE FUNCTION public.chemist_contacts()
RETURNS TABLE (name text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.full_name, p.phone
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id AND r.role::text = 'chemist'
  WHERE coalesce(p.phone, '') <> ''
    AND (EXISTS (SELECT 1 FROM public.medicine_requests m WHERE m.student_id = auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['admin','chemist']));
$$;
REVOKE EXECUTE ON FUNCTION public.chemist_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chemist_contacts() TO authenticated;

-- ---------- notices: dispensary / health concern / doctor availability ----------

ALTER TABLE public.health_alerts ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'dispensary';

-- =====================================================================
-- Doctor leave and blocked slots
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.doctor_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,            -- both times null = whole day (leave)
  end_time time,
  kind text NOT NULL DEFAULT 'leave' CHECK (kind IN ('leave', 'busy')),
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK ((start_time IS NULL) = (end_time IS NULL)),
  CHECK (start_time IS NULL OR end_time > start_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_unavailability TO authenticated;
GRANT ALL ON public.doctor_unavailability TO service_role;
ALTER TABLE public.doctor_unavailability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unavailability readable" ON public.doctor_unavailability;
CREATE POLICY "unavailability readable" ON public.doctor_unavailability FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "unavailability manage" ON public.doctor_unavailability;
CREATE POLICY "unavailability manage" ON public.doctor_unavailability FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin']) OR doctor_id = public.my_doctor_id())
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin']) OR doctor_id = public.my_doctor_id());

-- No new bookings inside a doctor's leave or blocked time.
CREATE OR REPLACE FUNCTION public.check_doctor_available()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'cancelled' AND EXISTS (
    SELECT 1 FROM public.doctor_unavailability u
    WHERE u.doctor_id = NEW.doctor_id
      AND NEW.appointment_date BETWEEN u.start_date AND u.end_date
      AND (u.start_time IS NULL OR (NEW.start_time < u.end_time AND NEW.start_time + interval '20 minutes' > u.start_time))
  ) THEN
    RAISE EXCEPTION 'The doctor is not available at this time' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS appointments_check_available ON public.appointments;
CREATE TRIGGER appointments_check_available
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.check_doctor_available();

-- Leave / block added: cancel the bookings it covers (patients get notified below).
CREATE OR REPLACE FUNCTION public.cancel_appointments_for_unavailability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.appointments a
  SET status = 'cancelled',
      cancelled_by = auth.uid(),
      cancel_reason = CASE WHEN NEW.kind = 'leave' THEN 'Doctor is on leave' ELSE 'Doctor is unavailable' END
                      || coalesce(' (' || nullif(NEW.reason, '') || ')', '')
  WHERE a.doctor_id = NEW.doctor_id
    AND a.status = 'booked'
    AND a.appointment_date BETWEEN NEW.start_date AND NEW.end_date
    AND (NEW.start_time IS NULL OR (a.start_time < NEW.end_time AND a.start_time + interval '20 minutes' > NEW.start_time));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS unavailability_cancels_appointments ON public.doctor_unavailability;
CREATE TRIGGER unavailability_cancels_appointments
AFTER INSERT ON public.doctor_unavailability
FOR EACH ROW EXECUTE FUNCTION public.cancel_appointments_for_unavailability();

-- =====================================================================
-- Notify the patient when someone else books or cancels their appointment
-- =====================================================================

CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  doc text;
  slot text;
BEGIN
  IF auth.uid() IS NOT DISTINCT FROM NEW.student_id THEN
    RETURN NEW;  -- the patient did it themselves
  END IF;
  SELECT name INTO doc FROM public.doctors WHERE id = NEW.doctor_id;
  slot := to_char(NEW.appointment_date, 'Dy DD Mon') || ' at ' || to_char(NEW.start_time, 'HH12:MI AM');

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, body, category)
    VALUES (NEW.student_id, 'Appointment cancelled',
            'Your appointment with ' || coalesce(doc, 'the doctor') || ' on ' || slot || ' was cancelled'
            || coalesce('. Reason: ' || nullif(NEW.cancel_reason, ''), '') || '. Please book another slot.',
            'appointment');
  ELSIF TG_OP = 'INSERT' AND NEW.status <> 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, body, category)
    VALUES (NEW.student_id, 'Appointment booked for you',
            'The dispensary reception booked you with ' || coalesce(doc, 'a doctor') || ' on ' || slot
            || '. Token ' || NEW.token_number || '.',
            'appointment');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS appointments_notify ON public.appointments;
CREATE TRIGGER appointments_notify
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();

REVOKE EXECUTE ON FUNCTION public.check_doctor_available() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_appointments_for_unavailability() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_appointment_change() FROM PUBLIC, anon, authenticated;
