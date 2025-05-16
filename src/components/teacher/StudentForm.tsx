
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
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';
import { Loader2, PlusCircle, Edit, UploadCloud, Image as ImageIcon } from 'lucide-react';

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Student name must be at least 2 characters.' }),
  photo1DataUri: z.string().optional().describe("Data URI of the first student photo."),
  photo2DataUri: z.string().optional().describe("Data URI of the second student photo."),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student; // For editing (photo editing UI not fully implemented here)
  onSuccess?: () => void;
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const { addStudent } = useDataStore();
  const currentUser = useAuthStore(state => state.user);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: student?.name || '',
      photo1DataUri: student?.photo1DataUri || undefined,
      photo2DataUri: student?.photo2DataUri || undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen) { // Reset form when dialog opens
      form.reset({
        name: student?.name || '',
        photo1DataUri: student?.photo1DataUri || undefined,
        photo2DataUri: student?.photo2DataUri || undefined,
      });
    }
  }, [student, form, isOpen]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof StudentFormValues
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(fieldName, reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue(fieldName, undefined);
    }
  };

  async function onSubmit(values: StudentFormValues) {
    setIsLoading(true);
    if (!currentUser || !currentUser.assignedClass || currentUser.role !== 'teacher') {
      toast({ title: 'Error', description: 'Cannot register student. Invalid teacher context.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      // For editing: a similar check and update logic would be needed.
      // if (student) { updateStudent(student.id, { ...values, class: currentUser.assignedClass, teacherId: currentUser.id }); }
      addStudent({
        name: values.name,
        class: currentUser.assignedClass,
        teacherId: currentUser.id,
        photo1DataUri: values.photo1DataUri,
        photo2DataUri: values.photo2DataUri,
      });
      toast({ title: 'Student Registered', description: `${values.name} has been registered to ${currentUser.assignedClass}.` });
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to register student.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {student ? (
           <Button variant="ghost" size="sm" disabled> {/* Editing not fully implemented */}
            <Edit className="mr-2 h-4 w-4" /> Edit 
          </Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Register Student</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Register New Student'}</DialogTitle>
          <DialogDescription>
            {student ? 'Update the student\'s details.' : `Register a new student for ${currentUser?.assignedClass || 'your class'}. Include up to two photos.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Emily White" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo1DataUri"
              render={({ field }) => ( // field is for photo1DataUri string
                <FormItem>
                  <FormLabel>Photo 1</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo1DataUri')}
                      className="text-sm file:mr-2 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                    />
                  </FormControl>
                  {form.watch('photo1DataUri') && (
                    <div className="mt-2 flex justify-center">
                      <img src={form.watch('photo1DataUri')} alt="Photo 1 Preview" className="h-24 w-24 rounded-md border object-cover shadow-sm" data-ai-hint="student photo" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo2DataUri"
              render={() => ( // field is for photo2DataUri string
                <FormItem>
                  <FormLabel>Photo 2 (Optional)</FormLabel>
                  <FormControl>
                     <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo2DataUri')}
                      className="text-sm file:mr-2 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                    />
                  </FormControl>
                  {form.watch('photo2DataUri') && (
                     <div className="mt-2 flex justify-center">
                      <img src={form.watch('photo2DataUri')} alt="Photo 2 Preview" className="h-24 w-24 rounded-md border object-cover shadow-sm" data-ai-hint="student photo" />
                    </div>
                  )}
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
                {student ? 'Save Changes' : 'Register Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
