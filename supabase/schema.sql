-- ============================================================
-- FizioFit — Supabase Schema
-- Zdravotnícke centrum + fyzioterapia + funkčný tréning
-- ============================================================

-- === EXTENSIONS ===
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === SUPABASE ROLES ===
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- === ENUMS ===
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'physio', 'trainer', 'patient');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE appointment_type AS ENUM ('doctor', 'physio', 'trainer');
CREATE TYPE consent_type AS ENUM ('gdpr_general', 'gdpr_health', 'photo_video', 'terms_conditions', 'marketing');
CREATE TYPE exercise_type AS ENUM ('rehab', 'strength', 'cardio', 'mobility', 'stretching');
CREATE TYPE question_type AS ENUM ('text', 'choice', 'scale_1_10', 'scale_1_5', 'bool', 'photo');
CREATE TYPE plan_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- ============================================================
-- TABLES
-- ============================================================

-- === PROFILES (extends auth.users) ===
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    full_name   TEXT NOT NULL,
    phone       TEXT,
    role        user_role NOT NULL DEFAULT 'patient',
    birth_date  DATE,
    gender      TEXT CHECK (gender IN ('male', 'female', 'other')),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- === PATIENTS (len pre rolu patient) ===
CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    birth_number    TEXT,
    insurance_code  TEXT,         -- kód poisťovne (VSZP, DÔVERA, UNION)
    referring_doctor TEXT,        -- meno obvodného lekára
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === STAFF (doktori, fyzio, tréneri) — extra info ===
CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specialization  TEXT,         -- napr. "ortopédia", "športová rehabilitácia"
    license_number  TEXT,         -- číslo licencie (pre lekárov/fyzio)
    work_hours      JSONB,        -- {"monday": {"start": "08:00", "end": "16:00"}, ...}
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === MEDICAL RECORDS (anamnéza) ===
CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES staff(id),
    record_type     TEXT NOT NULL, -- 'history', 'allergies', 'medication', 'surgery', 'note'
    description     TEXT NOT NULL,
    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === DIAGNOSES ===
CREATE TABLE diagnoses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES staff(id),
    icd10_code      TEXT NOT NULL,  -- M54.5, S83.6, atď.
    description     TEXT NOT NULL,
    notes           TEXT,
    diagnosed_at    DATE NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === RESTRICTIONS (obmedzenia pre trénerov — bez diagnózy) ===
CREATE TABLE restrictions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    set_by          UUID NOT NULL REFERENCES staff(id),       -- doktor alebo fyzio
    category        TEXT NOT NULL CHECK (category IN ('spine', 'knee', 'hip', 'shoulder', 'elbow', 'wrist', 'ankle', 'general', 'cardio', 'other')),
    restriction     TEXT NOT NULL,   -- "Nezaraďovať drepy, maximálna flexia kolena 90°"
    severity        INTEGER CHECK (severity BETWEEN 1 AND 5),
    is_active       BOOLEAN DEFAULT TRUE,
    valid_from      DATE DEFAULT CURRENT_DATE,
    valid_until     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === APPOINTMENTS ===
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    staff_id        UUID NOT NULL REFERENCES staff(id),
    appointment_type appointment_type NOT NULL,
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME NOT NULL,
    duration_min    INTEGER DEFAULT 60,
    status          appointment_status DEFAULT 'pending',
    notes           TEXT,
    cancelled_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === EXERCISE LIBRARY (jednotný katalóg cvikov) ===
CREATE TABLE exercise_library (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    muscle_group    TEXT[],         -- array svalových skupín
    exercise_type   exercise_type NOT NULL,
    video_url       TEXT,
    image_url       TEXT,
    instructions    TEXT,           -- ako správne vykonať
    contraindications TEXT,         -- kontraindikácie
    is_public       BOOLEAN DEFAULT TRUE,
    created_by      UUID REFERENCES staff(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === PHYSIOTHERAPY PLANS ===
CREATE TABLE physio_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    physio_id       UUID NOT NULL REFERENCES staff(id),
    diagnosis_id    UUID REFERENCES diagnoses(id),
    goal            TEXT NOT NULL,
    notes           TEXT,
    frequency       TEXT,           -- "3x týždenne"
    duration_weeks  INTEGER,
    status          plan_status DEFAULT 'active',
    start_date      DATE DEFAULT CURRENT_DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === PHYSIOTHERAPY EXERCISES (denník fyzio) ===
CREATE TABLE physio_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES physio_plans(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercise_library(id),
    sets            INTEGER,
    reps            INTEGER,
    hold_seconds    INTEGER,        -- výdrž v sekundách
    resistance      TEXT,           -- "thera band", "1kg"
    note            TEXT,
    order_index     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === PHYSIOTHERAPY LOGS (záznam z cvičenia pacienta) ===
CREATE TABLE physio_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES physio_plans(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercise_library(id),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    performed_at    DATE DEFAULT CURRENT_DATE,
    sets_done       INTEGER,
    reps_done       INTEGER,
    pain_level      INTEGER CHECK (pain_level BETWEEN 0 AND 10),
    difficulty      INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    patient_note    TEXT,
    completed       BOOLEAN DEFAULT TRUE,
    photo_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === TRAINING PLANS ===
CREATE TABLE training_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    trainer_id      UUID NOT NULL REFERENCES staff(id),
    goal            TEXT NOT NULL,
    notes           TEXT,
    frequency       TEXT,
    status          plan_status DEFAULT 'active',
    start_date      DATE DEFAULT CURRENT_DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === TRAINING LOGS (denník trénera) ===
CREATE TABLE training_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercise_library(id),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    performed_at    DATE DEFAULT CURRENT_DATE,
    set_number      INTEGER NOT NULL,
    reps            INTEGER,
    weight_kg       DECIMAL(6,2),
    rpe             INTEGER CHECK (rpe BETWEEN 1 AND 10),
    distance_m      INTEGER,        -- pre kardio
    duration_sec    INTEGER,        -- pre kardio
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === DIAGNOSTIC QUESTIONS (vopred pripravené, dodáva klient) ===
CREATE TABLE diagnostic_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category        TEXT NOT NULL,   -- 'initial', 'movement', 'pain', 'lifestyle', 'goals'
    question_text   TEXT NOT NULL,
    question_type   question_type NOT NULL DEFAULT 'text',
    choices         JSONB,          -- pre 'choice': ["áno", "nie", "niekedy"]
    step_order      INTEGER NOT NULL,
    is_health       BOOLEAN DEFAULT FALSE,  -- ak TRUE → vyžaduje Čl. 9 súhlas
    required        BOOLEAN DEFAULT TRUE,
    helper_text     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === DIAGNOSTIC RESULTS (odpovede pacienta) ===
CREATE TABLE diagnostic_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    answers         JSONB NOT NULL,   -- [{"question_id": "...", "answer": "..."}, ...]
    summary         TEXT,             -- automaticky generovaný sumár
    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- === CONSENT LOGS (audit trail všetkých súhlasov) ===
CREATE TABLE consent_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type    consent_type NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'updated')),
    document_version TEXT NOT NULL,   -- "v1.0", "v1.1"
    ip_address      TEXT NOT NULL,
    user_agent      TEXT,
    signed_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ
);

-- === DOCUMENTS (Storage bucket metadata) ===
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type   TEXT NOT NULL CHECK (document_type IN ('consent_pdf', 'medical_report', 'photo', 'diagnostic_report', 'other')),
    file_name       TEXT NOT NULL,
    file_size       INTEGER,
    mime_type       TEXT,
    storage_path    TEXT NOT NULL,
    uploaded_by     UUID REFERENCES staff(id),
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_active ON diagnoses(is_active);
CREATE INDEX idx_restrictions_patient ON restrictions(patient_id);
CREATE INDEX idx_restrictions_active ON restrictions(is_active);
CREATE INDEX idx_physio_logs_patient ON physio_logs(patient_id);
CREATE INDEX idx_training_logs_patient ON training_logs(patient_id);
CREATE INDEX idx_training_logs_date ON training_logs(performed_at);
CREATE INDEX idx_consent_logs_profile ON consent_logs(profile_id);
CREATE INDEX idx_diagnostic_results_patient ON diagnostic_results(patient_id);
CREATE INDEX idx_documents_patient ON documents(patient_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE physio_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE physio_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE physio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- === HELPERS ===
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role
LANGUAGE SQL STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
    SELECT role IN ('admin', 'doctor', 'physio', 'trainer') FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth.is_my_patient(patient_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.patient_id = auth.is_my_patient.patient_id
        AND a.staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
    );
$$;

-- === PROFILES ===
CREATE POLICY "profil vidí každý sám seba"
    ON profiles FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "admin vidí všetky profily"
    ON profiles FOR SELECT
    USING (auth.user_role() = 'admin');

CREATE POLICY "doctor vidí profily svojich pacientov"
    ON profiles FOR SELECT
    USING (
        auth.user_role() = 'doctor'
        AND id IN (
            SELECT p.profile_id FROM patients p
            JOIN appointments a ON a.patient_id = p.id
            WHERE a.staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

CREATE POLICY "staff vidí profily podla priradenia"
    ON profiles FOR SELECT
    USING (
        auth.is_staff()
        AND id IN (
            SELECT p.profile_id FROM patients p
            JOIN appointments a ON a.patient_id = p.id
            WHERE a.staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

-- === PATIENTS ===
CREATE POLICY "pacient vidí svoj záznam"
    ON patients FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "admin doctor physio vidia všetkých pacientov"
    ON patients FOR SELECT
    USING (auth.user_role() IN ('admin', 'doctor', 'physio'));

CREATE POLICY "tréner vidí len svojich pacientov"
    ON patients FOR SELECT
    USING (
        auth.user_role() = 'trainer'
        AND id IN (
            SELECT patient_id FROM appointments
            WHERE staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

-- === DIAGNOSES ===
CREATE POLICY "pacient vidí svoje diagnózy"
    ON diagnoses FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "doktor zapisuje a číta svoje diagnózy"
    ON diagnoses FOR ALL
    USING (doctor_id = (SELECT id FROM staff WHERE profile_id = auth.uid()))
    WITH CHECK (doctor_id = (SELECT id FROM staff WHERE profile_id = auth.uid()));

CREATE POLICY "admin vidí všetky diagnózy"
    ON diagnoses FOR SELECT
    USING (auth.user_role() = 'admin');

CREATE POLICY "fyzio číta diagnózy svojich pacientov"
    ON diagnoses FOR SELECT
    USING (
        auth.user_role() = 'physio'
        AND patient_id IN (
            SELECT patient_id FROM physio_plans
            WHERE physio_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

-- === RESTRICTIONS (tréner vidí len obmedzenia, nie diagnózy) ===
CREATE POLICY "všetci staff čítajú obmedzenia svojich pacientov"
    ON restrictions FOR SELECT
    USING (
        auth.is_staff()
        AND patient_id IN (
            SELECT patient_id FROM appointments
            WHERE staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

CREATE POLICY "pacient vidí svoje obmedzenia"
    ON restrictions FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "doktor a fyzio zapisujú obmedzenia"
    ON restrictions FOR ALL
    USING (set_by = (SELECT id FROM staff WHERE profile_id = auth.uid()))
    WITH CHECK (set_by = (SELECT id FROM staff WHERE profile_id = auth.uid()));

-- === APPOINTMENTS ===
CREATE POLICY "pacient vidí svoje rezervácie"
    ON appointments FOR ALL
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()))
    WITH CHECK (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "staff vidí rezervácie u seba"
    ON appointments FOR ALL
    USING (staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid()))
    WITH CHECK (staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid()));

CREATE POLICY "admin vidí všetky rezervácie"
    ON appointments FOR ALL
    USING (auth.user_role() = 'admin')
    WITH CHECK (auth.user_role() = 'admin');

-- === EXERCISE LIBRARY ===
CREATE POLICY "všetci vidia verejné cviky"
    ON exercise_library FOR SELECT
    USING (is_public = TRUE OR created_by = (SELECT id FROM staff WHERE profile_id = auth.uid()));

CREATE POLICY "staff vytvára cviky"
    ON exercise_library FOR INSERT
    WITH CHECK (auth.is_staff());

-- === PHYSIO PLANS ===
CREATE POLICY "fyzio spravuje svoje plány"
    ON physio_plans FOR ALL
    USING (physio_id = (SELECT id FROM staff WHERE profile_id = auth.uid()))
    WITH CHECK (physio_id = (SELECT id FROM staff WHERE profile_id = auth.uid()));

CREATE POLICY "pacient vidí svoje plány"
    ON physio_plans FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "admin vidí všetky plány"
    ON physio_plans FOR SELECT
    USING (auth.user_role() = 'admin');

-- === PHYSIO LOGS ===
CREATE POLICY "fyzio vidí logy svojich plánov"
    ON physio_logs FOR ALL
    USING (plan_id IN (SELECT id FROM physio_plans WHERE physio_id = (SELECT id FROM staff WHERE profile_id = auth.uid())))
    WITH CHECK (plan_id IN (SELECT id FROM physio_plans WHERE physio_id = (SELECT id FROM staff WHERE profile_id = auth.uid())));

CREATE POLICY "pacient zapisuje svoje logy"
    ON physio_logs FOR INSERT
    WITH CHECK (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "pacient číta svoje logy"
    ON physio_logs FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- === TRAINING LOGS ===
CREATE POLICY "tréner spravuje logy svojich plánov"
    ON training_logs FOR ALL
    USING (plan_id IN (SELECT id FROM training_plans WHERE trainer_id = (SELECT id FROM staff WHERE profile_id = auth.uid())))
    WITH CHECK (plan_id IN (SELECT id FROM training_plans WHERE trainer_id = (SELECT id FROM staff WHERE profile_id = auth.uid())));

CREATE POLICY "pacient číta svoje logy"
    ON training_logs FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- === DIAGNOSTIC QUESTIONS ===
CREATE POLICY "všetci vidia otázky"
    ON diagnostic_questions FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "admin spravuje otázky"
    ON diagnostic_questions FOR ALL
    USING (auth.user_role() = 'admin')
    WITH CHECK (auth.user_role() = 'admin');

-- === DIAGNOSTIC RESULTS ===
CREATE POLICY "pacient vidí svoje výsledky"
    ON diagnostic_results FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "pacient vytvára svoje výsledky"
    ON diagnostic_results FOR INSERT
    WITH CHECK (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "staff vidí výsledky svojich pacientov"
    ON diagnostic_results FOR SELECT
    USING (
        auth.is_staff()
        AND patient_id IN (
            SELECT patient_id FROM appointments
            WHERE staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

-- === CONSENT LOGS ===
CREATE POLICY "pacient vidí len svoje súhlasy"
    ON consent_logs FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "admin vidí všetky súhlasy"
    ON consent_logs FOR SELECT
    USING (auth.user_role() = 'admin');

-- === DOCUMENTS ===
CREATE POLICY "pacient vidí svoje dokumenty"
    ON documents FOR SELECT
    USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

CREATE POLICY "staff nahráva a vidí dokumenty svojich pacientov"
    ON documents FOR ALL
    USING (
        auth.is_staff()
        AND patient_id IN (
            SELECT patient_id FROM appointments
            WHERE staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    )
    WITH CHECK (
        auth.is_staff()
        AND patient_id IN (
            SELECT patient_id FROM appointments
            WHERE staff_id = (SELECT id FROM staff WHERE profile_id = auth.uid())
        )
    );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('patient_documents', 'patient_documents', FALSE),
    ('consent_pdfs', 'consent_pdfs', FALSE),
    ('exercise_photos', 'exercise_photos', TRUE),
    ('profile_avatars', 'profile_avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA: Základné cvičenia
-- ============================================================
INSERT INTO exercise_library (name, description, muscle_group, exercise_type, instructions) VALUES
('Drep s vlastnou váhou', 'Základný drep bez záťaže, chodidlá na šírku ramien', ARRAY['stehná', 'gluteusy', 'core'], 'strength', 'Postavte sa rovno, chodidlá na šírku ramien. Pomaly pokrčte kolená, akoby ste si sadali na stoličku. Vráťte sa do stoja.'),
('Mostík', 'Ležmo na chrbte, pokrčené kolená, zdvíhanie panvy', ARRAY['gluteusy', 'spodný chrbát', 'hamstringy'], 'rehab', 'Ľahnite si na chrbát, pokrčte kolená, chodidlá na zemi. Zdvihnite panvu čo najvyššie, vydržte 2 sekundy a pomaly spustite.'),
('Plank', 'Podpor na predlaktiach, rovné telo', ARRAY['core', 'ramená', 'chrbát'], 'rehab', 'Položte sa na brucho, zdvihnite sa na predlaktia a špičky. Telo musí byť rovné ako doska. Vydržte čo najdlhšie.'),
('Rotácia trupu s gumou', 'Stoj, guma uchytená vo výške pásu, rotácia trupu', ARRAY['core', 'šikmé brušné', 'chrbát'], 'mobility', 'Uchopte gumu oboma rukami, stojte bokom k úchytu. Pomaly rotujte trupom od úchytu.'),
('Výpad vpred', 'Výpad jednou nohou vpred, obe kolená ohnuté', ARRAY['stehná', 'gluteusy', 'hamstringy'], 'strength', 'Urobte dlhý krok vpred, obe kolená ohnite do 90°. Predné koleno nepresahuje špičku.'),
('Korčuliar', 'Bočné výskoky z nohy na nohu', ARRAY['stehná', 'gluteusy', 'kardiovaskulárny'], 'cardio', 'Skáčte z nohy na nohu do strany, ruky pracujú proti pohybu.'),
('Stahovanie lopatiek', 'V ľahu na bruchu, ruky pozdĺž tela, stiahnuť lopatky k sebe', ARRAY['horný chrbát', 'ramená'], 'rehab', 'Ľahnite si na brucho, čelo na zemi, ruky pozdĺž tela. Pomaly stiahnite lopatky k sebe a vydržte 5 sekúnd.'),
('Hlboký drep s oporou', 'Drep s oporou o stenu alebo TRX', ARRAY['stehná', 'gluteusy', 'core'], 'rehab', 'Postavte sa chrbtom k stene, chodidlá meter od steny. Kĺžte sa po stene dolu do drepu.');

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Získať aktívne obmedzenia pacienta pre trénera
CREATE OR REPLACE FUNCTION get_patient_restrictions(p_patient_id UUID)
RETURNS TABLE (
    id UUID,
    category TEXT,
    restriction TEXT,
    severity INTEGER
)
LANGUAGE SQL STABLE
AS $$
    SELECT r.id, r.category, r.restriction, r.severity
    FROM restrictions r
    WHERE r.patient_id = p_patient_id
    AND r.is_active = TRUE
    AND (r.valid_until IS NULL OR r.valid_until >= CURRENT_DATE)
    ORDER BY r.severity DESC;
$$;

-- Získať progress pacienta za posledných N dní
CREATE OR REPLACE FUNCTION get_patient_progress(p_patient_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    exercise_count BIGINT,
    avg_pain NUMERIC,
    total_weight_kg NUMERIC
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        performed_at AS date,
        COUNT(*) AS exercise_count,
        AVG(pain_level) AS avg_pain,
        SUM(weight_kg * reps * set_number) AS total_weight_kg
    FROM (
        SELECT performed_at, NULL::INTEGER AS pain_level, weight_kg, reps, set_number FROM training_logs WHERE patient_id = p_patient_id
        UNION ALL
        SELECT performed_at, pain_level::INTEGER, NULL::NUMERIC, reps_do_ne, sets_done FROM physio_logs WHERE patient_id = p_patient_id
    ) combined
    WHERE performed_at >= CURRENT_DATE - p_days
    GROUP BY performed_at
    ORDER BY performed_at DESC;
$$;

-- Zalogovať súhlas
CREATE OR REPLACE FUNCTION log_consent(
    p_profile_id UUID,
    p_consent_type consent_type,
    p_action TEXT,
    p_document_version TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO consent_logs (profile_id, consent_type, action, document_version, ip_address, user_agent)
    VALUES (p_profile_id, p_consent_type, p_action, p_document_version, p_ip_address, p_user_agent)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto-create patient record when profile with role 'patient' is created
CREATE OR REPLACE FUNCTION auto_create_patient()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'patient' THEN
        INSERT INTO patients (profile_id) VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    ELSIF NEW.role IN ('doctor', 'physio', 'trainer') THEN
        INSERT INTO staff (profile_id) VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION auto_create_patient();