import {
    AlertDialog,
    AlertDialogAction,
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
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteRfidCardDialogProps {
    rfidCardId: number;
    uid?: string;
    onDeleted: () => void;
}

export const DeleteRfidCardDialog: React.FC<DeleteRfidCardDialogProps> = ({ rfidCardId, uid, onDeleted }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirmDelete = () => {
        setLoading(true);
        api.delete(`/rfidcards/${rfidCardId}`)
            .then(() => onDeleted())
            .catch((err) => console.error('Gagal hapus rfid card:', err))
            .finally(() => setLoading(false));
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Yakin ingin menghapus?</AlertDialogTitle>
                    <AlertDialogDescription>
                        RFID Card <strong>{uid || 'ini'}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} disabled={loading}>
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
