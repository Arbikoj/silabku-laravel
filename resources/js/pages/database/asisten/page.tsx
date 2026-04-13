import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    BookOpen,
    Database,
    Eye,
    Search,
    User,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/tanstack-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Database Asisten', href: '/database' }];

interface Assignment {
    choice_id: number;
    event_id: number;
    event_nama: string;
    event_tipe: string;
    semester: string;
    mata_kuliah: string;
    kelas: string;
}

interface UniqueAsisten {
    user_id: number;
    nim: string;
    nama: string;
    nilai_ipk?: number | null;
    foto?: string | null;
    total_event: number;
    assignments: Assignment[];
}

interface Meta {
    total: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
}

export default function AssistantDatabasePage() {
    const [data, setData] = useState<UniqueAsisten[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'nama', desc: false }]);

    const [detailModal, setDetailModal] = useState<{ open: boolean; asisten: UniqueAsisten | null }>({
        open: false,
        asisten: null,
    });

    const fetchData = useCallback(() => {
        setLoading(true);
        api.get('/database/asisten-unik', {
            params: {
                search: search || undefined,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
            },
        })
            .then((r) => {
                setData(r.data.data);
                setMeta(r.data.meta);
            })
            .finally(() => setLoading(false));
    }, [search, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pageCount = Math.max(1, meta.last_page);

    const openDetail = (asisten: UniqueAsisten) => {
        setDetailModal({ open: true, asisten });
    };

    const columns: ColumnDef<UniqueAsisten>[] = [
        {
            id: 'no',
            header: 'No',
            enableSorting: false,
            cell: ({ row }) =>
                (meta.current_page - 1) * pagination.pageSize + row.index + 1,
        },
        {
            accessorKey: 'nama',
            header: 'Asisten',
            enableSorting: true,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border text-primary overflow-hidden shrink-0">
                        {row.original.foto ? (
                            <img
                                src={row.original.foto}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-5 w-5 opacity-40" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.nama}</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono">
                            {row.original.nim ?? '-'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'nilai_ipk',
            header: 'IPK',
            enableSorting: false,
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-bold">
                    {row.original.nilai_ipk ?? '-'}
                </Badge>
            ),
        },
        {
            id: 'total_event',
            header: 'Total Event',
            enableSorting: false,
            cell: ({ row }) => (
                <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {row.original.total_event} event
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Aksi',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => openDetail(row.original)}
                    >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Detail
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Asisten" />

            {/* ── Detail Modal ───────────────────────────────────── */}
            <Dialog
                open={detailModal.open}
                onOpenChange={(open) =>
                    setDetailModal((prev) => ({ open, asisten: open ? prev.asisten : null }))
                }
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border text-primary overflow-hidden shrink-0">
                                {detailModal.asisten?.foto ? (
                                    <img
                                        src={detailModal.asisten.foto}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-5 w-5 opacity-40" />
                                )}
                            </div>
                            <div>
                                <div>{detailModal.asisten?.nama}</div>
                                <div className="text-xs font-normal text-muted-foreground font-mono uppercase tracking-wider">
                                    {detailModal.asisten?.nim ?? '-'}
                                    {detailModal.asisten?.nilai_ipk != null && (
                                        <span className="ml-2">• IPK {detailModal.asisten.nilai_ipk}</span>
                                    )}
                                </div>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            Riwayat penugasan sebagai asisten praktikum / tutorial.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {detailModal.asisten?.assignments.length === 0 ? (
                            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                Belum ada penugasan yang tercatat.
                            </div>
                        ) : (
                            detailModal.asisten?.assignments.map((a) => (
                                <div
                                    key={a.choice_id}
                                    className="flex items-start justify-between gap-3 rounded-xl border p-4"
                                >
                                    <div className="space-y-0.5">
                                        <div className="font-semibold text-sm">{a.event_nama}</div>
                                        <div className="text-xs text-muted-foreground">{a.semester}</div>
                                        <div className="text-sm mt-1">
                                            {a.mata_kuliah}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                — Kelas {a.kelas}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={a.event_tipe === 'praktikum' ? 'default' : 'secondary'}
                                        className="capitalize shrink-0"
                                    >
                                        {a.event_tipe}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Page body ─────────────────────────────────────── */}
            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Database className="h-6 w-6" /> Database Asisten
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Arsip asisten yang sudah tervalidasi dan pernah bertugas di Silabku.
                        </p>
                    </div>
                </header>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                            <Users className="h-4 w-4" /> Daftar Asisten
                        </div>
                        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                            <div className="relative w-full md:max-w-xs">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
