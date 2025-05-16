'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { StudentForm } from '@/components/teacher/StudentForm';
import type { Student } from '@/types';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function ManageStudentsPage() {
  const { user } = useAuthRedirect({ requiredRole: 'teacher' });
  const { students, getStudentsByTeacher, deleteStudent } = useDataStore();
  const { toast } = useToast();
  
  const [refreshKey, setRefreshKey] = React.useState(0);
  const handleSuccess = () => setRefreshKey(prev => prev + 1);

  const teacherStudents = user ? getStudentsByTeacher(user.id) : [];

  if (!user) return null;

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    deleteStudent(studentId);
    toast({ title: "Student Deleted", description: `${studentName} has been removed from the class.`});
    handleSuccess();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Students - {user.assignedClass}</CardTitle>
            <CardDescription>Register new students and view current student list for your class.</CardDescription>
          </div>
          <StudentForm onSuccess={handleSuccess}/>
        </CardHeader>
        <CardContent>
          {teacherStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students registered in {user.assignedClass} yet.</p>
          ) : (
          <Table key={refreshKey}>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherStudents.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{format(new Date(student.registrationDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    {/* Editing student details is not implemented in StudentForm for this MVP */}
                    {/* <StudentForm student={student} onSuccess={handleSuccess} /> */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove {student.name} from your class.
                            Associated attendance records will remain but may become orphaned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
