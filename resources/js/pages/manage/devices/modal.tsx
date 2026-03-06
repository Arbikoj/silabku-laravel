import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

type DeviceFormData = {
    id?: number;
    device_id: string;
    bio: string;
    is_active: boolean | number;
};

type ModalDeviceProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    initialData?: DeviceFormData;
    onSuccess?: () => void;
};

export default function ModalDevice({ open, onOpenChange, mode, initialData, onSuccess }: ModalDeviceProps) {
    const initValues: DeviceFormData = {
        device_id: '',
        bio: '',
        is_active: false,
    };

    const { data, setData, processing, errors, reset, clearErrors } = useForm<DeviceFormData>(initValues);

    useEffect(() => {
        if (initialData) {
            setData({
                id: initialData.id,
                device_id: initialData.device_id || '',
                bio: initialData.bio || '',
                is_active: initialData.is_active ?? false,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            device_id: data.device_id,
            bio: data.bio,
            is_active: data.is_active ? 1 : 0,
        };

        try {
            if (mode === 'add') {
                await api.post('/devices', payload);
            } else {
                await api.put(`/devices/${initialData?.id}`, payload);
            }

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            if (error.response?.status === 422) {
                console.log(error.response.data.errors);
            } else {
                console.error('Gagal menyimpan Device:', error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Device' : 'Edit Device'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="device_id">Device ID</Label>
                        <Input id="device_id" value={data.device_id} onChange={(e) => setData('device_id', e.target.value)} required />
                        {errors.device_id && <p className="mt-1 text-sm text-red-600">{errors.device_id}</p>}
                    </div>
                    <div>
                        <Label htmlFor="bio">Keterangan</Label>
                        <Input id="bio" value={data.bio} onChange={(e) => setData('bio', e.target.value)} />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                    </div>
                    <div>
                        <Label htmlFor="is_active">Status</Label>
                        <Select value={String(data.is_active ? 1 : 0)} onValueChange={(val) => setData('is_active', val === '1')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Aktif</SelectItem>
                                <SelectItem value="0">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.is_active && <p className="mt-1 text-sm text-red-600">{errors.is_active}</p>}
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
