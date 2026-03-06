import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LessonFormData } from '@/interface/Lesson';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

type ModalJamProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: LessonFormData;
    onSuccess?: () => void;
};

export default function ModalJam({ open, onOpenChange, mode, initialData, onSuccess }: ModalJamProps) {
    const [state, setState] = useState('');
    const [start_hour, setStartHour] = useState('');
    const [end_hour, setEndHour] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        if (initialData) {
            setState(initialData.state);
            setStartHour(initialData.start_hour.toString());
            setEndHour(initialData.end_hour.toString());
        } else {
            setState('');
            setStartHour('');
            setEndHour('');
        }
        setErrors({});
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload: LessonFormData = {
            id: initialData?.id,
            state,
            start_hour,
            end_hour,
        };

        try {
            if (mode === 'add') {
                await api.post('/lessons', payload);
            } else {
                await api.put(`/lessons/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan jam:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah ' : 'Edit '}Jam</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="state">Jam Ke</Label>
                        <Input id="state" type="number" value={state} onChange={(e) => setState(e.target.value)} required />
                        {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state[0]}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_hour">Jam Mulai (WIB)</Label>
                        <Input id="start_hour" type="time" value={start_hour} onChange={(e) => setStartHour(e.target.value)} required />
                        {errors.start_hour && <p className="mt-1 text-sm text-red-600">{errors.start_hour[0]}</p>}
                    </div>
                    <div>
                        <Label htmlFor="end_hour">Jam Selesai (WIB)</Label>
                        <Input id="end_hour" type="time" value={end_hour} onChange={(e) => setEndHour(e.target.value)} required />
                        {errors.end_hour && <p className="mt-1 text-sm text-red-600">{errors.end_hour[0]}</p>}
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
