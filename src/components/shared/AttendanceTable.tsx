'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AttendanceRecord } from '@/types';
import { format } from 'date-fns';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showStudentName?: boolean;
  showClassName?: boolean;
}

export function AttendanceTable({ records, showStudentName = true, showClassName = true }: AttendanceTableProps) {
  if (records.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No attendance records found for this selection.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showStudentName && <TableHead>Student Name</TableHead>}
          <TableHead>Date</TableHead>
          {showClassName && <TableHead>Class</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Marked By (ID)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map(record => (
          <TableRow key={record.id}>
            {showStudentName && <TableCell className="font-medium">{record.studentName}</TableCell>}
            <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
            {showClassName && <TableCell>{record.class}</TableCell>}
            <TableCell>
              <Badge variant={record.status === 'present' ? 'default' : 'destructive'} className={record.status === 'present' ? 'bg-green-500 hover:bg-green-600' : ''}>
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{record.markedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
