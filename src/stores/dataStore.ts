
import { create } from 'zustand';
import type { Student, AttendanceRecord } from '@/types';
import { format } from 'date-fns';

// Mock Initial Data
const MOCK_STUDENTS: Student[] = [
  { id: 'student001', name: 'John Doe', class: 'Standard 1', teacherId: 'teacher001', registrationDate: format(new Date(), 'yyyy-MM-dd') },
  { id: 'student002', name: 'Jane Smith', class: 'Standard 1', teacherId: 'teacher001', registrationDate: format(new Date(), 'yyyy-MM-dd') },
  { id: 'student003', name: 'Peter Pan', class: 'Standard 2', teacherId: 'teacher002', registrationDate: format(new Date(), 'yyyy-MM-dd') },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att001', studentId: 'student001', studentName: 'John Doe', date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), status: 'present', class: 'Standard 1', markedBy: 'teacher001' },
  { id: 'att002', studentId: 'student002', studentName: 'Jane Smith', date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), status: 'absent', class: 'Standard 1', markedBy: 'teacher001' },
];

interface DataState {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  addStudent: (studentData: Omit<Student, 'id' | 'registrationDate'> & { photo1DataUri?: string; photo2DataUri?: string }) => Student;
  getStudentsByClass: (className: string) => Student[];
  getStudentsByTeacher: (teacherId: string) => Student[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => AttendanceRecord;
  addMultipleAttendanceRecords: (records: Omit<AttendanceRecord, 'id'>[]) => AttendanceRecord[];
  getAttendanceByClassAndDate: (className: string, date: string) => AttendanceRecord[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
  deleteStudent: (studentId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  students: MOCK_STUDENTS,
  attendanceRecords: MOCK_ATTENDANCE,
  addStudent: (studentData) => {
    const newStudent: Student = {
      name: studentData.name,
      class: studentData.class,
      teacherId: studentData.teacherId,
      photo1DataUri: studentData.photo1DataUri,
      photo2DataUri: studentData.photo2DataUri,
      id: `student${Date.now()}`,
      registrationDate: format(new Date(), 'yyyy-MM-dd'),
    };
    set(state => ({ students: [...state.students, newStudent] }));
    return newStudent;
  },
  getStudentsByClass: (className) => {
    return get().students.filter(s => s.class === className);
  },
  getStudentsByTeacher: (teacherId) => {
    return get().students.filter(s => s.teacherId === teacherId);
  },
  addAttendanceRecord: (recordData) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att${Date.now()}`,
    };
    set(state => ({ attendanceRecords: [newRecord, ...state.attendanceRecords] }));
    return newRecord;
  },
  addMultipleAttendanceRecords: (recordsData) => {
    const newRecords = recordsData.map((recordData, index) => ({
        ...recordData,
        id: `att${Date.now()}${index}`,
    }));
    set(state => ({ attendanceRecords: [...newRecords, ...state.attendanceRecords] }));
    return newRecords;
  },
  getAttendanceByClassAndDate: (className, date) => {
    return get().attendanceRecords.filter(ar => ar.class === className && ar.date === date);
  },
  getAttendanceByStudent: (studentId) => {
    return get().attendanceRecords.filter(ar => ar.studentId === studentId);
  },
  deleteStudent: (studentId: string) => {
    set(state => ({
      students: state.students.filter(s => s.id !== studentId),
      // Optionally, also delete related attendance records
      // attendanceRecords: state.attendanceRecords.filter(ar => ar.studentId !== studentId),
    }));
  },
}));

// Initial hydration attempt (run on client side) for data store
if (typeof window !== 'undefined') {
  // For mock data, we usually start with predefined MOCK_STUDENTS and MOCK_ATTENDANCE.
  // If you wanted to persist this to localStorage too (not typical for mock data):
  /*
  const storedStudents = localStorage.getItem('attendaTrackStudents');
  if (storedStudents) {
    try {
      useDataStore.setState({ students: JSON.parse(storedStudents) });
    } catch (e) { console.error("Failed to parse stored students:", e); }
  }
  const storedAttendance = localStorage.getItem('attendaTrackAttendance');
  if (storedAttendance) {
    try {
      useDataStore.setState({ attendanceRecords: JSON.parse(storedAttendance) });
    } catch (e) { console.error("Failed to parse stored attendance:", e); }
  }

  // Persist changes to localStorage (example, can be performance intensive for large data)
  useDataStore.subscribe(
    (state) => {
      localStorage.setItem('attendaTrackStudents', JSON.stringify(state.students));
      localStorage.setItem('attendaTrackAttendance', JSON.stringify(state.attendanceRecords));
    }
  );
  */
}
