
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceTable } from '@/components/shared/AttendanceTable';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { AttendanceRecord } from '@/types';

export default function TeacherReportsPage() {
  const { user } = useAuthRedirect({ requiredRole: 'teacher' });
  const allAttendanceRecords = useDataStore(state => state.attendanceRecords);
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  const teacherClass = user?.assignedClass;

  const filteredRecords: AttendanceRecord[] = React.useMemo(() => {
    if (!teacherClass) return [];
    return allAttendanceRecords.filter(record => {
      const classMatch = record.class === teacherClass;
      const dateMatch = selectedDate ? record.date === format(selectedDate, 'yyyy-MM-dd') : true;
      return classMatch && dateMatch;
    });
  }, [allAttendanceRecords, teacherClass, selectedDate]);

  if (!user || !teacherClass) {
    return <p>Loading or not authorized...</p>; 
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports for {teacherClass}</CardTitle>
          <CardDescription>View attendance records for your class. Filter by date or print the current view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4 no-print">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card shadow no-print">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-filter"
                    variant="outline"
                    className="w-full md:w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => setSelectedDate(undefined)} variant="ghost" className="self-start md:self-end mt-2 md:mt-0">Clear Date Filter</Button>
          </div>
          <AttendanceTable records={filteredRecords} showStudentName showClassName={false} />
        </CardContent>
      </Card>
    </div>
  );
}
