-- Seed a default user (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, business_name, role)
VALUES (
    'a55c2859-e93d-4c3e-8120-ef8005697693',
    'admin@ordinis.ai',
    '$2a$10$R9hGYgOC9v5.uU.m2e1I1u0E.aO6Z.oE7O2F3V7g2NlVw/cZcKKeS', -- bcrypt hash for 'password123'
    'Acme Business Solutions',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Seed mock leads
INSERT INTO leads (id, user_id, name, email, phone, company, status, score, qualification_details)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'a55c2859-e93d-4c3e-8120-ef8005697693',
    'Alice Smith',
    'alice@example.com',
    '+15550199',
    'Smith & Co Consulting',
    'qualified',
    85,
    '{"budget": "$10,000", "authority": "Decision Maker", "need": "Wants AI-powered lead capture workflow automation", "timeline": "Next 30 days"}'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    'a55c2859-e93d-4c3e-8120-ef8005697693',
    'Bob Johnson',
    'bob@example.com',
    '+15550288',
    'Johnson Logistics',
    'contacted',
    50,
    '{"budget": "$5,000", "authority": "Influencer", "need": "Requires document intelligence for shipping invoices", "timeline": "Next 60 days"}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    'a55c2859-e93d-4c3e-8120-ef8005697693',
    'Charlie Brown',
    'charlie@example.com',
    '+15550377',
    'Brown Dental Clinic',
    'new',
    10,
    '{}'::jsonb
) ON CONFLICT DO NOTHING;

-- Seed mock conversations
INSERT INTO conversations (id, lead_id, channel, last_message_at)
VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'email',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'whatsapp',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
) ON CONFLICT DO NOTHING;

-- Seed mock messages
INSERT INTO messages (conversation_id, direction, sender, content, is_read)
VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    'inbound',
    'alice@example.com',
    'Hi, I saw your product Ordinis AI and would love to know if it integrates with Supabase database.',
    true
),
(
    '44444444-4444-4444-4444-444444444444',
    'outbound',
    'admin@ordinis.ai',
    'Hello Alice! Yes, Ordinis AI uses Supabase directly for authentication and database services. Would you like to schedule a quick demo?',
    true
),
(
    '55555555-5555-5555-5555-555555555555',
    'inbound',
    '+15550288',
    'Hi, interested in pricing for processing invoices automatically.',
    false
) ON CONFLICT DO NOTHING;

-- Seed mock meetings
INSERT INTO meetings (lead_id, title, scheduled_at, duration_minutes, status)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Ordinis AI Demo - Smith & Co',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    30,
    'scheduled'
) ON CONFLICT DO NOTHING;
