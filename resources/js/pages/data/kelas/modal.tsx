import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupTypes } from '@/interface/Group';
import { MajorTypes } from '@/interface/Majors';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

type ModalGroupProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: GroupTypes;
    onSuccess?: () => void;
};

export default function ModalGroup({ open, onOpenChange, mode, initialData, onSuccess }: ModalGroupProps) {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [majorId, setMajorId] = useState<number | null>(null);
    const [majors, setMajors] = useState<MajorTypes[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setGrade(initialData.grade);
            setMajorId(initialData.major_id);
        } else {
            setName('');
            setGrade('');
            setMajorId(null);
        }
        setErrors({});
    }, [initialData, open]);

    useEffect(() => {
        api.get('/majors')
            .then((res) => {
                setMajors(res.data.data);
                console.log('Majors dari API:', res.data.data);
            })
            .catch((err) => console.error('Gagal load majors:', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!majorId) return setErrors({ major_id: ['Jurusan harus dipilih'] });

        setLoading(true);
        setErrors({});

        const payload: GroupTypes = {
            id: initialData?.id,
            name,
            grade,
            major_id: majorId,
        };

        try {
            if (mode === 'add') {
                await api.post('/groups', payload);
            } else {
                await api.put(`/groups/${payload.id}`, payload);
            }
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan Group:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Group' : 'Edit Group'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <Label htmlFor="grade">Grade</Label>
                        <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} required />
                        {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade[0]}</p>}
                    </div>

                    <div>
                        <Label htmlFor="major">Major</Label>
                        {majors.length > 0 && (
                            <Select value={majorId !== null ? majorId.toString() : ''} onValueChange={(val) => setMajorId(Number(val))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Jurusan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {majors.map((major) => (
                                        <SelectItem key={major.id} value={major.id.toString()}>
                                            {major.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {errors.major_id && <p className="mt-1 text-sm text-red-600">{errors.major_id[0]}</p>}
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
