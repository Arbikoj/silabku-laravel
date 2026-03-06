export interface LessonTypes {
    id: number;
    state: number;
    start_hour: string;
    end_hour: string;
    created_at: string | null;
    updated_at: string | null;
}

export type LessonFormData = {
    id?: number;
    state: string;
    start_hour: string;
    end_hour: string;
};
