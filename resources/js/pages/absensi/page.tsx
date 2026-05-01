import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Filter, Search, ClipboardCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/tanstack-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Absensi Asisten', href: '/absensi' }];

interface EventMataKuliahItem {
    id: number;
    mata_kuliah_id?: number | null;
    mata_kuliah?: { nama?: string; pertemuan_praktikum?: number } | null;
    kelas?: { id: number; nama?: string } | null;
}

interface EventItem {
    id: number;
    nama: string;
    tipe: string;
    semester?: { nama: string } | null;
    event_mata_kuliah?: EventMataKuliahItem[];
}

interface AttendanceRow {
    id: number; // application_mata_kuliah_id
    nama: string;
    nim: string;
    kelas: string;
    attendance: Record<number, boolean>;
}

interface Meta {
    total: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
}

export default function AbsensiAsistenPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventId, setEventId] = useState('');
    const [mataKuliahId, setMataKuliahId] = useState('');
    const [kelasId, setKelasId] = useState('all');
    const [nama, setNama] = useState('');
    const [data, setData] = useState<AttendanceRow[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, current_page: 1, last_page: 1 });
    const [pertemuanMax, setPertemuanMax] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [updatingCells, setUpdatingCells] = useState<Record<string, boolean>>({});

    useEffect(() => {
        api.get('/events', { params: { per_page: 200 } }).then((r) => {
            const list: EventItem[] = r.data.data ?? [];
            setEvents(list);
            if (list.length > 0) {
                const firstEventId = list[0].id.toString();
                setEventId(firstEventId);
                const firstEmk = list[0].event_mata_kuliah?.[0];
                const firstMkId = firstEmk?.mata_kuliah_id;
                if (firstMkId != null) setMataKuliahId(firstMkId.toString());
            }
        });
    }, []);

    const currentEvent = events.find((e) => e.id.toString() === eventId);
    const mataKuliahOptions = useMemo(() => {
        const raw = currentEvent?.event_mata_kuliah ?? [];
        const map = new Map<number, { id: number; nama: string }>();
        raw.forEach((item) => {
            const mkId = item.mata_kuliah_id;
            if (mkId == null) return;
            if (!map.has(mkId)) map.set(mkId, { id: mkId, nama: item.mata_kuliah?.nama ?? 'Mata Kuliah' });
        });
        return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    }, [currentEvent]);

    const currentMataKuliah = mataKuliahOptions.find((x) => x.id.toString() === mataKuliahId);

    const kelasOptions = useMemo(() => {
        const raw = currentEvent?.event_mata_kuliah ?? [];
        const mkId = Number(mataKuliahId);
        const map = new Map<number, { id: number; nama: string }>();

        raw.forEach((item) => {
            if (!mataKuliahId) return;
            if (item.mata_kuliah_id !== mkId) return;
            const kId = item.kelas?.id;
            const kNama = item.kelas?.nama ?? '';
            if (kId == null) return;
            if (!map.has(kId)) map.set(kId, { id: kId, nama: kNama || `Kelas ${kId}` });
        });

        return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    }, [currentEvent, mataKuliahId]);

    useEffect(() => {
        if (!eventId) return;
        const nextEvent = events.find((e) => e.id.toString() === eventId);
        const nextEmk = nextEvent?.event_mata_kuliah?.[0];
        const nextMkId = nextEmk?.mata_kuliah_id;
        setMataKuliahId(nextMkId != null ? nextMkId.toString() : '');
        setKelasId('all');
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [eventId, events]);

    useEffect(() => {
        setKelasId('all');
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [mataKuliahId]);

    const mapRow = (amk: any): AttendanceRow => {
        const rawAttendance = amk.attendance ?? {};
        const attendance: Record<number, boolean> = {};
        Object.keys(rawAttendance).forEach((k) => {
            attendance[Number(k)] = true;
        });

        return {
            id: amk.id,
            nama: amk.application?.user?.profile?.nama_lengkap ?? amk.application?.user?.name ?? 'Unknown',
            nim: amk.application?.user?.nim ?? '-',
            kelas: amk.event_mata_kuliah?.kelas?.nama ?? '-',
            attendance,
        };
    };

    const fetchData = useCallback(() => {
        if (!eventId || !mataKuliahId) {
            setData([]);
            setMeta({ total: 0, current_page: 1, last_page: 1 });
            setPertemuanMax(0);
            return;
        }
        setLoading(true);
        api.get('/database/absensi-asisten', {
            params: {
                event_id: eventId,
                mata_kuliah_id: mataKuliahId,
                kelas_id: kelasId === 'all' ? undefined : kelasId,
                nama: nama || undefined,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
        })
            .then((r) => {
                const rows: AttendanceRow[] = (r.data.data ?? []).map(mapRow);
                setData(rows);
                setMeta(r.data.meta ?? { total: 0, current_page: 1, last_page: 1 });
                setPertemuanMax(r.data.pertemuan_max ?? 0);
            })
            .finally(() => setLoading(false));
    }, [eventId, mataKuliahId, kelasId, nama, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pageCount = Math.max(1, meta.last_page);

    const setCell = (applicationMataKuliahId: number, pertemuanKe: number, hadir: boolean) => {
        const cellKey = `${applicationMataKuliahId}:${pertemuanKe}`;
        if (updatingCells[cellKey]) return;

        setUpdatingCells((prev) => ({ ...prev, [cellKey]: true }));
        setData((prev) =>
            prev.map((row) => {
                if (row.id !== applicationMataKuliahId) return row;
                return {
                    ...row,
                    attendance: {
                        ...row.attendance,
                        [pertemuanKe]: hadir,
                    },
                };
            }),
        );

        api.post('/database/absensi-asisten', {
            application_mata_kuliah_id: applicationMataKuliahId,
            pertemuan_ke: pertemuanKe,
            hadir,
        })
            .catch((e) => {
                toast.error(e?.response?.data?.message ?? 'Gagal menyimpan absensi.');
                setData((prev) =>
                    prev.map((row) => {
                        if (row.id !== applicationMataKuliahId) return row;
                        return {
                            ...row,
                            attendance: {
                                ...row.attendance,
                                [pertemuanKe]: !hadir,
                            },
                        };
                    }),
                );
            })
            .finally(() => {
                setUpdatingCells((prev) => {
                    const next = { ...prev };
                    delete next[cellKey];
                    return next;
                });
            });
    };

    const columns: ColumnDef<AttendanceRow>[] = useMemo(() => {
        const meetingColumns: ColumnDef<AttendanceRow>[] = Array.from({ length: pertemuanMax }, (_, i) => {
            const pertemuanKe = i + 1;
            return {
                id: `p${pertemuanKe}`,
                header: () => <span className="block text-center w-full">{pertemuanKe}</span>,
                enableSorting: false,
                cell: ({ row }: any) => {
                    const checked = !!row.original.attendance[pertemuanKe];
                    const cellKey = `${row.original.id}:${pertemuanKe}`;
                    const isBusy = !!updatingCells[cellKey];
                    return (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={checked}
                                disabled={isBusy}
                                onCheckedChange={(v) => setCell(row.original.id, pertemuanKe, v === true)}
                            />
                        </div>
                    );
                },
            };
        });

        return [
            {
                id: 'no',
                header: 'No',
                enableSorting: false,
                cell: ({ row }: any) => (meta.current_page - 1) * pagination.pageSize + row.index + 1,
            },
            {
                accessorKey: 'nim',
                header: 'NIM',
                enableSorting: false,
                cell: ({ row }: any) => <span className="font-mono text-sm">{row.original.nim}</span>,
            },
            {
                accessorKey: 'nama',
                header: 'Nama',
                enableSorting: false,
                cell: ({ row }: any) => <div className="font-medium">{row.original.nama}</div>,
            },
            {
                id: 'kelas',
                header: 'Kelas',
                enableSorting: false,
                cell: ({ row }: any) => <span className="text-sm">{row.original.kelas}</span>,
            },
            {
                id: 'kehadiran',
                header: () => <div className="text-center w-full">Kehadiran</div>,
                enableSorting: false,
                columns: meetingColumns,
            } as any,
        ];
    }, [pertemuanMax, meta.current_page, pagination.pageSize, updatingCells]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Absensi Asisten" />

            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6" /> Absensi Asisten
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola kehadiran asisten per pertemuan berdasarkan mata kuliah pada event terpilih.
                        </p>
                    </div>
                </header>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold shrink-0">
                            <Users className="h-4 w-4 shrink-0" />
                            {currentMataKuliah ? (
                                <span className="flex items-center gap-2">
                                    <span className="truncate max-w-[220px]" title={currentMataKuliah.nama}>
                                        {currentMataKuliah.nama}
                                    </span>
                                </span>
                            ) : (
                                'Pilih Mata Kuliah'
                            )}
                        </div>

                        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                            <Select
                                value={eventId}
                                onValueChange={(v) => {
                                    setEventId(v);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-[220px] overflow-hidden">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-left flex-1 min-w-0">
                                        <SelectValue placeholder="Pilih Event" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-w-[340px]">
                                    {events.map((e) => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            <span className="block truncate max-w-[300px]" title={e.nama}>
                                                {e.nama}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={mataKuliahId}
                                onValueChange={(v) => {
                                    setMataKuliahId(v);
                                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                                }}
                                disabled={!eventId || mataKuliahOptions.length === 0}
                            >
                                <SelectTrigger className="w-full md:w-[260px] overflow-hidden">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-left flex-1 min-w-0">
                                        <SelectValue placeholder="Pilih Mata Kuliah" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-w-[380px]">
                                    {mataKuliahOptions.map((item) => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            <span className="block truncate max-w-[340px]">{item.nama}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={kelasId}
                                onValueChange={(v) => {
                                    setKelasId(v);
                                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                                }}
                                disabled={!eventId || !mataKuliahId || kelasOptions.length === 0}
                            >
                                <SelectTrigger className="w-full md:w-[200px] overflow-hidden">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-left flex-1 min-w-0">
                                        <SelectValue placeholder="Semua Kelas" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-w-[260px]">
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {kelasOptions.map((item) => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            <span className="block truncate max-w-[220px]">{item.nama}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative w-full md:max-w-xs">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={nama}
                                    onChange={(e) => {
                                        setNama(e.target.value);
                                        setPagination((p) => ({ ...p, pageIndex: 0 }));
                                    }}
                                    placeholder="Cari nama..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" /> {meta.total} asisten
                            </Badge>
                            {pertemuanMax > 0 && <Badge variant="outline">{pertemuanMax} pertemuan</Badge>}
                            {currentEvent && (
                                <Badge variant="outline" className="capitalize">
                                    {currentEvent.tipe}
                                </Badge>
                            )}
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
