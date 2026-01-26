-- Insert Arsenal Users
-- Run this script on PostgreSQL database
-- Password is a random bcrypt hash (users will login via Microsoft, not password)

INSERT INTO users (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES
  (
    gen_random_uuid(),
    'm_aviesena_rabbani_x@telkomsel.co.id',
    'M Aviesena Rabbani X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'muhammad_e_arnanda_x@telkomsel.co.id',
    'Muhammad E Arnanda X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'rivaldi_y_nainggolan_x@telkomsel.co.id',
    'Rivaldi Y Nainggolan X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'rizki_f_nugroho_x@telkomsel.co.id',
    'Rizki F Nugroho X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'gusti_md_abdillahs_x@telkomsel.co.id',
    'Gusti MD Abdillahs X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'a_mochammad_rachman_x@telkomsel.co.id',
    'A Mochammad Rachman X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'denisse_ananda_x@telkomsel.co.id',
    'Denisse Ananda X',
    '$2a$10$randomhashforAzureUsersOnly1234567890abcdefghij',
    'VIEWER',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Verify inserted users
SELECT id, email, name, role, "isActive" FROM users WHERE email LIKE '%@telkomsel.co.id';
