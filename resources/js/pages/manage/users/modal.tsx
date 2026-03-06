import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserFormData } from '@/interface/User';
import api from '@/lib/api';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

type ModalUserProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: UserFormData;
    onSuccess?: () => void;
};

export default function ModalUser({ open, onOpenChange, mode, initialData, onSuccess }: ModalUserProps) {
    const initValues: UserFormData = {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    };

    const { data, setData, processing, errors, reset, clearErrors } = useForm<UserFormData>(initValues);

    useEffect(() => {
        if (initialData) {
            setData({
                ...data,
                id: initialData.id,
                name: initialData.name || '',
                email: initialData.email || '',
                password: '',
                password_confirmation: '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
        };

        try {
            if (mode === 'add') {
                await api.post('/users', payload);
            } else {
                await api.put(`/users/${initialData?.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                console.log(error.response.data.errors);
            } else {
                console.error('Gagal menyimpan user:', error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah User' : 'Edit User'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required={mode === 'add'}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>
                    <div>
                        <Label htmlFor="password_confirmation">Password Confirmation</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required={mode === 'add'}
                        />
                        {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
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
