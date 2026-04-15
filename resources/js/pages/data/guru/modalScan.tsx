'use client';

import { CenteredSpinner } from '@/components/centered-spinner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeviceResponse } from '@/hooks/use-device-response';
import { DeviceFormData } from '@/interface/Device';
import api from '@/lib/api';
import { ScanQrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ScanDeviceDialogProps {
    teacherId: string;
    teacherName?: string;
    onSuccess?: () => void;
}

export const ScanDeviceDialog: React.FC<ScanDeviceDialogProps> = ({ teacherId, teacherName, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [devices, setDevices] = useState<DeviceFormData[]>([]);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

    const { lastMessage } = useDeviceResponse(deviceId || undefined);

    // === Helper function kirim mode ke device ===
    const sendDeviceMode = async (mode: 'register' | 'scan') => {
        if (!deviceId) return;

        const payload: Record<string, any> = { device_id: deviceId, mode };
        if (mode === 'register') payload.teacher_id = teacherId;

        setLoading(true);
        setStatusMsg(null);
        setErrors({});

        try {
            await api.post('/devices/scan/start', payload);
            setStatusMsg(mode === 'register' ? 'Perangkat siap untuk mode REGISTER kartu RFID.' : 'Perangkat kembali ke mode SCAN (absensi).');
            toast.info(mode === 'register' ? 'Perangkat masuk ke mode REGISTER kartu RFID.' : 'Perangkat kembali ke mode SCAN (absensi).');
        } catch (err: any) {
            console.error(`Gagal kirim mode ${mode}:`, err.response?.data || err);
            setErrors(err.response?.data?.errors || {});
            setStatusMsg('Gagal mengirim perintah ke perangkat.');
            toast.error(`Gagal mengirim perintah ke perangkat (${mode}).`);
        } finally {
            setLoading(false);
        }
    };

    // === Ambil daftar device ===
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await api.get('/devices');
                setDevices(res.data.data || []);
            } catch (error) {
                console.error('Gagal memuat daftar device:', error);
            }
        };
        fetchDevices();
    }, []);

    // === Kirim mode register / scan setiap kali dialog dibuka/ditutup ===
    useEffect(() => {
        if (!deviceId) return;
        sendDeviceMode(open ? 'register' : 'scan');
    }, [open, deviceId]);

    // === Tangani pesan MQTT ===
    useEffect(() => {
        if (!lastMessage) return;

        let messageText = '';

        if (typeof lastMessage.message === 'object' && lastMessage.message !== null) {
            const values = Object.values(lastMessage.message).flat().filter(Boolean);
            messageText = values.join('\n');
        } else {
            messageText = lastMessage.message || '';
        }

        const isSuccess = lastMessage.success === true || lastMessage.success === 'true';

        if (isSuccess) {
            toast.success(messageText || 'Registrasi kartu berhasil!');
        } else {
            toast.error(messageText || 'Terjadi kesalahan pada perangkat.');
        }

        // Selalu kembalikan perangkat ke mode SCAN setelah pesan diterima (baik sukses atau gagal)
        if (deviceId) {
            sendDeviceMode('scan');
        }

        setOpen(false);
        onSuccess?.();
    }, [lastMessage]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" size="icon" className="text-green-600 hover:text-green-700" onClick={() => setOpen(true)}>
                    <ScanQrCode className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Register Kartu Guru</AlertDialogTitle>
                    <AlertDialogDescription>
                        Saat dialog terbuka, perangkat akan otomatis masuk ke <b>mode register</b> untuk guru <b>{teacherName || 'ini'}</b>.
                        <br />
                        Setelah ditutup, perangkat akan otomatis kembali ke <b>mode absensi</b>.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* === PILIH DEVICE === */}
                <div className="space-y-2">
                    <Label htmlFor="device">Pilih Device</Label>
                    {devices.length > 0 ? (
                        <Select value={deviceId ?? ''} onValueChange={(val) => setDeviceId(val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Device" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map((device) => (
                                    <SelectItem key={device.id} value={device.device_id}>
                                        {device.device_id} | {device.bio}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : <CenteredSpinner className="py-4" iconClassName="h-5 w-5" />}
                    {errors.device_id && <p className="text-sm text-red-600">{errors.device_id[0]}</p>}
                </div>

                {/* === STATUS === */}
                <div className="min-h-[40px] py-2">
                    {loading && <p className="text-yellow-600">⏳ Mengirim perintah ke perangkat...</p>}
                    {statusMsg && <p className="text-green-700">{statusMsg}</p>}
                    {errors.general && <p className="text-red-600">{errors.general[0]}</p>}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Tutup</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
