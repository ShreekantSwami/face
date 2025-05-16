'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { UsersRound, Users, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function AdminDashboardPage() {
  const { user } = useAuthRedirect({ requiredRole: 'admin' });
  const teachers = useAuthStore(state => state.users.filter(u => u.role === 'teacher'));
  const students = useDataStore(state => state.students);
  const attendanceRecords = useDataStore(state => state.attendanceRecords);

  if (!user) return null; // Handled by useAuthRedirect

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}!</CardTitle>
          <CardDescription>This is your AttendaTrack Admin Dashboard. Manage teachers, view overall statistics, and generate reports.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UsersRound className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <Link href="/admin/teachers" passHref>
              <Button variant="link" className="px-0 text-sm text-accent hover:text-accent/90">
                Manage Teachers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
            <CheckSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRecords.length}</div>
            <Link href="/admin/reports" passHref>
               <Button variant="link" className="px-0 text-sm text-accent hover:text-accent/90">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for more stats or quick actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/admin/teachers" passHref><Button variant="outline">Add New Teacher</Button></Link>
          <Link href="/admin/reports" passHref><Button>View System Reports</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
