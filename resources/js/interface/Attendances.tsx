import { ScheduleTypes } from './Schedules';

export type AttendanceTypes = {
    id: number;
    schedule_id: number;
    teacher_id: number;
    user_type: string;
    check_in: string;
    check_out: string;
    status: string;
    schedule: ScheduleTypes[];
};

export type AttendanceFormData = {
    id?: number;
    schedule_id: number;
    teacher_id: number;
    user_type: string;
    check_in: string;
    check_out: string;
    status: string;
    schedule: ScheduleTypes[];
};
