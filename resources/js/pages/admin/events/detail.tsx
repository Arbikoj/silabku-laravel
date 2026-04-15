import { CenteredSpinner } from '@/components/centered-spinner';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, Loader2, PencilLine, RefreshCcw, Search, UserCheck, UserCog, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/tanstack-table';
import { toast } from 'sonner';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

interface MK {
    id: number;
    nama: string;
    kode: string;
}

interface KelasOption {
    id: number;
    nama: string;
    mata_kuliah_id: number;
    mata_kuliah: MK;
}

interface EMK {
    id: number;
    mata_kuliah_id: number;
    kelas_id: number;
    approved_assistant_count: number;
    mata_kuliah: MK;
    kelas: { nama: string };
}

interface ApprovedAssistant {
    id: number;
    application_id: number;
    event_mata_kuliah_id: number;
    mata_kuliah: string;
    kelas: string;
    nama_asisten: string;
    nim: string;
    ipk?: number;
    nilai_mata_kuliah?: string;
    sptjm_gd_id?: string;
}

interface EventDetail {
    id: number;
    nama: string;
    semester_id: number;
    tipe: string;
    is_open: boolean;
    tanggal_buka?: string | null;
    tanggal_tutup?: string | null;
    deskripsi?: string | null;
    semester: { nama: string };
    event_mata_kuliah: EMK[];
}

interface SwitchOption {
    id: number;
    event_mata_kuliah_id: number;
    mata_kuliah: string;
    kelas: string;
    nama_asisten: string;
    nim: string;
}

interface ReplacementCandidate {
    id: number;
    application_id: number;
    status: string;
    nama_asisten: string;
    nim: string;
    ipk?: number;
    nilai_mata_kuliah?: string;
    sptjm_gd_id?: string;
    mata_kuliah: string;
    kelas: string;
}

export default function EventDetailPage({ eventId }: { eventId: string }) {
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [assistants, setAssistants] = useState<ApprovedAssistant[]>([]);
    const [loading, setLoading] = useState(true);

    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [manageModalOpen, setManageModalOpen] = useState(false);
    const [managedKelasIds, setManagedKelasIds] = useState<number[]>([]);
    const [newKelasId, setNewKelasId] = useState('');
    const [savingMK, setSavingMK] = useState(false);

    const [switchModal, setSwitchModal] = useState<{ open: boolean; assistant: ApprovedAssistant | null }>({ open: false, assistant: null });
    const [switchOptions, setSwitchOptions] = useState<SwitchOption[]>([]);
    const [switchSearch, setSwitchSearch] = useState('');
    const [switchTargetId, setSwitchTargetId] = useState('');
    const [switchLoading, setSwitchLoading] = useState(false);
    const [switchSubmitting, setSwitchSubmitting] = useState(false);

    const [replaceModal, setReplaceModal] = useState<{ open: boolean; assistant: ApprovedAssistant | null }>({ open: false, assistant: null });
    const [replaceSearch, setReplaceSearch] = useState('');
    const [replaceCandidates, setReplaceCandidates] = useState<ReplacementCandidate[]>([]);
    const [replacementChoiceId, setReplacementChoiceId] = useState('');
    const [replacementLoading, setReplacementLoading] = useState(false);
    const [replacementSubmitting, setReplacementSubmitting] = useState(false);

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'mata_kuliah', desc: false }]);
    const [search, setSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '#' },
        { title: 'Event Oprec', href: '/admin/events' },
        { title: event?.nama ?? 'Detail', href: '#' },
    ];

    const fetch = useCallback(() => {
        setLoading(true);
        api.get(`/events/${eventId}`)
            .then((r) => {
                setEvent(r.data.event);
                setAssistants(r.data.approved_assistants);
            })
            .finally(() => setLoading(false));
    }, [eventId]);

    const fetchAllKelas = useCallback(() => {
        api.get('/kelas', { params: { per_page: 200 } }).then((r) => setKelasOptions(r.data.data));
    }, []);

    useEffect(() => {
        fetch();
        fetchAllKelas();
    }, [fetch, fetchAllKelas]);

    useEffect(() => {
        if (event) {
            setManagedKelasIds(event.event_mata_kuliah.map((item) => item.kelas_id));
        }
    }, [event]);

    const filteredAndSortedAssistants = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        let result = assistants.filter((assistant) => {
            if (!keyword) {
                return true;
            }

            return [
                assistant.mata_kuliah,
                assistant.kelas,
                assistant.nama_asisten,
                assistant.nim,
            ].some((value) => value.toLowerCase().includes(keyword));
        });

        const activeSort = sorting[0];
        if (activeSort) {
            result = [...result].sort((a, b) => {
                const getSortableValue = (item: ApprovedAssistant) => {
                    switch (activeSort.id) {
                        case 'nama_asisten':
                            return item.nama_asisten;
                        case 'status':
                            return 'approved';
                        case 'mata_kuliah':
                        default:
                            return `${item.mata_kuliah} ${item.kelas}`;
                    }
                };

                const left = getSortableValue(a).toLowerCase();
                const right = getSortableValue(b).toLowerCase();
                const comparison = left.localeCompare(right, 'id');

                return activeSort.desc ? comparison * -1 : comparison;
            });
        }

        return result;
    }, [assistants, search, sorting]);

    useEffect(() => {
        const maxPageIndex = Math.max(0, Math.ceil(filteredAndSortedAssistants.length / pagination.pageSize) - 1);
        if (pagination.pageIndex > maxPageIndex) {
            setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
        }
    }, [filteredAndSortedAssistants.length, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        if (!switchModal.open || !switchModal.assistant) {
            return;
        }

        setSwitchLoading(true);
        api.get(`/applications/choices/${switchModal.assistant.id}/switch-options`)
            .then((r) => setSwitchOptions(r.data.data))
            .catch(() => toast.error('Gagal memuat opsi switch'))
            .finally(() => setSwitchLoading(false));
    }, [switchModal]);

    useEffect(() => {
        if (!replaceModal.open || !replaceModal.assistant) {
            return;
        }

        setReplacementLoading(true);
        api.get(`/applications/choices/${replaceModal.assistant.id}/replacement-candidates`, {
            params: { search: replaceSearch || undefined },
        })
            .then((r) => setReplaceCandidates(r.data.data))
            .catch(() => toast.error('Gagal memuat kandidat pengganti'))
            .finally(() => setReplacementLoading(false));
    }, [replaceModal, replaceSearch]);

    const availableKelas = kelasOptions.filter((kelas) => !managedKelasIds.includes(kelas.id));
    const selectedEventMK = kelasOptions.find((kelas) => kelas.id.toString() === newKelasId);
    const filteredSwitchOptions = useMemo(() => {
        const keyword = switchSearch.trim().toLowerCase();

        if (!keyword) {
            return switchOptions;
        }

        return switchOptions.filter((option) =>
            [option.nama_asisten, option.nim, option.mata_kuliah, option.kelas].some((value) => value.toLowerCase().includes(keyword)),
        );
    }, [switchOptions, switchSearch]);
    const currentPageData = filteredAndSortedAssistants.slice(
        pagination.pageIndex * pagination.pageSize,
        pagination.pageIndex * pagination.pageSize + pagination.pageSize,
    );
    const pageCount = Math.max(1, Math.ceil(filteredAndSortedAssistants.length / pagination.pageSize));

    const handleAddMK = () => {
        if (!newKelasId) {
            return;
        }

        const selectedId = Number(newKelasId);
        if (!managedKelasIds.includes(selectedId)) {
            setManagedKelasIds((prev) => [...prev, selectedId]);
        }
        setNewKelasId('');
    };

    const handleRemoveMK = (kelasId: number) => {
        const emk = event?.event_mata_kuliah.find((item) => item.kelas_id === kelasId);
        if (emk?.approved_assistant_count) {
            toast.error('Mata kuliah yang masih memiliki asisten terpilih tidak bisa dihapus.');
            return;
        }

        setManagedKelasIds((prev) => prev.filter((id) => id !== kelasId));
    };

    const saveMK = async () => {
        if (!event) {
            return;
        }

        setSavingMK(true);
        try {
            const selectedData = kelasOptions
                .filter((kelas) => managedKelasIds.includes(kelas.id))
                .map((kelas) => ({
                    mata_kuliah_id: kelas.mata_kuliah_id,
                    kelas_id: kelas.id,
                }));

            await api.put(`/events/${eventId}`, {
                nama: event.nama,
                tipe: event.tipe,
                semester_id: event.semester_id,
                is_open: event.is_open,
                tanggal_buka: event.tanggal_buka,
                tanggal_tutup: event.tanggal_tutup,
                deskripsi: event.deskripsi,
                mata_kuliah: selectedData,
            });

            toast.success('Daftar mata kuliah berhasil diperbarui');
            setManageModalOpen(false);
            fetch();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal menyimpan daftar mata kuliah');
        } finally {
            setSavingMK(false);
        }
    };

    const openSwitchModal = (assistant: ApprovedAssistant) => {
        setSwitchSearch('');
        setSwitchTargetId('');
        setSwitchOptions([]);
        setSwitchModal({ open: true, assistant });
    };

    const submitSwitch = async () => {
        if (!switchModal.assistant || !switchTargetId) {
            toast.error('Pilih penugasan tujuan terlebih dahulu.');
            return;
        }

        setSwitchSubmitting(true);
        try {
            await api.post(`/applications/choices/${switchModal.assistant.id}/switch`, {
                target_choice_id: Number(switchTargetId),
            });
            toast.success('Penugasan asisten berhasil ditukar');
            setSwitchModal({ open: false, assistant: null });
            setSwitchOptions([]);
            setSwitchTargetId('');
            fetch();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal melakukan switch');
        } finally {
            setSwitchSubmitting(false);
        }
    };

    const openReplaceModal = (assistant: ApprovedAssistant) => {
        setReplaceSearch('');
        setReplacementChoiceId('');
        setReplaceCandidates([]);
        setReplaceModal({ open: true, assistant });
    };

    const submitReplace = async () => {
        if (!replaceModal.assistant || !replacementChoiceId) {
            toast.error('Pilih asisten pengganti terlebih dahulu.');
            return;
        }

        setReplacementSubmitting(true);
        try {
            await api.post(`/applications/choices/${replaceModal.assistant.id}/replace-approved`, {
                replacement_choice_id: Number(replacementChoiceId),
            });
            toast.success('Asisten berhasil diganti');
            setReplaceModal({ open: false, assistant: null });
            setReplaceCandidates([]);
            setReplacementChoiceId('');
            fetch();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gagal mengganti asisten');
        } finally {
            setReplacementSubmitting(false);
        }
    };

    const columns: ColumnDef<ApprovedAssistant>[] = [
        {
            id: 'no',
            header: 'No',
            enableSorting: false,
            cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
        },
        {
            accessorKey: 'mata_kuliah',
            header: 'Mata Kuliah',
            enableSorting: true,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.mata_kuliah}</div>
                    <div className="text-xs text-muted-foreground">Kelas {row.original.kelas}</div>
                </div>
            ),
        },
        {
            accessorKey: 'nama_asisten',
            header: 'Asisten',
            enableSorting: true,
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold">{row.original.nama_asisten}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{row.original.nim}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {row.original.nilai_mata_kuliah && (
                            <Badge variant="secondary" className="text-[10px]">Nilai: {row.original.nilai_mata_kuliah}</Badge>
                        )}
                        {row.original.sptjm_gd_id && (
                            <a href={`/storage/${row.original.sptjm_gd_id}`} target="_blank" className="text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                📄 SPTJM
                            </a>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            enableSorting: true,
            cell: () => <Badge variant="outline">Approved</Badge>,
        },
        {
            id: 'actions',
            header: 'Aksi',
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openSwitchModal(row.original)}>
                        <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Switch
                    </Button>
                    <Button size="sm" className="h-8" onClick={() => openReplaceModal(row.original)}>
                        <UserCog className="mr-1 h-3.5 w-3.5" /> Ganti
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={[]}>
                <CenteredSpinner className="p-10" />
            </AppLayout>
        );
    }

    if (!event) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="p-10 text-center">Event tidak ditemukan</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.nama} />

            <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Mata Kuliah</DialogTitle>
                        <DialogDescription>Tambah atau hapus mata kuliah dan kelas yang dibuka pada event ini.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="rounded-xl border bg-muted/20 p-4">
                            <div className="mb-3 text-sm font-semibold">Tambah Mata Kuliah Baru</div>
                            <div className="flex flex-col gap-3 md:flex-row">
                                <Select value={newKelasId} onValueChange={setNewKelasId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih mata kuliah dan kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableKelas.map((kelas) => (
                                            <SelectItem key={kelas.id} value={kelas.id.toString()}>
                                                {kelas.mata_kuliah.nama} - Kelas {kelas.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddMK} disabled={!selectedEventMK}>
                                    Tambah
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-sm font-semibold">Daftar Mata Kuliah Event</div>
                            {managedKelasIds.length === 0 ? (
                                <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                    Belum ada mata kuliah yang dipilih untuk event ini.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {managedKelasIds.map((kelasId) => {
                                        const kelas = kelasOptions.find((item) => item.id === kelasId);
                                        const emk = event.event_mata_kuliah.find((item) => item.kelas_id === kelasId);
                                        const assignedCount = emk?.approved_assistant_count || 0;

                                        if (!kelas) {
                                            return null;
                                        }

                                        return (
                                            <div key={kelas.id} className="flex items-center justify-between rounded-xl border p-3">
                                                <div>
                                                    <div className="font-medium">{kelas.mata_kuliah.nama}</div>
                                                    <div className="text-xs text-muted-foreground">Kelas {kelas.nama}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {assignedCount > 0 && <Badge variant="secondary">{assignedCount} asisten</Badge>}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRemoveMK(kelas.id)}
                                                        disabled={assignedCount > 0}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setManageModalOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={saveMK} disabled={savingMK}>
                            {savingMK && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={switchModal.open}
                onOpenChange={(open) => {
                    setSwitchModal((prev) => ({ open, assistant: open ? prev.assistant : null }));
                    if (!open) {
                        setSwitchOptions([]);
                        setSwitchSearch('');
                        setSwitchTargetId('');
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Switch Penugasan</DialogTitle>
                        <DialogDescription>
                            Tukarkan penugasan {switchModal.assistant?.nama_asisten} ke mata kuliah atau kelas lain dalam event yang sama.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {switchModal.assistant && (
                            <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                                <div className="font-semibold">{switchModal.assistant.nama_asisten}</div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">{switchModal.assistant.nim}</div>
                                <div className="text-muted-foreground">
                                    {switchModal.assistant.mata_kuliah} - Kelas {switchModal.assistant.kelas}
                                </div>
                            </div>
                        )}

                        {switchLoading ? (
                            <CenteredSpinner className="py-10" iconClassName="h-6 w-6" />
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={switchSearch}
                                        onChange={(e) => setSwitchSearch(e.target.value)}
                                        placeholder="Cari nama, NIM, mata kuliah, atau kelas pengganti..."
                                        className="pl-9"
                                    />
                                </div>

                                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                                    {filteredSwitchOptions.length === 0 ? (
                                        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                            {switchOptions.length === 0
                                                ? 'Tidak ada opsi switch yang tersedia untuk asisten ini.'
                                                : 'Tidak ada hasil yang cocok dengan pencarian.'}
                                        </div>
                                    ) : (
                                        filteredSwitchOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => setSwitchTargetId(option.id.toString())}
                                                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                                                    switchTargetId === option.id.toString() ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="font-semibold">{option.nama_asisten}</div>
                                                        <div className="text-xs text-muted-foreground">{option.nim}</div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            {option.mata_kuliah} - Kelas {option.kelas}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">Tujuan Switch</Badge>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSwitchModal({ open: false, assistant: null })}>
                            Batal
                        </Button>
                        <Button onClick={submitSwitch} disabled={switchSubmitting || !switchTargetId}>
                            {switchSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={replaceModal.open}
                onOpenChange={(open) => {
                    setReplaceModal((prev) => ({ open, assistant: open ? prev.assistant : null }));
                    if (!open) {
                        setReplaceCandidates([]);
                        setReplacementChoiceId('');
                        setReplaceSearch('');
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Ganti Asisten</DialogTitle>
                        <DialogDescription>
                            Pilih kandidat pengganti untuk {replaceModal.assistant?.mata_kuliah} kelas {replaceModal.assistant?.kelas}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={replaceSearch}
                                onChange={(e) => setReplaceSearch(e.target.value)}
                                placeholder="Cari nama atau NIM kandidat..."
                                className="pl-9"
                            />
                        </div>

                        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {replacementLoading ? (
                                <CenteredSpinner className="py-10" iconClassName="h-6 w-6" />
                            ) : replaceCandidates.length === 0 ? (
                                <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                    Tidak ada kandidat pengganti untuk mata kuliah dan kelas ini.
                                </div>
                            ) : (
                                replaceCandidates.map((candidate) => (
                                    <button
                                        key={candidate.id}
                                        type="button"
                                        onClick={() => setReplacementChoiceId(candidate.id.toString())}
                                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                                            replacementChoiceId === candidate.id.toString() ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{candidate.nama_asisten}</div>
                                                <div className="text-xs text-muted-foreground">{candidate.nim}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {candidate.mata_kuliah} - Kelas {candidate.kelas}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex gap-2">
                                                    {candidate.ipk !== undefined && <Badge variant="secondary">IPK {candidate.ipk}</Badge>}
                                                    {candidate.nilai_mata_kuliah && <Badge variant="secondary">Nilai {candidate.nilai_mata_kuliah}</Badge>}
                                                    <Badge variant="outline" className="capitalize">
                                                        {candidate.status}
                                                    </Badge>
                                                </div>
                                                {candidate.sptjm_gd_id && (
                                                    <a href={`/storage/${candidate.sptjm_gd_id}`} target="_blank" className="text-xs font-medium text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                                        📄 Lihat SPTJM
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReplaceModal({ open: false, assistant: null })}>
                            Batal
                        </Button>
                        <Button onClick={submitReplace} disabled={replacementSubmitting || !replacementChoiceId}>
                            {replacementSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Pengganti
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="p-5">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{event.nama}</h1>
                        <p className="text-sm text-muted-foreground">
                            {event.semester.nama} • {event.tipe}
                        </p>
                    </div>
                    <Button onClick={() => setManageModalOpen(true)}>
                        <PencilLine className="mr-2 h-4 w-4" /> Mata Kuliah Baru
                    </Button>
                </header>

                <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 font-semibold">
                        <BookOpen className="h-4 w-4" /> Mata Kuliah Dibuka
                    </div>
                    {event.event_mata_kuliah.length === 0 ? (
                        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                            Belum ada mata kuliah pada event ini.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {event.event_mata_kuliah.map((emk) => (
                                <Badge key={emk.id} variant="secondary" className="px-3 py-1.5">
                                    {emk.mata_kuliah.nama} - {emk.kelas.nama}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                            <UserCheck className="h-4 w-4" /> Asisten Terpilih
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
                                    placeholder="Cari mata kuliah, kelas, nama, NIM..."
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={sorting[0] ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : 'mata_kuliah:asc'}
                                onValueChange={(value) => {
                                    const [id, direction] = value.split(':');
                                    setSorting([{ id, desc: direction === 'desc' }]);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                            >
                                <SelectTrigger className="w-full md:w-[220px]">
                                    <SelectValue placeholder="Urutkan data" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mata_kuliah:asc">Mata kuliah A-Z</SelectItem>
                                    <SelectItem value="mata_kuliah:desc">Mata kuliah Z-A</SelectItem>
                                    <SelectItem value="nama_asisten:asc">Asisten A-Z</SelectItem>
                                    <SelectItem value="nama_asisten:desc">Asisten Z-A</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" /> {filteredAndSortedAssistants.length} asisten
                            </Badge>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={currentPageData}
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
