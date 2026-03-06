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
        accessorKey: 'day',
        header: 'Hari',
        enableSorting: false,
    },
    {
        accessorFn: (row) => `${row.lesson.state} (${row.lesson.start_hour} - ${row.lesson.end_hour})`,
        id: 'lesson_info',
        header: 'Jam ke',
        enableSorting: false,
    },
    {
        accessorKey: 'teacher.name',
        header: 'Guru',
        enableSorting: false,
    },
    {
        accessorKey: 'group.name',
        header: 'Kelas',
        enableSorting: false,
    },
    {
        accessorKey: 'subject.name',
        header: 'Mapel',
        enableSorting: false,
    },
];
