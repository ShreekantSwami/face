'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';
import { AVAILABLE_CLASSES } from '@/lib/constants';
import { Loader2, PlusCircle, Edit } from 'lucide-react';

const teacherFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  assignedClass: z.string().min(1, { message: 'Please assign a class.' }),
  password: z.string().optional(), // Optional for edit, mock: no strong validation
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  teacher?: User; // For editing
  onSuccess?: () => void;
}

export function TeacherForm({ teacher, onSuccess }: TeacherFormProps) {
  const { addTeacher, updateTeacher } = useAuthStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: teacher?.name || '',
      email: teacher?.email || '',
      assignedClass: teacher?.assignedClass || '',
      password: '',
    },
  });
  
  React.useEffect(() => {
    if (teacher) {
      form.reset({
        name: teacher.name,
        email: teacher.email,
        assignedClass: teacher.assignedClass || '',
        password: '',
      });
    } else {
       form.reset({ name: '', email: '', assignedClass: '', password: ''});
    }
  }, [teacher, form, isOpen]);


  async function onSubmit(values: TeacherFormValues) {
    setIsLoading(true);
    try {
      if (teacher) {
        updateTeacher(teacher.id, values);
        toast({ title: 'Teacher Updated', description: `${values.name} has been updated successfully.` });
      } else {
        addTeacher(values);
        toast({ title: 'Teacher Added', description: `${values.name} has been added successfully.` });
      }
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${teacher ? 'update' : 'add'} teacher.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {teacher ? (
          <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Teacher</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
          <DialogDescription>
            {teacher ? 'Update the details for this teacher.' : 'Fill in the details to create a new teacher account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="teacher@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_CLASSES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password {teacher ? '(Leave blank to keep current)' : ''}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={teacher ? "New password (optional)" : "Set a password"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {teacher ? 'Save Changes' : 'Create Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
