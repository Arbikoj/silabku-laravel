import { User } from '@/interface/User';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<User>[] = [
    {
        id: 'rowNumber',
        header: '#',
        cell: ({ row }) => row.index + 1,
        size: 40,
    },
    {
        accessorKey: 'uid',
        header: 'UID',
        enableSorting: true,
    },
    {
        accessorKey: 'bio',
        header: 'Keterangan',
        enableSorting: true,
    },
    {
        accessorKey: 'teacher.name',
        header: 'Nama Guru',
        enableSorting: true,
    },
];
