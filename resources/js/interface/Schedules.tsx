import { LessonTypes } from './Lesson';

export type ScheduleTypes = {
    id: number;
    day: string;
    teacher_id: number;
    group_id: number;
    lesson_id: number;
    subject_id: number;
    lesson: LessonTypes;
};

export type ScheduleFormData = {
    id?: number;
    day: string;
    teacher_id: number;
    group_id: number;
    lesson_id: number;
    subject_id: number;
};
