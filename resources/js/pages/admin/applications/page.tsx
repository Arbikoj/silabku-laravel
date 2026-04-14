import { DocumentViewerDialog } from '@/components/document-viewer-dialog';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AxiosError } from 'axios';
import { Check, ChevronDown, ChevronRight, FileText, GraduationCap, Search, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Seleksi Asisten', href: '/seleksi' }];

interface Semester {
    id: number;
    nama: string;
}

interface Event {
    id: number;
    nama: string;
    tipe: string;
    semester_id: number;
    is_open: boolean;
    tanggal_buka: string;
    tanggal_tutup: string;
    deskripsi: string;
    semester: Semester;
}

interface OtherChoice {
    id: number;
    status: string;
    mata_kuliah: string;
    kelas: string;
}

interface Candidate {
    choice_id: number;
    application_id: number;
    status: string;
    catatan: string | null;
    is_quota_full: boolean;
    nama_asisten: string;
    nim: string;
    ipk?: number;
    no_wa?: string;
    nilai_mata_kuliah?: string;
    has_sptjm?: boolean;
    has_transkrip?: boolean;
    other_choices: OtherChoice[];
}

interface SelectionGroup {
    event_mata_kuliah_id: number;
    event: {
        id: number;
        nama: string;
        semester: string;
    };
    mata_kuliah: string;
    kelas: string;
    kuota_asisten: number;
    approved_count: number;
    remaining_slots: number;
    is_quota_full: boolean;
    candidates: Candidate[];
}

const statusBadgeVariant = (status: string) => {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
};

export default function ApplicationSelectionPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [groups, setGroups] = useState<SelectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ event_id: '0', status: '0', search: '' });
    const [processingChoiceId, setProcessingChoiceId] = useState<number | null>(null);
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

    const fetchBoard = useCallback(() => {
        setLoading(true);
        api.get('/applications/selection-board', {
            params: {
                event_id: filters.event_id !== '0' ? filters.event_id : undefined,
                status: filters.status !== '0' ? filters.status : undefined,
                search: filters.search || undefined,
            },
        })
            .then((r) => setGroups(r.data.data))
            .finally(() => setLoading(false));
    }, [filters]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    useEffect(() => {
        api.get('/events').then((r) => setEvents(r.data.data));
    }, []);

    useEffect(() => {
        setExpandedCards((prev) => {
            const nextState: Record<number, boolean> = {};

            groups.forEach((group) => {
                nextState[group.event_mata_kuliah_id] = prev[group.event_mata_kuliah_id] ?? false;
            });

            return nextState;
        });
    }, [groups]);

    const handleReviewChoice = async (choiceId: number, type: 'approve' | 'reject') => {
        setProcessingChoiceId(choiceId);

        try {
            await api.post(`/applications/choices/${choiceId}/${type}`, { catatan: null });
            toast.success(type === 'approve' ? 'Asisten berhasil di-ACC' : 'Pilihan berhasil ditolak');
            fetchBoard();
        } catch (error: unknown) {
            const responseMessage =
                error instanceof AxiosError ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
            toast.error(responseMessage || 'Gagal memproses pilihan');
        } finally {
            setProcessingChoiceId(null);
        }
    };

    const summary = useMemo(() => {
        const totalCandidates = groups.reduce((total, group) => total + group.candidates.length, 0);
        const totalApproved = groups.reduce((total, group) => total + group.approved_count, 0);
        const totalQuota = groups.reduce((total, group) => total + group.kuota_asisten, 0);

        return {
            totalClasses: groups.length,
            totalCandidates,
            totalApproved,
            totalQuota,
        };
    }, [groups]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Seleksi Asisten" />

            <div className="p-5">
                <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Seleksi Asisten per Kelas</h1>
                            <p className="text-sm text-muted-foreground">
                                Pilih kelas terlebih dahulu, lalu ACC kandidat langsung di dalam daftar kelas tersebut.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{summary.totalClasses} kelas</Badge>
                            <Badge variant="outline">{summary.totalCandidates} pendaftar</Badge>
                            <Badge variant="outline">
                                Terisi {summary.totalApproved}/{summary.totalQuota}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="grid gap-1">
                            <Label className="text-xs">Event</Label>
                            <Select value={filters.event_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, event_id: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Event</SelectItem>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id.toString()}>
                                            {event.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs">Status Kandidat</Label>
                            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs">Cari Kandidat</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={filters.search}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                    placeholder="Nama atau NIM..."
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-dashed py-20 text-center text-sm text-muted-foreground">
                        Memuat data seleksi...
                    </div>
                ) : groups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed py-20 text-center text-sm text-muted-foreground">
                        Tidak ada kelas atau kandidat yang cocok dengan filter.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {groups.map((group) => (
                            <Collapsible
                                key={group.event_mata_kuliah_id}
                                open={expandedCards[group.event_mata_kuliah_id] ?? false}
                                onOpenChange={(open) =>
                                    setExpandedCards((prev) => ({ ...prev, [group.event_mata_kuliah_id]: open }))
                                }
                            >
                                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                                    <CollapsibleTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/20"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <h2 className="truncate text-lg font-semibold">
                                                    {group.mata_kuliah} - Kelas {group.kelas}
                                                </h2>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs">
                                                <Badge variant="secondary">Kuota {group.kuota_asisten}</Badge>
                                                <Badge variant="secondary">Terisi {group.approved_count}</Badge>
                                                <Badge variant={group.remaining_slots > 0 ? 'outline' : 'destructive'}>
                                                    Sisa {group.remaining_slots}
                                                </Badge>
                                            </div>

                                            <div className="shrink-0 text-muted-foreground">
                                                {expandedCards[group.event_mata_kuliah_id] ? (
                                                    <ChevronDown className="h-5 w-5" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5" />
                                                )}
                                            </div>
                                        </button>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <div className="border-t bg-muted/10 px-5 py-3 text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">{group.event.nama}</span> • {group.event.semester}
                                        </div>

                                        {group.candidates.length === 0 ? (
                                            <div className="px-5 py-10 text-center text-sm text-muted-foreground">Belum ada pendaftar pada kelas ini.</div>
                                        ) : (
                                            <div className="max-h-[420px] overflow-y-auto">
                                                <div className="divide-y">
                                                    {group.candidates.map((candidate) => (
                                                        <div
                                                            key={candidate.choice_id}
                                                            className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                                                    <div className="font-semibold">{candidate.nama_asisten}</div>
                                                                    <Badge variant={statusBadgeVariant(candidate.status)} className="capitalize">
                                                                        {candidate.status}
                                                                    </Badge>
                                                                </div>

                                                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                                    <span>NIM: {candidate.nim || '-'}</span>
                                                                    <span>IPK: {candidate.ipk ?? '-'}</span>
                                                                    <span>
                                                                        Nilai MK: <strong className="text-foreground">{candidate.nilai_mata_kuliah ?? '-'}</strong>
                                                                    </span>
                                                                    {candidate.no_wa && <span>WA: {candidate.no_wa}</span>}
                                                                </div>

                                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                    {candidate.has_sptjm && (
                                                                        <DocumentViewerDialog
                                                                            title={`SPTJM - ${candidate.nama_asisten}`}
                                                                            src={`/seleksi/choices/${candidate.choice_id}/sptjm`}
                                                                            trigger={
                                                                                <Button size="sm" variant="outline" className="h-8">
                                                                                    <FileText className="h-3.5 w-3.5" /> Lihat SPTJM
                                                                                </Button>
                                                                            }
                                                                        />
                                                                    )}
                                                                    {candidate.has_transkrip && (
                                                                        <DocumentViewerDialog
                                                                            title={`Transkrip - ${candidate.nama_asisten}`}
                                                                            src={`/seleksi/choices/${candidate.choice_id}/transkrip`}
                                                                            trigger={
                                                                                <Button size="sm" variant="outline" className="h-8">
                                                                                    <GraduationCap className="h-3.5 w-3.5" /> Lihat Transkrip
                                                                                </Button>
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>

                                                                {candidate.other_choices.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                                            Pilihan lain
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {candidate.other_choices.map((choice) => (
                                                                                <Badge key={choice.id} variant="outline" className="text-[11px]">
                                                                                    {choice.mata_kuliah} ({choice.kelas}) - {choice.status}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {candidate.catatan && (
                                                                    <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                                                        Catatan: {candidate.catatan}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                                {candidate.status !== 'approved' && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-9"
                                                                        onClick={() => handleReviewChoice(candidate.choice_id, 'approve')}
                                                                        disabled={processingChoiceId === candidate.choice_id || group.is_quota_full}
                                                                    >
                                                                        <Check className="mr-1 h-4 w-4" /> Approve
                                                                    </Button>
                                                                )}
                                                                {candidate.status !== 'rejected' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-9 border-red-200 text-destructive hover:bg-red-50"
                                                                        onClick={() => handleReviewChoice(candidate.choice_id, 'reject')}
                                                                        disabled={processingChoiceId === candidate.choice_id}
                                                                    >
                                                                        <X className="mr-1 h-4 w-4" /> Reject
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CollapsibleContent>
                                </section>
                            </Collapsible>
                        ))}
                    </div>
                )}

                {!loading && groups.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Daftar disusun per mata kuliah dan kelas agar ACC mengikuti kuota dengan lebih mudah.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
