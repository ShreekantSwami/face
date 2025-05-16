
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceTable } from '@/components/shared/AttendanceTable';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { AVAILABLE_CLASSES } from '@/lib/constants';

const ALL_CLASSES_VALUE = "__ALL_CLASSES__";

export default function AdminReportsPage() {
  useAuthRedirect({ requiredRole: 'admin' });
  const allAttendanceRecords = useDataStore(state => state.attendanceRecords);
  
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  const teachers = useAuthStore(state => state.users.filter(u => u.role === 'teacher'));
  const uniqueClasses = AVAILABLE_CLASSES; 

  const filteredRecords = React.useMemo(() => {
    return allAttendanceRecords.filter(record => {
      const classMatch = selectedClass ? record.class === selectedClass : true;
      const dateMatch = selectedDate ? record.date === format(selectedDate, 'yyyy-MM-dd') : true;
      return classMatch && dateMatch;
    });
  }, [allAttendanceRecords, selectedClass, selectedDate]);

  const handleClassChange = (value: string) => {
    if (value === ALL_CLASSES_VALUE) {
      setSelectedClass(undefined);
    } else {
      setSelectedClass(value);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports (Admin View)</CardTitle>
          <CardDescription>View attendance records across all classes. Filter by class and date, or print the current view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 no-print gap-2">
            {/* Placeholder for potential future actions or info */}
            <div></div> 
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card shadow no-print">
            <div className="flex-1 space-y-2">
              <Label htmlFor="class-filter">Filter by Class</Label>
              <Select 
                value={selectedClass || ALL_CLASSES_VALUE} 
                onValueChange={handleClassChange}
              >
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASSES_VALUE}>All Classes</SelectItem>
                  {uniqueClasses.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-filter"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
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
             <Button onClick={() => { setSelectedClass(undefined); setSelectedDate(undefined); }} variant="ghost" className="self-end">Clear Filters</Button>
          </div>
          <AttendanceTable records={filteredRecords} showStudentName showClassName />
        </CardContent>
      </Card>
    </div>
  );
}
