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
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

interface DeleteDialogProps {
    teacherId: number;
    teacherName?: string;
    onDeleted: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ teacherId, teacherName, onDeleted }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirmDelete = () => {
        setLoading(true);
        api
            .delete(`/teachers/${teacherId}`)
            .then(() => onDeleted())
            .catch((err) => console.error('Gagal hapus guru:', err))
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
                        Guru <strong>{teacherName || 'ini'}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
