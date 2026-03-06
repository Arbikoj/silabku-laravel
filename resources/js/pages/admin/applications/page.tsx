import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Check, X, Search, User, Info } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Seleksi Asisten', href: '/seleksi' }];

interface Semester { id: number; nama: string; }
interface Event { id: number; nama: string; tipe: string; semester_id: number; is_open: boolean; tanggal_buka: string; tanggal_tutup: string; deskripsi: string; semester: Semester; }

interface Application {
    id: number;
    status: string;
    catatan: string;
    user: { name: string; nim: string; profile: { nama_lengkap: string; no_wa: string; nilai_ipk: number; foto: string } };
    event: { nama: string };
    application_mata_kuliah: { 
        id: number;
        status: string;
        catatan: string;
        event_mata_kuliah: { mata_kuliah: { nama: string }; kelas: { nama: string } } 
    }[];
}

export default function ApplicationSelectionPage() {
    const [data, setData] = useState<Application[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ event_id: '', status: '', search: '' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [reviewModal, setReviewModal] = useState<{ open: boolean; type: 'approve' | 'reject'; notes: string }>({ open: false, type: 'approve', notes: '' });

    const fetch = useCallback(() => {
        setLoading(true);
        api.get('/applications', { params: { ...filters, page, per_page: 20 } })
            .then(r => { setData(r.data.data); setTotal(r.data.meta.total); })
            .finally(() => setLoading(false));
    }, [filters, page]);

    useEffect(() => {
        fetch();
        api.get('/events').then(r => setEvents(r.data.data));
    }, [fetch]);

    const handleReviewChoice = async (choiceId: number, type: 'approve' | 'reject') => {
        try {
            const url = `/applications/choices/${choiceId}/${type}`;
            await api.post(url, { catatan: reviewModal.notes });
            toast.success(`Pilihan ${type === 'approve' ? 'disetujui' : 'ditolak'}`);
            
            // Refresh local data to show updated status in modal
            if (selectedApp) {
                const updatedMK = selectedApp.application_mata_kuliah.map(amk => 
                    amk.id === choiceId ? { ...amk, status: type === 'approve' ? 'approved' : 'rejected' } : amk
                );
                setSelectedApp({ ...selectedApp, application_mata_kuliah: updatedMK });
            }
            
            fetch();
        } catch {
            toast.error('Gagal memproses');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Seleksi Asisten" />

            <Dialog open={!!(selectedApp && reviewModal.open)} onOpenChange={o => { if(!o) setSelectedApp(null); setReviewModal(m => ({ ...m, open: o })); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail & Seleksi Aplikasi</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border text-primary">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-lg font-bold">{selectedApp?.user.profile?.nama_lengkap || selectedApp?.user.name}</div>
                                <div className="text-muted-foreground">NIM: {selectedApp?.user.nim} | IPK: {selectedApp?.user.profile?.nilai_ipk || '-'}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Pilihan Mata Kuliah & Kelas</Label>
                            {selectedApp?.application_mata_kuliah.map(amk => (
                                <div key={amk.id} className="flex items-center justify-between border p-3 rounded-lg bg-card">
                                    <div>
                                        <div className="font-semibold">{amk.event_mata_kuliah.mata_kuliah.nama}</div>
                                        <div className="text-xs text-muted-foreground">Kelas {amk.event_mata_kuliah.kelas.nama}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {amk.status !== 'pending' ? (
                                            <Badge variant={amk.status === 'approved' ? 'default' : 'destructive'} className="capitalize">
                                                {amk.status}
                                            </Badge>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleReviewChoice(amk.id, 'approve')}>
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 px-2 text-destructive border-red-200 hover:bg-red-50" onClick={() => handleReviewChoice(amk.id, 'reject')}>
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-1 border-t pt-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Catatan Global / Instruksi</Label>
                            <Textarea value={reviewModal.notes} onChange={e => setReviewModal(m => ({ ...m, notes: e.target.value }))} placeholder="Berikan catatan tambahan jika perlu..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReviewModal(m => ({ ...m, open: false }))}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <div className="grid gap-1">
                            <Label className="text-xs">Event</Label>
                            <Select value={filters.event_id} onValueChange={v => setFilters(f => ({ ...f, event_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Semua Event" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Event</SelectItem>
                                    {events.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs">Status</Label>
                            <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                                <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs">Cari Mahasiswa</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Nama / NIM..." className="pl-9" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left">Mahasiswa</th>
                                <th className="px-4 py-3 text-left">Event</th>
                                <th className="px-4 py-3 text-left">Pilihan Matkul</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">Memuat data...</td></tr>
                            ) : data.map(app => (
                                <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border text-primary">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{app.user.profile?.nama_lengkap || app.user.name}</div>
                                                <div className="text-xs text-muted-foreground">NIM: {app.user.nim} | IPK: {app.user.profile?.nilai_ipk || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{app.event.nama}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {app.application_mata_kuliah.map((amk, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] py-0">
                                                    {amk.event_mata_kuliah.mata_kuliah.nama} ({amk.event_mata_kuliah.kelas.nama})
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                            {app.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => { setSelectedApp(app); setReviewModal({ open: true, type: 'approve', notes: app.catatan || '' }); }}>
                                            <Info className="h-4 w-4 mr-1" /> Kelola / Detail
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && (
                                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">Tidak ada pendaftaran yang ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                    <div>Menampilkan {data.length} dari {total} pendaftar</div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" className="h-8" disabled={data.length < 20} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
