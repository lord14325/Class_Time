
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student'))
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL,
  room_name VARCHAR(100),
  capacity INTEGER NOT NULL DEFAULT 0,
  room_type VARCHAR(50) DEFAULT 'classroom',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT rooms_room_number_key UNIQUE (room_number)
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  description TEXT,
  subject VARCHAR(50),
  grade_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT courses_course_code_key UNIQUE (course_code)
);

CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  employee_id VARCHAR(50),
  phone VARCHAR(20),
  subject VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subjects TEXT[],

  CONSTRAINT teachers_employee_id_key UNIQUE (employee_id),
  CONSTRAINT teachers_user_id_key UNIQUE (user_id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  student_id VARCHAR(50) NOT NULL,
  grade_level VARCHAR(20),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  phone VARCHAR(20),
  address TEXT,
  room_id INTEGER,
  section VARCHAR(10),

  CONSTRAINT students_student_id_key UNIQUE (student_id),
  CONSTRAINT students_user_id_key UNIQUE (user_id),
  CONSTRAINT students_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all',
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT announcements_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT announcements_target_audience_check CHECK (target_audience IN ('all', 'students', 'teachers', 'parents'))
);

CREATE TABLE time_slots (
  id SERIAL PRIMARY KEY,
  slot_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT time_slots_slot_order_key UNIQUE (slot_order)
);

CREATE TABLE class_sections (
  id SERIAL PRIMARY KEY,
  grade_level VARCHAR(20) NOT NULL,
  section_name VARCHAR(10) NOT NULL,
  room_id INTEGER,
  student_capacity INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT class_sections_grade_level_section_name_key UNIQUE (grade_level, section_name),
  CONSTRAINT class_sections_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  semester_name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT semesters_semester_name_key UNIQUE (semester_name)
);

CREATE TABLE daily_schedules (
  id SERIAL PRIMARY KEY,
  class_section_id INTEGER NOT NULL,
  time_slot_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  room_id INTEGER,
  day_of_week INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  week_start_date DATE,
  semester VARCHAR(20) DEFAULT '2024-25',

  CONSTRAINT daily_schedules_unique_constraint UNIQUE (class_section_id, time_slot_id, day_of_week, week_start_date, semester),
  CONSTRAINT daily_schedules_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES class_sections(id),
  CONSTRAINT daily_schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT daily_schedules_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT daily_schedules_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT daily_schedules_time_slot_id_fkey FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
  CONSTRAINT daily_schedules_day_of_week_check CHECK (day_of_week IN (1, 2, 3, 4, 5, 6, 7))
);

CREATE INDEX idx_daily_schedules_week_semester ON daily_schedules (week_start_date, semester);

