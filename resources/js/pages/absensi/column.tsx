import { ScheduleTypes } from '@/interface/Schedules';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<ScheduleTypes>[] = [
    {
        id: 'rowNumber',
        header: '#',
        cell: ({ row }) => row.index + 1,
        size: 40,
    },
    {
        accessorKey: 'teacher.name',
        header: 'Nama Guru',
        enableSorting: false,
    },
    {
        accessorKey: 'schedule.day',
        header: 'Hari',
        enableSorting: false,
    },
    {
        accessorKey: 'schedule.lesson.state',
        header: 'Jam Ke',
        enableSorting: false,
    },
    {
        accessorKey: 'check_in',
        header: 'Jam Masuk',
        enableSorting: false,
    },
    {
        accessorKey: 'check_out',
        header: 'Jam Keluar',
        enableSorting: false,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
    },
];
