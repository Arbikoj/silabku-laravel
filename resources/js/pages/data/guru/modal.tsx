import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
export type GuruFormData = {
    id?: number;
    name: string;
    code: number;
};

type ModalGuruProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: GuruFormData;
    onSuccess?: () => void;
};

export default function ModalGuru({ open, onOpenChange, mode, initialData, onSuccess }: ModalGuruProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCode(initialData.code.toString());
        } else {
            setName('');
            setCode('');
        }
        setErrors({});
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload: GuruFormData = {
            id: initialData?.id,
            name,
            code: Number(code),
        };

        try {
            if (mode === 'add') {
                await api.post('/teachers', payload);
            } else {
                await api.put(`/teachers/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan guru:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Guru' : 'Edit Guru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>
                    <div>
                        <Label htmlFor="code">Kode</Label>
                        <Input id="code" type="number" value={code} onChange={(e) => setCode(e.target.value)} required />
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code[0]}</p>}
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
