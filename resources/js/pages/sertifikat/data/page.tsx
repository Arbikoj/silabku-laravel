import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Award,
    Filter,
    Users,
    ExternalLink
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/tanstack-table';
import type { PaginationState } from '@tanstack/react-table';
import { DocumentViewerDialog } from '@/components/document-viewer-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sertifikat', href: '#' },
    { title: 'Data Sertifikat', href: '/sertifikat/data' },
];

interface EventItem {
    id: number;
    nama: string;
    tipe: string;
    semester?: { nama: string } | null;
}

interface Meta {
    total: number;
    current_page: number;
    last_page: number;
}

interface SertifikatDataRow {
    id: number;
    nomor_sertifikat: string;
    nim: string;
    nama: string;
    mata_kuliah: string;
    generated_at: string;
}

export default function SertifikatDataPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventId, setEventId] = useState('');
    const [data, setData] = useState<SertifikatDataRow[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

    // Load events list
    useEffect(() => {
        api.get('/events', { params: { per_page: 200 } }).then((r) => {
            setEvents(r.data.data ?? []);
            if (r.data.data?.length > 0) {
                setEventId(r.data.data[0].id.toString());
            }
        });
    }, []);

    // Format raw API row
    const mapRow = (item: any): SertifikatDataRow => ({
        id: item.id,
        nomor_sertifikat: item.nomor_sertifikat,
        nim: item.user?.nim ?? '-',
        nama: item.user?.profile?.nama_lengkap ?? item.user?.name ?? '-',
        mata_kuliah: item.mata_kuliah?.nama ?? '-',
        generated_at: item.generated_at,
    });

    // Fetch data whenever event or pagination changes
    const fetchData = useCallback(() => {
        if (!eventId) return;
        setLoading(true);
        api.get('/sertifikat/data', {
            params: {
                event_id: eventId,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
        })
            .then((r) => {
                setData((r.data.data ?? []).map(mapRow));
                setMeta({
                    total: r.data.total ?? 0,
                    current_page: r.data.current_page ?? 1,
                    last_page: r.data.last_page ?? 1
                });
            })
            .finally(() => setLoading(false));
    }, [eventId, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currentEvent = events.find((e) => e.id.toString() === eventId);
    const pageCount = Math.max(1, meta.last_page);

    const columns = useMemo(
        () => [
            {
                id: 'no',
                header: 'No',
                enableSorting: false,
                cell: ({ row }: any) => (meta.current_page - 1) * pagination.pageSize + row.index + 1,
            },
            {
                accessorKey: 'nomor_sertifikat',
                header: 'Nomor Sertifikat',
                enableSorting: false,
                cell: (info: any) => <span className="font-mono">{info.getValue() || '-'}</span>,
            },
            {
                accessorKey: 'nim',
                header: 'NIM',
                enableSorting: false,
                cell: (info: any) => <span className="font-mono text-muted-foreground">{info.getValue()}</span>,
            },
            {
                accessorKey: 'nama',
                header: 'Nama',
                enableSorting: false,
                cell: (info: any) => <span className="font-semibold">{info.getValue()}</span>,
            },
            {
                accessorKey: 'mata_kuliah',
                header: 'Mata Kuliah',
                enableSorting: false,
            },
            {
                accessorKey: 'generated_at',
                header: 'Tanggal Terbit',
                enableSorting: false,
                cell: (info: any) => new Date(info.getValue()).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            },
            {
                id: 'actions',
                header: 'Aksi',
                enableSorting: false,
                cell: ({ row }: any) => (
                    <DocumentViewerDialog
                        title={`Sertifikat - ${row.original.mata_kuliah}`}
                        src={`/sertifikat/${row.original.id}/view`}
                        trigger={
                            <Button size="sm" variant="outline" className="gap-2">
                                Lihat <ExternalLink className="h-4 w-4" />
                            </Button>
                        }
                    />
                ),
            },
        ],
        [meta, pagination]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Sertifikat" />

            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" /> Data Sertifikat
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Daftar file sertifikat yang telah diterbitkan untuk asisten praktikum.
                        </p>
                    </div>
                </header>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {/* ── Toolbar ────────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold shrink-0">
                            <Award className="h-4 w-4 shrink-0 text-primary" />
                            {currentEvent ? (
                                <span className="flex items-center gap-2">
                                    <span className="truncate max-w-[180px]" title={currentEvent.nama}>
                                        {currentEvent.nama}
                                    </span>
                                    <Badge variant="outline" className="capitalize text-xs shrink-0">
                                        {currentEvent.tipe}
                                    </Badge>
                                </span>
                            ) : (
                                'Pilih Event'
                            )}
                        </div>

                        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                            {/* Event selector */}
                            <Select
                                value={eventId}
                                onValueChange={(v) => {
                                    setEventId(v);
                                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                                }}
                            >
                                <SelectTrigger className="w-full md:w-[280px] overflow-hidden">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-left flex-1 min-w-0">
                                        <SelectValue placeholder="Pilih Event" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-w-[320px]">
                                    {events.map((e) => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            <span className="block truncate max-w-[280px]" title={e.nama}>
                                                {e.nama}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="gap-1">
                                <Award className="h-3 w-3" /> {meta.total} sertifikat
                            </Badge>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={data}
                        isLoading={loading}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={pageCount}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
