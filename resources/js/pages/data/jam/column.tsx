import { LessonTypes } from '@/interface/Lesson';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<LessonTypes>[] = [
    {
        id: 'rowNumber',
        header: '#',
        cell: ({ row }) => row.index + 1,
        size: 40,
    },
    {
        accessorKey: 'state',
        header: 'Jam Ke',
        enableSorting: true,
    },
    {
        accessorKey: 'start_hour',
        header: 'Jam Mulai (WIB)',
        enableSorting: true,
    },

    {
        accessorKey: 'end_hour',
        header: 'Jam Selesai (WIB)',
        enableSorting: true,
    },
];
