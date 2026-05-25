-- Demo seed data (run after 001_operational_schema.sql and creating auth users in Supabase Auth)
-- Update profile roles via Dashboard or:
--   update public.profiles set role = 'admin', full_name = 'Priya Menon' where email = 'admin@school.com';

insert into public.hostel_rooms (block, room_no, capacity, occupied, student_ids, status) values
  ('A', '101', 4, 3, '{}', 'available'),
  ('A', '102', 4, 4, '{}', 'full'),
  ('B', '201', 3, 2, '{}', 'available'),
  ('B', '202', 3, 0, '{}', 'maintenance')
on conflict (block, room_no) do nothing;

insert into public.hostel_complaints (student_name, room, category, description, status) values
  ('Aarav Sharma', 'A-101', 'Plumbing', 'Bathroom tap leaking continuously', 'open'),
  ('Rohan Verma', 'A-101', 'Electrical', 'Fan not working properly', 'in-progress');

insert into public.hostel_visitors (visitor_name, student_name, room, purpose, check_in, check_out, status) values
  ('Mr. Rajesh Sharma', 'Aarav Sharma', 'A-101', 'Parent visit', '2025-05-14 10:00+00', '2025-05-14 12:30+00', 'checked-out'),
  ('Mrs. Neha Patel', 'Diya Patel', 'A-102', 'Birthday celebration', '2025-05-14 14:00+00', null, 'checked-in');

insert into public.transport_routes (route_no, driver_name, driver_phone, bus_no, capacity, student_count, stops, current_lat, current_lng) values
  ('Route 1', 'Suresh Kumar', '+91 98765 43210', 'MH-12-GQ-4432', 45, 38,
   '[{"name":"Gate","time":"07:00","lat":19.076,"lng":72.877}]'::jsonb, 19.076, 72.877),
  ('Route 2', 'Manoj Patil', '+91 98765 43211', 'MH-12-HQ-9988', 40, 32,
   '[]'::jsonb, 19.082, 72.881)
on conflict (route_no) do nothing;

insert into public.fee_categories (name, amount, frequency, description) values
  ('Tuition Fee', 45000, 'Annual', 'Core academic tuition'),
  ('Hostel Fee', 36000, 'Annual', 'Boarding and lodging'),
  ('Library Fee', 2400, 'Annual', 'Library access and resources'),
  ('Transport Fee', 18000, 'Annual', 'School bus service')
on conflict (name) do nothing;

insert into public.fee_records (student_name, grade, category, amount, paid, due, due_date, status) values
  ('Aarav Sharma', '10', 'Tuition', 45000, 30000, 15000, '2025-06-30', 'partial'),
  ('Diya Patel', '10', 'Tuition', 45000, 45000, 0, '2025-06-30', 'paid');

insert into public.library_books (title, author, isbn, category, total_copies, available_copies, shelf) values
  ('Calculus: Early Transcendentals', 'James Stewart', '978-1285741550', 'Mathematics', 10, 6, 'M-01'),
  ('Concepts of Physics Vol. 1', 'H.C. Verma', '978-8177091878', 'Physics', 15, 8, 'P-01'),
  ('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Literature', 12, 9, 'L-01');

insert into public.attendance_logs (session_date, grade, section, student_id, student_name, status, marked_by_name) values
  ('2025-05-14', '10', 'A', 'a10e8400-e29b-41d4-a716-446655440001', 'Aarav Sharma', 'present', 'Anita Iyer'),
  ('2025-05-14', '10', 'A', 'a10e8400-e29b-41d4-a716-446655440002', 'Diya Patel', 'present', 'Anita Iyer'),
  ('2025-05-14', '10', 'A', 'a10e8400-e29b-41d4-a716-446655440003', 'Rohan Verma', 'absent', 'Anita Iyer')
on conflict (session_date, grade, section, student_id) do nothing;

insert into public.academic_grades (student_id, student_name, subject, grade, section, score, term) values
  ('a10e8400-e29b-41d4-a716-446655440001', 'Aarav Sharma', 'Mathematics', '10', 'A', 88, 'Term 1'),
  ('a10e8400-e29b-41d4-a716-446655440001', 'Aarav Sharma', 'Physics', '10', 'A', 82, 'Term 1'),
  ('a10e8400-e29b-41d4-a716-446655440002', 'Diya Patel', 'Mathematics', '10', 'A', 94, 'Term 1');
