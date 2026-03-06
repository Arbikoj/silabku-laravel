import { ColumnDef } from '@tanstack/react-table';

export type Teacher = {
    id: number;
    name: string;
    code: number;
};

export const columns: ColumnDef<Teacher>[] = [
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
    {
        accessorKey: 'rfid_card.uid',
        header: 'Rfid',
        enableSorting: true,
    },
];
