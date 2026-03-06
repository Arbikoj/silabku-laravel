import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayOptions } from '@/enum/DayEnum';
import { GroupTypes } from '@/interface/Group';
import { LessonTypes } from '@/interface/Lesson';
import { ScheduleFormData, ScheduleTypes } from '@/interface/Schedules';
import { SubjectTypes } from '@/interface/Subject';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { Teacher } from '../guru/column';

type ModalScheduleProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: ScheduleFormData;
    onSuccess?: () => void;
};

export default function ModalSchedule({ open, onOpenChange, mode, initialData, onSuccess }: ModalScheduleProps) {
    const [day, setDay] = useState('');
    const [teacherId, setTeacherId] = useState<number | null>(null);
    const [groupId, setGroupId] = useState<number | null>(null);
    const [lessonId, setLessonId] = useState<number | null>(null);
    const [subjectId, setSubjectId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    const [groups, setGroups] = useState<GroupTypes[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [lessons, setLessons] = useState<LessonTypes[]>([]);
    const [subjects, setSubjects] = useState<SubjectTypes[]>([]);

    // === Fetch Functions ===
    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data.data);
            console.log('Groups dari API:', res.data.data);
        } catch (error) {
            console.error('Gagal load groups:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data);
            console.log('Teachers dari API:', res.data.data);
        } catch (error) {
            console.error('Gagal load teachers:', error);
        }
    };

    const fetchLessons = async () => {
        try {
            const res = await api.get('/lessons');
            setLessons(res.data.data);
            console.log('Lessons dari API:', res.data.data);
        } catch (error) {
            console.error('Gagal load lessons:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data);
            console.log('Subjects dari API:', res.data.data);
        } catch (error) {
            console.error('Gagal load subjects:', error);
        }
    };

    // === useEffects ===
    useEffect(() => {
        fetchGroups();
        fetchTeachers();
        fetchLessons();
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (initialData) {
            setDay(initialData.day);
            setTeacherId(initialData.teacher_id);
            setGroupId(initialData.group_id);
            setLessonId(initialData.lesson_id);
            setSubjectId(initialData.subject_id);
        } else {
            setDay('');
            setTeacherId(null);
            setGroupId(null);
            setLessonId(null);
            setSubjectId(null);
        }
        setErrors({});
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload: ScheduleTypes = {
            id: initialData?.id ?? 0,
            day,
            teacher_id: teacherId ?? 0,
            lesson_id: lessonId ?? 0,
            subject_id: subjectId ?? 0,
            group_id: groupId ?? 0,
        };

        try {
            if (mode === 'add') {
                await api.post('/schedules', payload);
            } else {
                await api.put(`/schedules/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan Jadwal:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah' : 'Edit'} Jadwal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="day">Hari</Label>
                        <Select value={day} onValueChange={(val) => setDay(val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Hari" />
                            </SelectTrigger>
                            <SelectContent>
                                {DayOptions.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.day && <p className="mt-1 text-sm text-red-600">{errors.day[0]}</p>}
                    </div>

                    {/* === Group Select === */}
                    <div>
                        <Label htmlFor="group">Kelas</Label>
                        {groups.length > 0 && (
                            <Select value={groupId !== null ? groupId.toString() : ''} onValueChange={(val) => setGroupId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.group_id && <p className="mt-1 text-sm text-red-600">{errors.group_id[0]}</p>}
                    </div>

                    {/* === Teacher Select === */}
                    <div>
                        <Label htmlFor="teacher">Guru</Label>
                        {teachers.length > 0 && (
                            <Select value={teacherId !== null ? teacherId.toString() : ''} onValueChange={(val) => setTeacherId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Guru" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                            {teacher.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.teacher_id && <p className="mt-1 text-sm text-red-600">{errors.teacher_id[0]}</p>}
                    </div>

                    {/* === Lesson Select === */}
                    <div>
                        <Label htmlFor="lesson">Jam ke</Label>
                        {lessons.length > 0 && (
                            <Select value={lessonId !== null ? lessonId.toString() : ''} onValueChange={(val) => setLessonId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Jam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lessons.map((lesson) => (
                                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                                            {lesson.state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.lesson_id && <p className="mt-1 text-sm text-red-600">{errors.lesson_id[0]}</p>}
                    </div>

                    {/* === Subject Select === */}
                    <div>
                        <Label htmlFor="subject">Mapel</Label>
                        {subjects.length > 0 && (
                            <Select value={subjectId !== null ? subjectId.toString() : ''} onValueChange={(val) => setSubjectId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Mapel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id[0]}</p>}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : mode === 'add' ? 'Simpan' : 'Update'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
