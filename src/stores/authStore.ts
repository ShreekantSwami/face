import { create } from 'zustand';
import type { User, UserRole } from '@/types';

// Mock Users
const MOCK_USERS: User[] = [
  { id: 'admin001', email: 'admin@attendatrack.com', name: 'Admin User', role: 'admin' },
  { id: 'teacher001', email: 'teacher1@attendatrack.com', name: 'Alice Smith', role: 'teacher', assignedClass: 'Standard 1' },
  { id: 'teacher002', email: 'teacher2@attendatrack.com', name: 'Bob Johnson', role: 'teacher', assignedClass: 'Standard 2' },
];

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[]; // For admin to manage teachers
  login: (email: string, password?: string) => Promise<User | null>; // Password optional for mock
  logout: () => void;
  addTeacher: (teacher: Omit<User, 'id' | 'role'> & { password?: string, role?: UserRole }) => User;
  updateTeacher: (teacherId: string, updates: Partial<User>) => User | null;
  deleteTeacher: (teacherId: string) => void;
  getUserById: (userId: string) => User | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  users: MOCK_USERS,
  login: async (email, password) => {
    // In a real app, you'd hash the password and check against a DB
    // For mock, just find by email. Password is ignored.
    const foundUser = get().users.find(u => u.email === email);
    if (foundUser) {
      set({ user: foundUser, isAuthenticated: true });
      if (typeof window !== 'undefined') {
        localStorage.setItem('attendaTrackUser', JSON.stringify(foundUser));
      }
      return foundUser;
    }
    return null;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('attendaTrackUser');
    }
  },
  addTeacher: (teacherData) => {
    const newTeacher: User = {
      id: `teacher${Date.now()}`,
      email: teacherData.email,
      name: teacherData.name,
      role: 'teacher',
      assignedClass: teacherData.assignedClass,
    };
    set(state => ({ users: [...state.users, newTeacher] }));
    return newTeacher;
  },
  updateTeacher: (teacherId, updates) => {
    let updatedTeacher: User | null = null;
    set(state => ({
      users: state.users.map(u => {
        if (u.id === teacherId) {
          updatedTeacher = { ...u, ...updates };
          return updatedTeacher;
        }
        return u;
      }),
    }));
    return updatedTeacher;
  },
  deleteTeacher: (teacherId) => {
    set(state => ({ users: state.users.filter(u => u.id !== teacherId) }));
  },
  getUserById: (userId: string) => {
    return get().users.find(u => u.id === userId);
  },
  // Hydrate auth state from localStorage on initialization
  // This should be called once in a top-level component or layout
  // For simplicity, it's here but needs careful handling of server/client
}));

// Initial hydration attempt (run on client side)
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('attendaTrackUser');
  if (storedUser) {
    try {
      const user: User = JSON.parse(storedUser);
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch (e) {
      console.error("Failed to parse stored user:", e);
      localStorage.removeItem('attendaTrackUser');
    }
  }
}
