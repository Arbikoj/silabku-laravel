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
import api from '@/lib/api';
import { ScanQrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScanDeviceDialogProps {
    deviceCode?: string;
}

export const ScanDeviceDialog: React.FC<ScanDeviceDialogProps> = ({ deviceCode }) => {
    const [loading, setLoading] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    // polling untuk ambil UID
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (open && deviceCode) {
            setLoading(true);
            setUid(null);

            // Kirim perintah scan ke device via Laravel
            api.post(`/devices/${deviceCode}/scan`)
                .then((res) => {
                    console.log('Scan perintah dikirim ke device', res.data);
                })
                .catch((err) => {
                    console.error('Gagal kirim perintah scan:', err);
                    setLoading(false);
                });

            // Mulai polling untuk ambil hasil scan
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/devices/${deviceCode}/latest-scan`);
                    if (res.data?.uid) {
                        setUid(res.data.uid);
                        setLoading(false);
                        clearInterval(interval); // stop polling
                    }
                } catch (err) {
                    console.error('Gagal ambil scan result:', err);
                }
            }, 1000); // polling tiap 1 detik
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [open, deviceCode]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" size="icon" className="text-green-600 hover:text-green-700" onClick={() => setOpen(true)}>
                    <ScanQrCode className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Scan Device</AlertDialogTitle>
                    <AlertDialogDescription>
                        Device <strong>{deviceCode || 'ini'}</strong> sedang menunggu kartu...
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="min-h-[40px] py-2">
                    {loading && <p className="text-yellow-600">⏳ Menunggu scan kartu...</p>}
                    {uid && (
                        <p className="text-green-600">
                            ✅ UID berhasil dibaca: <b>{uid}</b>
                        </p>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Tutup</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
