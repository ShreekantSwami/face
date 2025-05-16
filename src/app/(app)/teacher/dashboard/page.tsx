'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { Users, CheckSquare, ScanFace } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { format } from 'date-fns';

export default function TeacherDashboardPage() {
  const { user } = useAuthRedirect({ requiredRole: 'teacher' });
  
  const studentsInClass = useDataStore(state => 
    user && user.assignedClass ? state.getStudentsByClass(user.assignedClass) : []
  );
  const attendanceForToday = useDataStore(state => 
    user && user.assignedClass ? state.getAttendanceByClassAndDate(user.assignedClass, format(new Date(), 'yyyy-MM-dd')) : []
  );

  if (!user || !user.assignedClass) return null; // Should be handled by useAuthRedirect or role check

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}!</CardTitle>
          <CardDescription>This is your AttendaTrack Teacher Dashboard for {user.assignedClass}. Manage your students and take attendance.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students in {user.assignedClass}</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsInClass.length}</div>
            <Link href="/teacher/students" passHref>
              <Button variant="link" className="px-0 text-sm text-accent hover:text-accent/90">
                Manage Students
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CheckSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceForToday.filter(a=>a.status === 'present').length} / {studentsInClass.length} Present</div>
            <p className="text-xs text-muted-foreground">
              {attendanceForToday.length > 0 ? `Last taken: ${format(new Date(), 'p')}` : "Not taken yet"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">Take Attendance</CardTitle>
            <ScanFace className="h-5 w-5 text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/teacher/attendance" passHref>
              <Button variant="secondary" className="w-full">
                Start Facial Attendance
              </Button>
            </Link>
             <p className="text-xs text-primary-foreground/80 mt-2">Use facial recognition to mark today's attendance.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/teacher/students" passHref><Button variant="outline">Register New Student</Button></Link>
          <Link href="/teacher/reports" passHref><Button>View My Reports</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
