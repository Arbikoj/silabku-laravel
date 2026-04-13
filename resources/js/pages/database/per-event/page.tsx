import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Download,
    Filter,
    Search,
    User,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/tanstack-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Database Asisten', href: '/database' },
    { title: 'Per Event', href: '/database/event' },
];

interface AssistantRow {
    id: number;
    nama: string;
    nim: string;
    foto?: string | null;
    nilai_ipk?: number | null;
    mata_kuliah: string;
    sks?: number | null;
    kelas: string;
    nama_rek?: string | null;
    norek?: string | null;
    bank?: string | null;
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

export default function AssistantPerEventPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventId, setEventId] = useState('');
    const [search, setSearch] = useState('');
    const [data, setData] = useState<AssistantRow[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
    // Default sort: mata_kuliah ascending
    const [sorting, setSorting] = useState<SortingState>([{ id: 'mata_kuliah', desc: false }]);

    // Load events list
    useEffect(() => {
        api.get('/events', { params: { per_page: 200 } }).then((r) => {
            setEvents(r.data.data ?? []);
            if (r.data.data?.length > 0) {
                setEventId(r.data.data[0].id.toString());
            }
        });
    }, []);

    // Map raw API row to AssistantRow
    const mapRow = (amk: any): AssistantRow => ({
        id: amk.id,
        nama: amk.application?.user?.profile?.nama_lengkap ?? amk.application?.user?.name ?? 'Unknown',
        nim: amk.application?.user?.nim ?? '-',
        foto: amk.application?.user?.profile?.foto ?? null,
        nilai_ipk: amk.application?.user?.profile?.nilai_ipk ?? null,
        mata_kuliah: amk.event_mata_kuliah?.mata_kuliah?.nama ?? 'N/A',
        sks: amk.event_mata_kuliah?.mata_kuliah?.sks ?? null,
        kelas: amk.event_mata_kuliah?.kelas?.nama ?? 'N/A',
        nama_rek: amk.application?.user?.profile?.nama_rek ?? null,
        norek: amk.application?.user?.profile?.norek ?? null,
        bank: amk.application?.user?.profile?.bank ?? null,
    });

    // Fetch assistants for selected event
    const fetchData = useCallback(() => {
        if (!eventId) return;
        setLoading(true);
        api.get('/database/asisten', {
            params: {
                event_id: eventId,
                search: search || undefined,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
        })
            .then((r) => {
                // Sort client-side by mata_kuliah then nama
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

    // ── Export to XLSX with borders ───────────────────────────
    const handleExport = async () => {
        if (!eventId) return;
        setExporting(true);
        try {
            // Fetch ALL data for export
            const r = await api.get('/database/asisten', {
                params: { event_id: eventId, per_page: 9999 },
            });
            let rows: AssistantRow[] = (r.data.data ?? []).map(mapRow);
            // Sort: mata_kuliah → nama
            rows = [...rows].sort((a, b) => {
                const mk = a.mata_kuliah.localeCompare(b.mata_kuliah, 'id');
                if (mk !== 0) return mk;
                return a.nama.localeCompare(b.nama, 'id');
            });

            const headers = [
                'No',
                'Mata Kuliah',
                'Jumlah SKS',
                'Nama Asisten',
                'NIM',
                'Nama di Rekening',
                'Nomor Rekening',
                'Nama Bank',
            ];

            const sheetData = [
                headers,
                ...rows.map((row, i) => [
                    i + 1,
                    row.mata_kuliah,
                    row.sks ?? '',
                    row.nama,
                    row.nim,
                    row.nama_rek ?? '',
                    row.norek ?? '',
                    row.bank ?? '',
                ]),
            ];

            const ws = XLSX.utils.aoa_to_sheet(sheetData);

            // Column widths
            ws['!cols'] = [
                { wch: 5 },   // No
                { wch: 28 },  // Mata Kuliah
                { wch: 12 },  // Jumlah SKS
                { wch: 28 },  // Nama Asisten
                { wch: 15 },  // NIM
                { wch: 28 },  // Nama di Rekening
                { wch: 22 },  // Nomor Rekening
                { wch: 18 },  // Nama Bank
            ];

            // Apply borders to every cell
            const borderStyle = {
                top:    { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left:   { style: 'thin', color: { rgb: '000000' } },
                right:  { style: 'thin', color: { rgb: '000000' } },
            } as const;

            const headerFill = { fgColor: { rgb: 'D9E1F2' }, patternType: 'solid' } as const;

            const totalRows = sheetData.length;
            const totalCols = headers.length;
            for (let r = 0; r < totalRows; r++) {
                for (let c = 0; c < totalCols; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r, c });
                    if (!ws[cellRef]) {
                        ws[cellRef] = { t: 's', v: '' };
                    }
                    const isHeader = r === 0;
                    ws[cellRef].s = {
                        border: borderStyle,
                        font: isHeader ? { bold: true, color: { rgb: '1F3864' } } : {},
                        fill: isHeader ? headerFill : { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' },
                        alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
                    };
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Asisten');

            const filename = `asisten-${currentEvent?.nama ?? 'event'}.xlsx`;
            XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary', cellStyles: true });
        } finally {
            setExporting(false);
        }
    };

    // ── Table columns — mata_kuliah first, then nama ──────────
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
            id: 'rekening',
            header: 'Rekening',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="text-sm">
                    <div className="font-medium">
                        {row.original.nama_rek || <span className="text-muted-foreground">-</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.bank && <span className="mr-1">{row.original.bank}</span>}
                        {row.original.norek && <span className="font-mono">{row.original.norek}</span>}
                        {!row.original.bank && !row.original.norek && '-'}
                    </div>
                </div>
            ),
        },
        {
            id: 'ipk',
            header: 'IPK',
            enableSorting: false,
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-bold">
                    {row.original.nilai_ipk ?? '-'}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asisten Per Event" />

            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" /> Asisten Per Event
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Daftar asisten terpilih berdasarkan event rekrutmen.
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
                            {/* Event selector — single line with ellipsis */}
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

                            {/* Search */}
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

                            {/* Export */}
                            <Button
                                variant="outline"
                                className="shrink-0"
                                onClick={handleExport}
                                disabled={exporting || !eventId}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {exporting ? 'Mengekspor...' : 'Export XLSX'}
                            </Button>
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
