-- Seed reference data for the CivicIssue Management Platform.
-- Runs after V1 creates the schema. Idempotent static reference data.

INSERT INTO roles (name, description)
VALUES ('CITIZEN', 'Registered citizen who can report and track issues'),
       ('ADMIN',   'Administrator who manages issues, users and departments')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name, description, email, active, created_at, updated_at)
VALUES ('Roads & Infrastructure', 'Handles road repairs, potholes, and infrastructure maintenance', 'roads@civicissue.com', TRUE, NOW(), NOW()),
       ('Water Supply',           'Manages water supply and pipe-related issues',                  'water@civicissue.com', TRUE, NOW(), NOW()),
       ('Electricity',            'Handles power outages and electrical infrastructure',           'electricity@civicissue.com', TRUE, NOW(), NOW()),
       ('Sanitation',             'Manages waste disposal and cleanliness',                        'sanitation@civicissue.com', TRUE, NOW(), NOW()),
       ('Street Lighting',        'Handles street light repairs and maintenance',                  'lighting@civicissue.com', TRUE, NOW(), NOW()),
       ('Drainage',               'Manages drainage and sewage systems',                           'drainage@civicissue.com', TRUE, NOW(), NOW()),
       ('General',                'Handles miscellaneous civic issues',                            'general@civicissue.com', TRUE, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Map each issue category to its responsible department
INSERT INTO category_departments (category, department_id)
SELECT 'ROAD',        id FROM departments WHERE name = 'Roads & Infrastructure'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'WATER',       id FROM departments WHERE name = 'Water Supply'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'ELECTRICITY', id FROM departments WHERE name = 'Electricity'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'SANITATION',  id FROM departments WHERE name = 'Sanitation'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'STREETLIGHT', id FROM departments WHERE name = 'Street Lighting'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'DRAINAGE',    id FROM departments WHERE name = 'Drainage'
ON CONFLICT (category) DO NOTHING;
INSERT INTO category_departments (category, department_id)
SELECT 'OTHER',       id FROM departments WHERE name = 'General'
ON CONFLICT (category) DO NOTHING;
