import { MajorTypes } from '@/interface/Majors';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<MajorTypes>[] = [
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
];
