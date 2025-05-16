
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { takeAttendance, type TakeAttendanceInput, type TakeAttendanceOutput } from '@/ai/flows/facial-attendance';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Student } from '@/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function FacialAttendanceComponent() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const snapshotCanvasRef = React.useRef<HTMLCanvasElement>(null); // For taking snapshot, hidden
  const displayCanvasRef = React.useRef<HTMLCanvasElement>(null); // For displaying image and overlays
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = React.useState<TakeAttendanceOutput | null>(null);
  const [classroomPhotoForDisplay, setClassroomPhotoForDisplay] = React.useState<string | null>(null);
  
  const currentUser = useAuthStore(state => state.user);
  const getStudentsByTeacher = useDataStore(state => state.getStudentsByTeacher);
  const addMultipleAttendanceRecords = useDataStore(state => state.addMultipleAttendanceRecords);
  const { toast } = useToast();

  const studentsInClass: Student[] = React.useMemo(() => {
    if (currentUser && currentUser.role === 'teacher') {
      return getStudentsByTeacher(currentUser.id);
    }
    return [];
  }, [currentUser, getStudentsByTeacher]);

  React.useEffect(() => {
    const getCameraPermission = async () => {
      setError(null);
      setAttendanceResult(null);
      setClassroomPhotoForDisplay(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          setHasCameraPermission(false);
          setError("Failed to access camera. Please check permissions in your browser settings and try again.");
          toast({ title: "Camera Error", description: "Could not access camera. Please grant permission.", variant: "destructive" });
        }
      } else {
        setHasCameraPermission(false);
        setError("Camera access not supported by this browser.");
        toast({ title: "Unsupported Browser", description: "Camera access not supported.", variant: "destructive" });
      }
    };

    getCameraPermission();

    return () => { 
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (displayCanvasRef.current) {
        const ctx = displayCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
      }
    };
  }, [toast]);

  const drawResultsOnCanvas = (photoDataUri: string, results: TakeAttendanceOutput) => {
    const canvas = displayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (results.presentStudents) {
        results.presentStudents.forEach(student => {
          if (student.boundingBox) {
            const { x, y, width, height } = student.boundingBox;
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = 'lime';
            ctx.font = '16px Arial';
            ctx.fillText(student.name, x, y > 20 ? y - 5 : y + height + 15);
          }
        });
      }
    };
    img.src = photoDataUri;
  };


  const captureAndProcess = async () => {
    if (!videoRef.current || !videoRef.current.srcObject || !snapshotCanvasRef.current || !currentUser || studentsInClass.length === 0) {
       let errorMsg = "Cannot process attendance.";
      if (!videoRef.current?.srcObject) errorMsg = "Camera is not active. Please ensure camera permission is granted and try starting it.";
      else if (studentsInClass.length === 0) errorMsg = "No students registered in this class.";
      else errorMsg = "Missing required data for attendance (camera, user, or students).";
      
      setError(errorMsg);
      toast({ title: "Processing Error", description: errorMsg, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setAttendanceResult(null);
    setClassroomPhotoForDisplay(null);
    if (displayCanvasRef.current) { // Clear previous drawings
        const dctx = displayCanvasRef.current.getContext('2d');
        dctx?.clearRect(0,0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    }


    const video = videoRef.current;
    const canvas = snapshotCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setError("Failed to get canvas context for snapshot.");
        setIsLoading(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const classroomPhotoDataUri = canvas.toDataURL('image/jpeg');
    setClassroomPhotoForDisplay(classroomPhotoDataUri); // For drawing results
    
    const studentsInfoInput = studentsInClass.map(s => ({
      id: s.id,
      name: s.name,
      photo1DataUri: s.photo1DataUri,
      photo2DataUri: s.photo2DataUri,
    }));

    const input: TakeAttendanceInput = { 
      classroomPhotoDataUri, 
      studentsInfo: studentsInfoInput 
    };

    try {
      const result = await takeAttendance(input);
      setAttendanceResult(result);
      drawResultsOnCanvas(classroomPhotoDataUri, result); // Draw results on the display canvas
      toast({ title: "Attendance Processed", description: "Review the results below." });

      const today = format(new Date(), 'yyyy-MM-dd');
      const recordsToSave = [];
      const allProcessedStudentNames = new Set<string>();

      if (result.presentStudents) {
        for (const presentStudent of result.presentStudents) { // presentStudent is now an object
            allProcessedStudentNames.add(presentStudent.name);
            // Find original student object to ensure class and teacherId are from our store, not AI
            const studentDetails = studentsInClass.find(s => s.id === presentStudent.id);
            if (studentDetails) {
                recordsToSave.push({
                    studentId: studentDetails.id,
                    studentName: studentDetails.name, // Use name from our DB
                    date: today,
                    status: 'present' as 'present' | 'absent',
                    class: studentDetails.class,
                    markedBy: currentUser.id
                });
            }
        }
      }
      
      if (result.absentStudents) {
        for (const absentStudentName of result.absentStudents) {
            allProcessedStudentNames.add(absentStudentName);
            const studentDetails = studentsInClass.find(s => s.name === absentStudentName);
            if (studentDetails) {
                if (!recordsToSave.find(r => r.studentId === studentDetails.id)) {
                    recordsToSave.push({
                        studentId: studentDetails.id,
                        studentName: studentDetails.name,
                        date: today,
                        status: 'absent' as 'present' | 'absent',
                        class: studentDetails.class,
                        markedBy: currentUser.id
                    });
                }
            }
        }
      }
      
      studentsInClass.forEach(student => {
        if (!allProcessedStudentNames.has(student.name)) {
          if (!recordsToSave.find(r => r.studentId === student.id)) { // Avoid duplicates
            recordsToSave.push({
                studentId: student.id,
                studentName: student.name,
                date: today,
                status: 'absent' as 'present' | 'absent',
                class: student.class,
                markedBy: currentUser.id
            });
          }
        }
      });

      if(recordsToSave.length > 0) {
        addMultipleAttendanceRecords(recordsToSave);
        toast({ title: "Attendance Saved", description: `${recordsToSave.length} records saved for ${today}.`});
      } else if (studentsInClass.length > 0) {
        toast({ title: "No Attendance Data", description: "AI did not return clear student status. All marked absent by default if applicable.", variant: "default"});
      }

    } catch (aiError: any) {
      console.error("AI processing error:", aiError);
      let errorMsg = "AI processing failed. Please try again.";
      if (aiError.message) {
        errorMsg = `AI Error: ${aiError.message}`;
      }
      setError(errorMsg);
      if (displayCanvasRef.current && classroomPhotoForDisplay) { // Show captured image even if AI fails
          const img = new Image();
          img.onload = () => {
              const dctx = displayCanvasRef.current!.getContext('2d');
              if(dctx) {
                displayCanvasRef.current!.width = img.width;
                displayCanvasRef.current!.height = img.height;
                dctx.drawImage(img, 0, 0);
              }
          }
          img.src = classroomPhotoForDisplay;
      }
      toast({ title: "AI Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'teacher' || !currentUser.assignedClass) {
    return <p>You must be a teacher with an assigned class to take attendance.</p>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle>Facial Attendance for {currentUser.assignedClass}</CardTitle>
        <CardDescription>Use the camera to take attendance. Ensure students are clearly visible. Names of identified students will be shown on the captured image.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="aspect-[4/3] bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
          {/* Video feed is primary, displayCanvas is for showing snapshot + overlays */}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${classroomPhotoForDisplay ? 'hidden' : 'block'}`} />
          <canvas ref={displayCanvasRef} className={`w-full h-full object-contain ${classroomPhotoForDisplay ? 'block' : 'hidden'}`} />

          {hasCameraPermission === false && !classroomPhotoForDisplay && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                <Camera className="h-16 w-16 mb-4 text-destructive" />
                <p className="text-center">Camera access is required. Please ensure permissions are enabled in your browser settings.</p>
             </div>
          )}
           {hasCameraPermission === null && !classroomPhotoForDisplay && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                <p>Initializing camera...</p>
             </div>
          )}
        </div>
        <canvas ref={snapshotCanvasRef} className="hidden" /> {/* Hidden canvas for image capture */}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={captureAndProcess} 
            className="flex-1" 
            disabled={isLoading || hasCameraPermission !== true || studentsInClass.length === 0}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            {isLoading ? 'Processing...' : 'Capture & Process Attendance'}
          </Button>
        </div>
        {studentsInClass.length === 0 && (
            <Alert variant="default" className="border-accent text-accent">
                <AlertTriangle className="h-4 w-4 !text-accent" />
                <AlertTitle>No Students Registered</AlertTitle>
                <AlertDescription>Please register students in your class first before taking attendance.</AlertDescription>
            </Alert>
        )}
         {hasCameraPermission === true && studentsInClass.filter(s => !s.photo1DataUri).length > 0 && (
            <Alert variant="default" className="border-orange-500 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4 !text-orange-500" />
                <AlertTitle>Missing Student Photos</AlertTitle>
                <AlertDescription>
                Some students in your class are missing reference photos. Facial recognition may be less accurate for them.
                Please update their profiles with photos via the "Manage Students" page.
                </AlertDescription>
            </Alert>
        )}

        {attendanceResult && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Attendance Results Summary:</h3>
             {(!attendanceResult.presentStudents || attendanceResult.presentStudents.length === 0) && 
              (!attendanceResult.absentStudents || attendanceResult.absentStudents.length === 0) &&
              <p className="text-sm text-muted-foreground">AI did not return specific student statuses.</p>
            }
            {attendanceResult.presentStudents && attendanceResult.presentStudents.length > 0 && (
                <div>
                <h4 className="font-medium flex items-center gap-2 mb-2"><CheckCircle className="text-green-500"/> Present Students: <Badge variant="secondary">{attendanceResult.presentStudents.length}</Badge></h4>
                <ul className="list-disc list-inside pl-2 space-y-1">
                    {attendanceResult.presentStudents.map(s => <li key={`present-${s.id}`}>{s.name}</li>)}
                </ul>
                </div>
            )}
            {attendanceResult.absentStudents && attendanceResult.absentStudents.length > 0 && (
                 <div>
                <h4 className="font-medium flex items-center gap-2 mb-2"><XCircle className="text-red-500"/> Absent Students: <Badge variant="secondary">{attendanceResult.absentStudents.length}</Badge></h4>
                <ul className="list-disc list-inside pl-2 space-y-1">
                    {attendanceResult.absentStudents.map(name => <li key={`absent-${name}`}>{name}</li>)}
                </ul>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

