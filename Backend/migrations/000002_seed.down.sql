-- Remove seed data (in reverse order of dependencies)

-- Remove users
DELETE FROM users WHERE username IN ('admin', 'zhangming', 'lihua', 'wangqiang', 'chenjing', 'zhangsan', 'lisi', 'wangwu', 'zhaoliu');

-- Remove grades
DELETE FROM grades;

-- Remove enrollments
DELETE FROM enrollments;

-- Remove terms
DELETE FROM terms;

-- Remove students
DELETE FROM students;

-- Remove courses
DELETE FROM courses;

-- Remove staff
DELETE FROM staff;

-- Remove departments
DELETE FROM departments;
