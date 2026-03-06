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
interface DeleteDialogProps {
    groupId: number;
    groupName?: string;
    onDeleted: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ groupId, groupName, onDeleted }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirmDelete = () => {
        setLoading(true);
        api.delete(`/groups/${groupId}`)
            .then(() => onDeleted())
            .catch((err) => console.error('Gagal hapus Jurusan:', err))
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
                        Jurusan <strong>{groupName || 'ini'}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
