import { Button } from '@/components/ui/button';
import { LessonTypes } from '@/interface/Lesson';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { SortingState } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '../../../components/tanstack-table';
import { columns as baseColumns } from './column';
import { DeleteDialog } from './delete';
import ModalJam from './modal';
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Data Mapel', href: '/data/mapel' }];

const PageLesson = () => {
    const [data, setData] = useState<LessonTypes[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editData, setEditData] = useState<LessonTypes | undefined>(undefined);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [search, setSearch] = useState('');

    const fetchData = () => {
        setLoading(true);
        api.get('/lessons', {
            params: {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                sort_by: sorting[0]?.id,
                sort_dir: sorting[0]?.desc ? 'desc' : 'asc',
                search: search,
            },
        })
            .then((res) => {
                const { data, meta } = res.data;
                setData(data);
                setTotalItems(meta.total);
            })
            .catch((err) => {
                console.error(err);
                if (err.response?.status === 401) window.location.href = '/login';
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [pagination, sorting]);

    const handleAdd = () => {
        setModalMode('add');
        setEditData(undefined);
        setModalOpen(true);
    };

    const handleEdit = (mapel: LessonTypes) => {
        setModalMode('edit');
        setEditData(mapel);
        setModalOpen(true);
    };

    const columns = [
        ...baseColumns,
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => handleEdit(row.original)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteDialog lessonId={row.original.id} lessonState={row.original.state} onDeleted={fetchData} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jam Pelajaran" />
            <ModalJam
                open={modalOpen}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) fetchData();
                }}
                mode={modalMode}
                initialData={editData}
            />

            <div className="flex items-center justify-between px-5 pt-2">
                <Button onClick={handleAdd}>Tambah</Button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                isLoading={loading}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={Math.ceil(totalItems / pagination.pageSize)}
                sorting={sorting}
                onSortingChange={setSorting}
            />
        </AppLayout>
    );
};

export default PageLesson;
