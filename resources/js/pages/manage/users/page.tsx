import { Button } from '@/components/ui/button';
import { UserFormData } from '@/interface/User';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { SortingState } from '@tanstack/react-table';
import axios from 'axios';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '../../../components/tanstack-table';
import { columns as baseColumns } from './column';
import { DeleteDialog } from './delete';
import ModalUser from './modal';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Data User', href: '/manage/users' }];

const PageUser = () => {
    const [data, setData] = useState<UserFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editData, setEditData] = useState<UserFormData | undefined>(undefined);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [search, setSearch] = useState('');

    const fetchData = () => {
        setLoading(true);
        api.get('/users', {
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
            .catch((err) => console.error(err))
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

    const handleEdit = (user: UserFormData) => {
        setModalMode('edit');
        setEditData(user);
        setModalOpen(true);
    };

    const handleSubmit = (formData: UserFormData) => {
        if (modalMode === 'add') {
            axios
                .post('/api/users', formData)
                .then(fetchData)
                .finally(() => setModalOpen(false));
        } else {
            axios
                .put(`/api/users/${formData.id}`, formData)
                .then(fetchData)
                .finally(() => setModalOpen(false));
        }
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
                    <DeleteDialog userId={row.original.id} userName={row.original.name} onDeleted={fetchData} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User" />
            <ModalUser
                open={modalOpen}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) fetchData();
                }}
                mode={modalMode}
                initialData={editData}
                onSubmit={handleSubmit}
            />

            <div className="flex items-center justify-between px-5 pt-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Cari user..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                        className="rounded border px-3 py-1 text-sm"
                    />
                </div>
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

export default PageUser;
