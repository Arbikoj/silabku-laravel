import { Button } from '@/components/ui/button';
import { DeviceFormData } from '@/interface/Device';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { SortingState } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '../../../components/tanstack-table';
import { columns as baseColumns } from './column';
import { DeleteDeviceDialog } from './delete';
import ModalDevice from './modal';
import { ScanDeviceDialog } from './modalScan';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Data Devices', href: '/manage/devices' }];

const PageDevices = () => {
    const [data, setData] = useState<DeviceFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editData, setEditData] = useState<DeviceFormData | undefined>(undefined);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [search, setSearch] = useState('');

    const [scanModalOpen, setScanModalOpen] = useState(false);
    const [scanningDevice, setScanningDevice] = useState<DeviceFormData | null>(null);

    const fetchData = () => {
        setLoading(true);
        api.get('/devices', {
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

    const handleEdit = (device: DeviceFormData) => {
        setModalMode('edit');
        setEditData(device);
        setModalOpen(true);
    };

    const handleScan = (device: DeviceFormData) => {
        setScanningDevice(device);
        setScanModalOpen(true);
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
                    <DeleteDeviceDialog deviceId={row.original.id} deviceCode={row.original.device_id} onDeleted={fetchData} />
                    <ScanDeviceDialog deviceCode={row.original.device_id} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Devices" />
            <ModalDevice
                open={modalOpen}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) fetchData();
                }}
                mode={modalMode}
                initialData={editData}
            />

            <div className="flex items-center justify-between px-5 pt-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Cari Device..."
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

export default PageDevices;
