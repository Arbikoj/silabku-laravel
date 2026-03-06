import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export type MajorFormData = {
    id?: number;
    name: string;
};

type ModalMajorProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: MajorFormData;
    onSuccess?: () => void;
};

export default function ModalMajor({ open, onOpenChange, mode, initialData, onSuccess }: ModalMajorProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
        } else {
            setName('');
        }
        setErrors({});
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload: MajorFormData = {
            id: initialData?.id,
            name,
        };

        try {
            if (mode === 'add') {
                await api.post('/majors', payload);
            } else {
                await api.put(`/majors/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan Major:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Jurusan' : 'Edit Jurusan'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
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
