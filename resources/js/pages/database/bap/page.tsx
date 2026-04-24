import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Filter,
    Search,
    User,
    Users,
    BookOpen,
    Eye,
    IdCard,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/tanstack-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Database Asisten', href: '/database' },
    { title: 'Dokumen BAP', href: '/bap/monitoring' },
];

interface AssistantRow {
    id: number;
    nama: string;
    nim: string;
    foto?: string | null;
    mata_kuliah: string;
    sks?: number | null;
    kelas: string;
    bap_count: number;
    bap_max: number;
    bap_document_id?: string | null;
    nama_rek?: string | null;
    norek?: string | null;
    bank?: string | null;
    ipk?: number | null;
    no_wa?: string | null;
}

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
    from?: number;
    to?: number;
}

export default function BapMonitoringPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventId, setEventId] = useState('');
    const [search, setSearch] = useState('');
    const [data, setData] = useState<AssistantRow[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'mata_kuliah', desc: false }]);
    const { flash } = usePage<any>().props;

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    useEffect(() => {
        api.get('/events', { params: { per_page: 200 } }).then((r) => {
            setEvents(r.data.data ?? []);
            if (r.data.data?.length > 0) {
                setEventId(r.data.data[0].id.toString());
            }
        });
    }, []);

    const mapRow = (amk: any): AssistantRow => ({
        id: amk.id,
        nama: amk.application?.user?.profile?.nama_lengkap ?? amk.application?.user?.name ?? 'Unknown',
        nim: amk.application?.user?.nim ?? '-',
        foto: amk.application?.user?.profile?.foto ?? null,
        mata_kuliah: amk.event_mata_kuliah?.mata_kuliah?.nama ?? 'N/A',
        sks: amk.event_mata_kuliah?.mata_kuliah?.sks ?? null,
        kelas: amk.event_mata_kuliah?.kelas?.nama ?? 'N/A',
        bap_count: amk.bap_count ?? 0,
        bap_max: amk.bap_max ?? 10,
        bap_document_id: amk.bap_document_id ?? null,
        nama_rek: amk.application?.user?.profile?.nama_rek ?? null,
        norek: amk.application?.user?.profile?.norek ?? null,
        bank: amk.application?.user?.profile?.bank ?? null,
        ipk: amk.application?.user?.profile?.nilai_ipk ?? null,
        no_wa: amk.application?.user?.profile?.no_wa ?? null,
    });

    const fetchData = useCallback(() => {
        if (!eventId) return;
        setLoading(true);
        api.get('/database/bap-monitoring', {
            params: {
                event_id: eventId,
                search: search || undefined,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
        })
            .then((r) => {
                let rows: AssistantRow[] = (r.data.data ?? []).map(mapRow);
                rows = [...rows].sort((a, b) => {
                    const mk = a.mata_kuliah.localeCompare(b.mata_kuliah, 'id');
                    if (mk !== 0) return mk;
                    return a.nama.localeCompare(b.nama, 'id');
                });
                setData(rows);
                setMeta(r.data.meta ?? { total: 0, current_page: 1, last_page: 1 });
            })
            .finally(() => setLoading(false));
    }, [eventId, search, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currentEvent = events.find((e) => e.id.toString() === eventId);
    const pageCount = Math.max(1, meta.last_page);

    const columns: ColumnDef<AssistantRow>[] = [
        {
            id: 'no',
            header: 'No',
            enableSorting: false,
            cell: ({ row }) =>
                (meta.current_page - 1) * pagination.pageSize + row.index + 1,
        },
        {
            accessorKey: 'mata_kuliah',
            header: 'Mata Kuliah',
            enableSorting: true,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.mata_kuliah}</div>
                    <div className="text-xs text-muted-foreground">
                        Kelas {row.original.kelas}
                        {row.original.sks != null && (
                            <span className="ml-2">• {row.original.sks} SKS</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'nama',
            header: 'Asisten',
            enableSorting: true,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border text-primary overflow-hidden shrink-0">
                        {row.original.foto ? (
                            <img src={row.original.foto} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 opacity-40" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.nama}</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono">
                            {row.original.nim}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'bap',
            header: 'Pencapaian BAP',
            enableSorting: false,
            cell: ({ row }) => {
                const count = row.original.bap_count;
                const max = row.original.bap_max;
                const isComplete = count >= max;
                const progressPercentage = Math.round((count / max) * 100);

                return (
                    <div className="flex flex-col gap-1 w-full max-w-[150px]">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-muted-foreground">Progress</span>
                            <Badge variant={isComplete ? 'default' : 'secondary'}>
                                {count} / {max}
                            </Badge>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${isComplete ? 'bg-primary' : 'bg-primary/60'}`}
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'aksi',
            header: 'Aksi',
            enableSorting: false,
            cell: ({ row }) => {
                const count = row.original.bap_count;
                return (
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    <IdCard className="mr-1.5 h-3.5 w-3.5" />
                                    Detail Profil
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Detail Profil Asisten</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center gap-4 border-b pb-4">
                                        <div className="h-16 w-16 overflow-hidden rounded-full border bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            {row.original.foto ? (
                                                <img src={row.original.foto} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-8 w-8 opacity-40" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg leading-tight">{row.original.nama}</h4>
                                            <p className="font-mono text-sm text-muted-foreground mt-1">{row.original.nim}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Mata Kuliah</p>
                                            <p className="font-medium">{row.original.mata_kuliah} (Kelas {row.original.kelas})</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">IPK</p>
                                            <p className="font-medium">{row.original.ipk ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">No WhatsApp</p>
                                            <p className="font-medium">{row.original.no_wa ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Bank</p>
                                            <p className="font-medium">{row.original.bank ?? '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Informasi Rekening</p>
                                            <p className="font-medium">{row.original.norek ?? '-'} a.n. {row.original.nama_rek ?? '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            variant={!!row.original.bap_document_id ? 'default' : 'secondary'} 
                            size="sm" 
                            className="h-8"
                            disabled={!row.original.bap_document_id}
                            onClick={() => window.open(`/bap/${row.original.id}/redirect-doc`, '_blank')}
                        >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Lihat BAP
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Dokumen BAP" />

            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="h-6 w-6" /> Monitoring Dokumen BAP
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Pantau pencapaian penyelesaian dokumen Berita Acara Praktikum per asisten.
                        </p>
                    </div>
                </header>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {/* ── Toolbar ────────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold shrink-0">
                            <Users className="h-4 w-4 shrink-0" />
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
                            <Select
                                value={eventId}
                                onValueChange={(v) => {
                                    setEventId(v);
                                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                                }}
                            >
                                <SelectTrigger className="w-full md:w-[220px] overflow-hidden">
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

                            <div className="relative w-full md:max-w-xs">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPagination((p) => ({ ...p, pageIndex: 0 }));
                                    }}
                                    placeholder="Cari nama atau NIM..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" /> {meta.total} asisten
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
                        sorting={sorting}
                        onSortingChange={setSorting}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
