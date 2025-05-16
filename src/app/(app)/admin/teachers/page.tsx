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
import { useAuthStore } from '@/stores/authStore';
import { TeacherForm } from '@/components/admin/TeacherForm';
import type { User } from '@/types';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function ManageTeachersPage() {
  useAuthRedirect({ requiredRole: 'admin' });
  const { users, deleteTeacher } = useAuthStore();
  const teachers = users.filter(u => u.role === 'teacher');
  const { toast } = useToast();
  
  // State to force re-render after add/edit/delete
  const [refreshKey, setRefreshKey] = React.useState(0);
  const handleSuccess = () => setRefreshKey(prev => prev + 1);

  const handleDeleteTeacher = (teacherId: string, teacherName: string) => {
    deleteTeacher(teacherId);
    toast({ title: "Teacher Deleted", description: `${teacherName} has been removed.`});
    handleSuccess();
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Teacher Accounts</CardTitle>
            <CardDescription>Create, view, and manage teacher profiles and their assigned classes.</CardDescription>
          </div>
          <TeacherForm onSuccess={handleSuccess} />
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teachers found. Add a new teacher to get started.</p>
          ) : (
          <Table key={refreshKey}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher: User) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.assignedClass || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <TeacherForm teacher={teacher} onSuccess={handleSuccess}>
                           {/* This will be wrapped by DialogTrigger in TeacherForm */}
                        </TeacherForm>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm text-destructive hover:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the teacher account
                                for {teacher.name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
