import { GroupTypes } from '@/interface/Group';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<GroupTypes>[] = [
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
        accessorKey: 'grade',
        header: 'Tingkat',
        enableSorting: true,
    },
    {
        accessorKey: 'major.name',
        header: 'Jurusan',
        enableSorting: true,
    },
];
