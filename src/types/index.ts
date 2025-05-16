
export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedClass?: string; // For teachers
}

export interface Student {
  id: string;
  name: string;
  class: string; // e.g., "Standard 1"
  teacherId: string;
  registrationDate: string;
  photo1DataUri?: string; // Optional: Data URI for the first student photo
  photo2DataUri?: string; // Optional: Data URI for the second student photo
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  class: string;
  markedBy: string; // teacherId
}
