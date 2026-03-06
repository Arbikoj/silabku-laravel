import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RfidCardFormData } from '@/interface/RfidCard';
import { Teacher } from '@/interface/Teacher';
import api from '@/lib/api';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type ModalRfidCardProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: RfidCardFormData;
    onSuccess?: () => void;
};

export default function ModalRfidCard({ open, onOpenChange, mode, initialData, onSuccess }: ModalRfidCardProps) {
    const initValues: RfidCardFormData = {
        uid: '',
        bio: '',
        teacher_id: undefined,
    };

    const { data, setData, processing, errors, reset, clearErrors } = useForm<RfidCardFormData>(initValues);

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data);
        } catch (error) {
            console.error('Gagal load teachers:', error);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (initialData) {
            setData({
                id: initialData.id,
                uid: initialData.uid || '',
                bio: initialData.bio || '',
                teacher_id: initialData.teacher_id || undefined,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            uid: data.uid,
            bio: data.bio,
            teacher_id: data.teacher_id,
        };

        try {
            if (mode === 'add') {
                await api.post('/rfidcards', payload);
            } else {
                await api.put(`/rfidcards/${initialData?.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                console.log(error.response.data.errors);
            } else {
                console.error('Gagal menyimpan RFID Card:', error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah RFID Card' : 'Edit RFID Card'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="uid">UID</Label>
                        <Input id="uid" value={data.uid} onChange={(e) => setData('uid', e.target.value)} required />
                        {errors.uid && <p className="mt-1 text-sm text-red-600">{errors.uid}</p>}
                    </div>
                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Input id="bio" value={data.bio} onChange={(e) => setData('bio', e.target.value)} />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                    </div>
                    <div>
                        <Label htmlFor="teacher_id">Guru</Label>
                        <Select
                            value={data.teacher_id ? String(data.teacher_id) : ''}
                            onValueChange={(val) => setData('teacher_id', val ? Number(val) : undefined)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Guru" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => (
                                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                                        {teacher.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.teacher_id && <p className="mt-1 text-sm text-red-600">{errors.teacher_id}</p>}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : mode === 'add' ? 'Simpan' : 'Update'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
