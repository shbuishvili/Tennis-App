-- 1. კორტების ცხრილი (Courts Table)
CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'Clay', -- Clay (თიხა) ან Hard (მყარი)
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active', -- 'active' (აქტიური) ან 'maintenance' (რემონტი)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4 საწყისი კორტის დამატება
INSERT INTO courts (name, type, is_active, status) VALUES 
('კორტი 1 (Clay)', 'Clay', true, 'active'),
('კორტი 2 (Hard)', 'Hard', true, 'active'),
('კორტი 3 (Clay)', 'Clay', true, 'active'),
('კორტი 4 (Hard)', 'Hard', true, 'active');

-- 2. მომხმარებელთა ანგარიშების ცხრილი (User Accounts Table)
CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- პაროლი (ტესტირებისთვის უბრალო ტექსტი, ან კლიენტის მხარეს ჰაშირებული)
  role VARCHAR(50) CHECK (role IN ('super_admin', 'manager', 'staff')) NOT NULL DEFAULT 'staff',
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- საწყისი მომხმარებლების დამატება
INSERT INTO user_accounts (username, password, role, full_name) VALUES
('admin', 'admin123', 'super_admin', 'სუპერ ადმინისტრატორი'),
('manager', 'manager123', 'manager', 'მთავარი მენეჯერი'),
('staff', 'staff123', 'staff', 'მორიგე ოპერატორი');

-- 3. ჯავშნების ცხრილი (Bookings Table)
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  court_id INT REFERENCES courts(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  rackets_status VARCHAR(50) CHECK (rackets_status IN ('included', 'excluded')),
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. მუშაობის განრიგის ცხრილი (Court Settings Table)
CREATE TABLE court_settings (
  id SERIAL PRIMARY KEY,
  day_type VARCHAR(50) UNIQUE, -- 'weekday', 'weekend', 'holiday'
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- განრიგის საწყისი მონაცემები
INSERT INTO court_settings (day_type, open_time, close_time, is_active) VALUES
('weekday', '08:00:00', '22:00:00', true),
('weekend', '09:00:00', '23:00:00', true),
('holiday', '10:00:00', '18:00:00', true);
