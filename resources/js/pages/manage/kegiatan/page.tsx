import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Calendar, Trash2, Edit2, Info, Search, Building2, Clock, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Jadwal', href: '/jadwal' },
    { title: 'Kelola Kegiatan', href: '/kelola-kegiatan' }
];

interface Laboratorium {
    id: number;
    name: string;
}

interface Kegiatan {
    id: number;
    nama_kegiatan: string;
    tanggal: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    laboratorium_id: number | null;
    laboratorium?: Laboratorium | null;
    keterangan?: string | null;
}

const DEFAULT_FORM = {
    nama_kegiatan: '',
    tanggal: '',
    jam_mulai: '08:00',
    jam_selesai: '10:00',
    laboratorium_id: 'null', // string 'null' for select
    keterangan: ''
};

export default function KegiatanManagePage() {
    const { auth } = usePage<{ auth: any }>().props;
    const [kegiatans, setKegiatans] = useState<Kegiatan[]>([]);
    const [labs, setLabs] = useState<Laboratorium[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLab, setFilterLab] = useState('all');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<Kegiatan | null>(null);
    const [form, setForm] = useState(DEFAULT_FORM);

    const fetchKegiatans = () => {
        setLoading(true);
        api.get('/kegiatan')
            .then(r => setKegiatans(r.data))
            .catch(e => toast.error('Gagal memuat data kegiatan'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchKegiatans();
        api.get('/laboratorium/all')
            .then(r => setLabs(r.data))
            .catch(e => console.error('Gagal memuat data lab', e));
    }, []);

    useEffect(() => {
        if (modalOpen) {
            if (editData) {
                setForm({
                    nama_kegiatan: editData.nama_kegiatan,
                    tanggal: editData.tanggal,
                    jam_mulai: editData.jam_mulai.slice(0, 5),
                    jam_selesai: editData.jam_selesai.slice(0, 5),
                    laboratorium_id: editData.laboratorium_id ? String(editData.laboratorium_id) : 'null',
                    keterangan: editData.keterangan || ''
                });
            } else {
                setForm(DEFAULT_FORM);
            }
        }
    }, [editData, modalOpen]);

    const getIndonesianDay = (dateStr: string) => {
        if (!dateStr) return '';
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const date = new Date(dateStr);
        return days[date.getDay()];
    };

    const handleSave = async () => {
        if (!form.nama_kegiatan || !form.tanggal || !form.jam_mulai || !form.jam_selesai) {
            toast.error('Mohon lengkapi kolom yang wajib diisi.');
            return;
        }

        const payload = {
            ...form,
            laboratorium_id: form.laboratorium_id === 'null' ? null : Number(form.laboratorium_id)
        };

        try {
            if (editData) {
                await api.put(`/kegiatan/${editData.id}`, payload);
                toast.success('Kegiatan berhasil diperbarui');
            } else {
                await api.post('/kegiatan', payload);
                toast.success('Kegiatan berhasil ditambahkan');
            }
            fetchKegiatans();
            setModalOpen(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan kegiatan.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;

        try {
            await api.delete(`/kegiatan/${id}`);
            toast.success('Kegiatan berhasil dihapus');
            fetchKegiatans();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menghapus kegiatan.');
        }
    };

    const filteredKegiatans = kegiatans.filter(k => {
        const matchesSearch = k.nama_kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (k.keterangan && k.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesLab = filterLab === 'all' || 
            (filterLab === 'null' && k.laboratorium_id === null) || 
            (k.laboratorium_id !== null && String(k.laboratorium_id) === filterLab);

        return matchesSearch && matchesLab;
    });

    const formatDateIndo = (dateStr: string) => {
        if (!dateStr) return '';
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const date = new Date(dateStr);
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Kegiatan" />

            <div className="p-6 flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Kelola Kegiatan</h1>
                            <p className="text-sm text-muted-foreground">Kelola kegiatan di luar jadwal praktikum rutin</p>
                        </div>
                    </div>

                    <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="rounded-lg shadow-sm">
                        <Plus className="w-4 h-4 mr-1.5" /> Tambah Kegiatan
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 bg-muted/40 p-3 rounded-xl border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama kegiatan atau keterangan..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-none shadow-none ring-1 ring-border/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:inline">Filter Lab</span>
                        <Select value={filterLab} onValueChange={setFilterLab}>
                            <SelectTrigger className="w-[200px] bg-background border-none shadow-none ring-1 ring-border/50">
                                <SelectValue placeholder="Pilih Laboratorium" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Ruangan</SelectItem>
                                <SelectItem value="null">Tanpa Laboratorium (Lainnya)</SelectItem>
                                {labs.map(l => (
                                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Table */}
                <div className="relative border rounded-lg bg-card shadow-sm overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium">Memuat data...</span>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                                    <th className="p-4 font-semibold">Nama Kegiatan</th>
                                    <th className="p-4 font-semibold">Tanggal & Hari</th>
                                    <th className="p-4 font-semibold">Waktu</th>
                                    <th className="p-4 font-semibold">Laboratorium</th>
                                    <th className="p-4 font-semibold">Keterangan</th>
                                    <th className="p-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKegiatans.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <Calendar className="w-12 h-12 text-muted-foreground/30" />
                                                <div className="font-semibold text-base text-foreground">Tidak Ada Kegiatan</div>
                                                <p className="text-xs max-w-xs leading-relaxed text-muted-foreground">
                                                    Belum ada kegiatan terdaftar yang cocok dengan filter pencarian Anda.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredKegiatans.map(k => (
                                        <tr key={k.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-semibold text-foreground align-top">
                                                {k.nama_kegiatan}
                                            </td>
                                            <td className="p-4 align-top text-muted-foreground">
                                                <div className="font-medium text-foreground">{k.hari}</div>
                                                <div className="text-xs">{formatDateIndo(k.tanggal)}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                                    <span className="font-medium text-foreground">
                                                        {k.jam_mulai.slice(0, 5)} - {k.jam_selesai.slice(0, 5)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {k.laboratorium ? (
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                                                        <Building2 className="w-3 h-3 shrink-0" />
                                                        {k.laboratorium.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-muted-foreground">
                                                        Luar Laboratorium
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top max-w-[250px] truncate text-muted-foreground">
                                                {k.keterangan || '-'}
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { setEditData(k); setModalOpen(true); }}
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(k.id)}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editData ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Nama Kegiatan */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="nama_kegiatan">Nama Kegiatan <span className="text-destructive">*</span></Label>
                            <Input
                                id="nama_kegiatan"
                                value={form.nama_kegiatan}
                                onChange={e => setForm(f => ({ ...f, nama_kegiatan: e.target.value }))}
                                placeholder="Contoh: Penelitian Dosen, Ujian Susulan"
                                required
                            />
                        </div>

                        {/* Tanggal & Hari */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tanggal">Tanggal <span className="text-destructive">*</span></Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={form.tanggal}
                                    onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Hari</Label>
                                <div className="h-9 flex items-center px-3 border rounded-md bg-muted/50 text-sm font-medium text-muted-foreground">
                                    {getIndonesianDay(form.tanggal) || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Jam Mulai & Selesai */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="jam_mulai">Jam Mulai <span className="text-destructive">*</span></Label>
                                <Input
                                    id="jam_mulai"
                                    type="time"
                                    value={form.jam_mulai}
                                    onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="jam_selesai">Jam Selesai <span className="text-destructive">*</span></Label>
                                <Input
                                    id="jam_selesai"
                                    type="time"
                                    value={form.jam_selesai}
                                    onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Laboratorium */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="laboratorium_id">Laboratorium / Ruangan</Label>
                            <Select
                                value={form.laboratorium_id}
                                onValueChange={v => setForm(f => ({ ...f, laboratorium_id: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Laboratorium" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Tanpa Laboratorium (Luar Lab / Umum)</SelectItem>
                                    {labs.map(l => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Keterangan */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                            <Textarea
                                id="keterangan"
                                value={form.keterangan}
                                onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                                placeholder="Tulis rincian atau keterangan tambahan..."
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSave}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
