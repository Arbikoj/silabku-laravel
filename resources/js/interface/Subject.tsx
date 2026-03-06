export interface SubjectTypes {
    id: number;
    name: string;
    code: string;
    created_at: string | null;
    updated_at: string | null;
}

export type SubjectFormData = {
    id?: number;
    name: string;
    code: string;
};
