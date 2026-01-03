-- EduMgr initial schema (aligned with PRD.md + ARCHITECTURE.md)

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  dept_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  student_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  entry_score NUMERIC(6,2),
  dept_id BIGINT NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'in_school'
);

CREATE TABLE IF NOT EXISTS students_history (
  id BIGSERIAL PRIMARY KEY,
  student_no TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  entry_score NUMERIC(6,2),
  dept_id BIGINT NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archive_reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id BIGSERIAL PRIMARY KEY,
  staff_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  birth_month TEXT NOT NULL DEFAULT '',
  dept_id BIGINT NOT NULL REFERENCES departments(id),
  title TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  teaching_direction TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  course_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  teacher_id BIGINT NOT NULL REFERENCES staff(id),
  hours INT NOT NULL DEFAULT 0,
  credits INT NOT NULL DEFAULT 0,
  class_time TEXT NOT NULL DEFAULT '',
  class_location TEXT NOT NULL DEFAULT '',
  exam_time TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS terms (
  id BIGSERIAL PRIMARY KEY,
  term_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id),
  course_id BIGINT NOT NULL REFERENCES courses(id),
  term_id BIGINT NOT NULL REFERENCES terms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS grades (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id),
  course_id BIGINT NOT NULL REFERENCES courses(id),
  usual_score NUMERIC(5,2),
  exam_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id),
  CONSTRAINT grades_usual_score_range CHECK (usual_score IS NULL OR (usual_score >= 0 AND usual_score <= 100)),
  CONSTRAINT grades_exam_score_range CHECK (exam_score IS NULL OR (exam_score >= 0 AND exam_score <= 100)),
  CONSTRAINT grades_final_score_range CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 100))
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  student_id BIGINT REFERENCES students(id),
  staff_id BIGINT REFERENCES staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_dept_id ON students(dept_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept_id ON staff(dept_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_term_id ON enrollments(term_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON grades(course_id);

