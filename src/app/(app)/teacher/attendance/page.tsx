'use client';

import { FacialAttendanceComponent } from '@/components/teacher/FacialAttendanceComponent';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function TakeAttendancePage() {
  useAuthRedirect({ requiredRole: 'teacher' });
  
  return (
    <div>
      <FacialAttendanceComponent />
    </div>
  );
}
