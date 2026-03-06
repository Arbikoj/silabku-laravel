import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubjectFormData } from '@/interface/Subject';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

type ModalMapelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: SubjectFormData;
    onSuccess?: () => void;
};

export default function ModalMapel({ open, onOpenChange, mode, initialData, onSuccess }: ModalMapelProps) {
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

        const payload: SubjectFormData = {
            id: initialData?.id,
            name,
            code: code,
        };

        try {
            if (mode === 'add') {
                await api.post('/subjects', payload);
            } else {
                await api.put(`/subjects/${payload.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.message);
            } else {
                console.error('Gagal menyimpan mapel:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Mapel' : 'Edit Mapel'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>
                    <div>
                        <Label htmlFor="code">Kode</Label>
                        <Input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required />
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
