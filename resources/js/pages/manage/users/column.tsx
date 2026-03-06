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
        accessorKey: 'name',
        header: 'Nama',
        enableSorting: true,
    },
    {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
    },
];
