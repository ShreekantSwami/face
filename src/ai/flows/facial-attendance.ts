
// src/ai/flows/facial-attendance.ts
'use server';

/**
 * @fileOverview Implements facial recognition attendance using Genkit and
 *   Google Gemini 2.0 Flash to identify students from a camera feed,
 *   using registered student photos for reference.
 *
 * - takeAttendance - Takes a classroom image and student reference photos, returns attendance with bounding boxes.
 * - TakeAttendanceInput - The input type for the takeAttendance function.
 * - TakeAttendanceOutput - The return type for the takeAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentInfoSchema = z.object({
  id: z.string().describe('The unique ID of the student.'),
  name: z.string().describe('The name of the student.'),
  photo1DataUri: z.string().optional().describe('First reference photo of the student as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>.'),
  photo2DataUri: z.string().optional().describe('Second reference photo of the student as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>.')
});

const TakeAttendanceInputSchema = z.object({
  classroomPhotoDataUri: z
    .string()
    .describe(
      'A photo of the students in the classroom, as a data URI that must include a MIME type and use Base64 encoding. Expected format:  data:<mimetype>;base64,<encoded_data>.'
    ),
  studentsInfo: z
    .array(StudentInfoSchema)
    .describe('A list of registered students, including their names, IDs, and reference photos.'),
});
export type TakeAttendanceInput = z.infer<typeof TakeAttendanceInputSchema>;

const DetectedStudentInfoSchema = z.object({
  id: z.string().describe('The unique ID of the identified student.'),
  name: z.string().describe('The name of the identified student.'),
  boundingBox: z.object({
    x: z.number().describe('The x-coordinate of the top-left corner of the bounding box in pixels.'),
    y: z.number().describe('The y-coordinate of the top-left corner of the bounding box in pixels.'),
    width: z.number().describe('The width of the bounding box in pixels.'),
    height: z.number().describe('The height of the bounding box in pixels.'),
  }).optional().describe('The bounding box of the student in the classroom photo. Coordinates are in pixels relative to the image dimensions. This can be omitted if a box cannot be determined.')
});

const TakeAttendanceOutputSchema = z.object({
  presentStudents: z
    .array(DetectedStudentInfoSchema)
    .describe('A list of students identified as present, including their ID, name, and optional bounding box.'),
  absentStudents: z
    .array(z.string())
    .describe('A list of student names identified as absent (from the provided student list).'),
});
export type TakeAttendanceOutput = z.infer<typeof TakeAttendanceOutputSchema>;

export async function takeAttendance(input: TakeAttendanceInput): Promise<TakeAttendanceOutput> {
  return takeAttendanceFlow(input);
}

const takeAttendancePrompt = ai.definePrompt({
  name: 'takeAttendancePrompt',
  input: {schema: TakeAttendanceInputSchema},
  output: {schema: TakeAttendanceOutputSchema},
  prompt: `You are an AI attendance tracker.
You are provided with a photo of a classroom:
{{media url=classroomPhotoDataUri}}

And a list of registered students, each with an ID, name, and up to two reference photos:
{{#each studentsInfo}}
Student Name: {{{this.name}}} (ID: {{{this.id}}})
Reference Photo 1: {{#if this.photo1DataUri}}{{media url=this.photo1DataUri}}{{else}}Not available{{/if}}
Reference Photo 2: {{#if this.photo2DataUri}}{{media url=this.photo2DataUri}}{{else}}Not available{{/if}}
---
{{/each}}

Your task is to identify which of the registered students are present in the classroom photo.
Compare the faces in the classroom photo against the reference photos provided for each student.

Output a JSON object. 
The 'presentStudents' array should contain objects, each with 'id' (student ID), 'name' (student name), and 'boundingBox' (an object with 'x', 'y', 'width', 'height' in pixels for their face in the classroomPhotoDataUri). If a bounding box cannot be reliably determined for a present student, 'boundingBox' can be omitted for that student.
The 'absentStudents' array should contain the names of students from the input list who are not identified as present.

Ensure all students from the input studentsInfo list are categorized: either in 'presentStudents' (with their details) or their names in 'absentStudents'.
Base your identification and bounding box coordinates on the provided classroomPhotoDataUri.
`,
});

const takeAttendanceFlow = ai.defineFlow(
  {
    name: 'takeAttendanceFlow',
    inputSchema: TakeAttendanceInputSchema,
    outputSchema: TakeAttendanceOutputSchema,
  },
  async input => {
    if (!input.studentsInfo || input.studentsInfo.length === 0) {
      return { presentStudents: [], absentStudents: [] };
    }
    const {output} = await takeAttendancePrompt(input);
    
    if (output) {
        const allRegisteredStudentNames = input.studentsInfo.map(s => s.name);
        const presentStudentNamesFromAI = output.presentStudents.map(ps => ps.name);
        
        const accountedForStudents = new Set([...presentStudentNamesFromAI, ...output.absentStudents]);
        
        const missingFromOutput = allRegisteredStudentNames.filter(name => !accountedForStudents.has(name));
        
        if (missingFromOutput.length > 0) {
            output.absentStudents = [...output.absentStudents, ...missingFromOutput];
        }
        
        // Ensure no student's name is in both lists (presentStudents is an array of objects)
        // If a student (by name) is in absentStudents, they should not be in presentStudents.
        output.presentStudents = output.presentStudents.filter(ps => !output.absentStudents.includes(ps.name));
    }
    
    return output!;
  }
);

