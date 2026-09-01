-- ============================================================
-- FizioFit — Fix RLS infinite recursion (patients <-> appointments)
-- 1) SECURITY DEFINER helper functions (bypass RLS, break cycles)
-- 2) Rewrite recursive policies to use the helpers
-- ============================================================

-- === HELPERS (SECURITY DEFINER = bypass RLS) ===

-- Vráti patient ID(s) aktuálneho usera (jeho vlastný záznam)
CREATE OR REPLACE FUNCTION auth.my_patient_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id FROM public.patients p WHERE p.profile_id = auth.uid();
$$;

-- Vráti staff ID aktuálneho usera (ak je doctor/physio/trainer/admin)
CREATE OR REPLACE FUNCTION auth.my_staff_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id FROM public.staff s WHERE s.profile_id = auth.uid();
$$;

-- Vráti profile_id pacientov, ktorých má aktuálny staff pridelených
CREATE OR REPLACE FUNCTION auth.my_patient_profile_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.profile_id
  FROM public.patients p
  JOIN public.appointments a ON a.patient_id = p.id
  WHERE a.staff_id = (SELECT s.id FROM public.staff s WHERE s.profile_id = auth.uid());
$$;

-- === REWRITE POLICIES ===

-- patients: tréner vidí len svojich pacientov (bez rekurzie cez appointments)
DROP POLICY IF EXISTS "tréner vidí len svojich pacientov" ON public.patients;
CREATE POLICY "tréner vidí len svojich pacientov" ON public.patients
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'trainer'::user_role
    AND id IN (SELECT a.patient_id FROM public.appointments a WHERE a.staff_id = auth.my_staff_id())
  );

-- appointments: pacient vidí svoje rezervácie (bez rekurzie cez patients)
DROP POLICY IF EXISTS "pacient vidí svoje rezervácie" ON public.appointments;
CREATE POLICY "pacient vidí svoje rezervácie" ON public.appointments
  FOR ALL TO authenticated
  USING (patient_id IN (SELECT auth.my_patient_ids()))
  WITH CHECK (patient_id IN (SELECT auth.my_patient_ids()));

-- appointments: staff vidí rezervácie u seba (bez rekurzie cez staff)
DROP POLICY IF EXISTS "staff vidí rezervácie u seba" ON public.appointments;
CREATE POLICY "staff vidí rezervácie u seba" ON public.appointments
  FOR ALL TO authenticated
  USING (staff_id = auth.my_staff_id())
  WITH CHECK (staff_id = auth.my_staff_id());

-- profiles: doctor vidí profily svojich pacientov (bez rekurzie)
DROP POLICY IF EXISTS "doctor vidí profily svojich pacientov" ON public.profiles;
CREATE POLICY "doctor vidí profily svojich pacientov" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'doctor'::user_role
    AND id IN (SELECT auth.my_patient_profile_ids())
  );

-- profiles: staff vidí profily podla priradenia (bez rekurzie)
DROP POLICY IF EXISTS "staff vidí profily podla priradenia" ON public.profiles;
CREATE POLICY "staff vidí profily podla priradenia" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.is_staff() AND id IN (SELECT auth.my_patient_profile_ids()));
