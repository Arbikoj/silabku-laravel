import { Badge } from '@/components/ui/badge';
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
        accessorKey: 'device_id',
        header: 'Device ID',
        enableSorting: true,
    },
    {
        accessorKey: 'bio',
        header: 'Keterangan',
        enableSorting: true,
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        enableSorting: true,
        cell: ({ row }) => {
            const value = row.getValue('is_active') as number | boolean;
            const active = value === 1 || value === true;

            return (
                <Badge className={`rounded px-2 py-1 text-white ${active ? 'bg-green-600' : 'bg-red-600'}`}>{active ? 'Actived' : 'Deactived'}</Badge>
            );
        },
    },
];
