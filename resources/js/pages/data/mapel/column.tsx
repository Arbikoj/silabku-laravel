import { SubjectTypes } from '@/interface/Subject';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<SubjectTypes>[] = [
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
        accessorKey: 'code',
        header: 'Kode',
        enableSorting: true,
    },
];
