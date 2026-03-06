import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttendanceFormData, AttendanceTypes } from '@/interface/Attendances';
import { ScheduleTypes } from '@/interface/Schedules';
import { Teacher } from '@/interface/Teacher';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

type ModalScheduleProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: AttendanceFormData;
    onSuccess?: () => void;
};

export default function ModalSchedule({ open, onOpenChange, mode, initialData, onSuccess }: ModalScheduleProps) {
    const [status, setStatus] = useState('');
    const [userType, setUserType] = useState('');
    const [teacherId, setTeacherId] = useState<number | null>(null);
    const [schedulesId, setSchedulesId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    const [schedules, setSchedules] = useState<ScheduleTypes[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const fetchSchedules = async () => {
        try {
            const res = await api.get('/schedules');
            setSchedules(res.data.data);
        } catch (error) {
            console.error('Gagal load schedules:', error);
        }
    };

    const fetchTeachersBySchedule = async (scheduleId: number) => {
        try {
            const res = await api.get(`/teachers/scheduled/${scheduleId}`);
            setTeachers(res.data.data);
        } catch (error) {
            console.error('Gagal load teachers by schedule:', error);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    useEffect(() => {
        if (initialData) {
            setTeacherId(initialData.teacher_id);
            setSchedulesId(initialData.schedule_id);
            setUserType(initialData.user_type);
            setStatus(initialData.status);

            if (initialData.schedule_id) {
                fetchTeachersBySchedule(initialData.schedule_id);
            }
        } else {
            setTeacherId(null);
            setSchedulesId(null);
            setUserType('');
            setStatus('');
        }
        setErrors({});
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload: AttendanceTypes = {
            id: initialData?.id ?? 0,
            teacher_id: teacherId ?? 0,
            schedule_id: schedulesId ?? 0,
            user_type: userType ?? '',
            status: status ?? '',
        };

        try {
            if (mode === 'add') {
                await api.post('/attendances', payload);
            } else {
                await api.put(`/attendances/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan Absensi:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah' : 'Edit'} Absensi</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="schedule">Jadwal</Label>
                        {schedules.length > 0 && (
                            <Select
                                value={schedulesId !== null ? schedulesId.toString() : ''}
                                onValueChange={(val) => {
                                    const id = Number(val);
                                    setSchedulesId(id);
                                    setTeacherId(null);
                                    fetchTeachersBySchedule(id);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schedules.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()}>
                                            {group.day} jam ke-{group.lesson.state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.schedule_id && <p className="mt-1 text-sm text-red-600">{errors.schedule_id[0]}</p>}
                    </div>

                    <div>
                        <Label htmlFor="teacher">Guru</Label>
                        {schedulesId ? (
                            <Select value={teacherId !== null ? teacherId.toString() : ''} onValueChange={(val) => setTeacherId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Guru" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.length > 0 ? (
                                        teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                {teacher.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-teacher" disabled>
                                            Tidak ada guru untuk jadwal ini
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select disabled>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Jadwal terlebih dahulu" />
                                </SelectTrigger>
                            </Select>
                        )}
                        {errors.teacher_id && <p className="mt-1 text-sm text-red-600">{errors.teacher_id[0]}</p>}
                    </div>

                    <div>
                        <Label htmlFor="schedule">Tipe User</Label>
                        <Select value={userType !== null ? userType.toString() : ''} onValueChange={(val) => setUserType(val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih User" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.userType && <p className="mt-1 text-sm text-red-600">{errors.userType[0]}</p>}
                    </div>

                    <div>
                        <Label htmlFor="schedule">Keterangan</Label>
                        <Select value={status !== null ? status.toString() : ''} onValueChange={(val) => setStatus(val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hadir">Hadir</SelectItem>
                                <SelectItem value="terlambat">Terlambat</SelectItem>
                                <SelectItem value="sakit">Sakit</SelectItem>
                                <SelectItem value="izin">Izin</SelectItem>
                                <SelectItem value="alpa">Alpa</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
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
