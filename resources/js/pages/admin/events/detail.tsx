import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Trash2, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MK { id: number; nama: string; kode: string; }
interface KelasOption { id: number; nama: string; mata_kuliah_id: number; mata_kuliah: MK; }
interface EMK { id: number; mata_kuliah_id: number; kelas_id: number; mata_kuliah: MK; kelas: { nama: string }; }
interface ApprovedAssistant {
    id: number;
    mata_kuliah: string;
    kelas: string;
    nama_asisten: string;
    nim: string;
}
interface EventDetail {
    id: number;
    nama: string;
    semester_id: number;
    semester: { nama: string };
    event_mata_kuliah: EMK[];
}

export default function EventDetailPage({ eventId }: { eventId: string }) {
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [assistants, setAssistants] = useState<ApprovedAssistant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<number[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '#' },
        { title: 'Event Oprec', href: '/admin/events' },
        { title: event?.nama ?? 'Detail', href: '#' },
    ];

    const fetch = useCallback(() => {
        setLoading(true);
        api.get(`/events/${eventId}`).then(r => {
            setEvent(r.data.event);
            setAssistants(r.data.approved_assistants);
        }).finally(() => setLoading(false));
    }, [eventId]);

    const fetchAllKelas = useCallback(() => {
        api.get('/kelas', { params: { per_page: 100 } }).then(r => setKelasOptions(r.data.data));
    }, []);

    useEffect(() => { fetch(); fetchAllKelas(); }, [fetch, fetchAllKelas]);

    useEffect(() => {
        if (event) setSelectedKelas(event.event_mata_kuliah.map(x => x.kelas_id));
    }, [event]);

    const toggleKelas = (id: number) => {
        setSelectedKelas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const saveMK = async () => {
        if (!event) return;
        try {
            // Tambahkan yang baru dipilih (jika belum ada)
            const selectedData = kelasOptions
                .filter(k => selectedKelas.includes(k.id))
                .map(k => ({ mata_kuliah_id: k.mata_kuliah_id, kelas_id: k.id }));
            
            // Merge unique? Biasanya put asisten ini replace all
            // Sesuai requirement "tambah lebih simpel", kita append saja atau replace?
            // Biasanya admin ingin "apa yang dicentang itulah yang ada di event"
            
            await api.put(`/events/${eventId}`, {
                ...event,
                semester_id: event.semester_id || (event as any).semester?.id,
                mata_kuliah: selectedData // replace with new selection
            });
            
            toast.success('Daftar mata kuliah diperbarui');
            setModalOpen(false);
            fetch();
        } catch {
            toast.error('Gagal menyimpan');
        }
    };

    const removeMK = async (emkId: number) => {
        if (!confirm('Hapus mata kuliah dari event ini?')) return;
        if (!event) return;
        const newMK = event.event_mata_kuliah
            .filter(x => x.id !== emkId)
            .map(x => ({ mata_kuliah_id: x.mata_kuliah_id, kelas_id: x.kelas_id }));

        await api.put(`/events/${eventId}`, { 
            ...event, 
            semester_id: event.semester_id || (event as any).semester?.id,
            mata_kuliah: newMK 
        });
        toast.success('Dihapus'); fetch();
    };

    if (loading) return <AppLayout breadcrumbs={[]}><div className="p-10 text-center">Memuat...</div></AppLayout>;
    if (!event) return <AppLayout breadcrumbs={[]}><div className="p-10 text-center">Event tidak ditemukan</div></AppLayout>;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.nama} />
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Pilih Mata Kuliah & Kelas</DialogTitle>
                        <DialogDescription>Pilih mata kuliah dan kelas yang akan dibuka pendaftarannya untuk event ini.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto p-1">
                        {kelasOptions.map(k => (
                            <div key={k.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedKelas.includes(k.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`} onClick={() => toggleKelas(k.id)}>
                                <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedKelas.includes(k.id) ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'}`}>
                                    {selectedKelas.includes(k.id) && <Plus className="h-3 w-3" />}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">{k.mata_kuliah.nama}</div>
                                    <div className="text-xs text-muted-foreground">Kelas {k.nama}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                        <Button onClick={saveMK}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="p-5 max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold">{event.nama}</h1>
                    <p className="text-muted-foreground">{event.semester.nama}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="border rounded-xl p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Mata Kuliah</h3>
                                <Button size="icon" variant="ghost" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                {event.event_mata_kuliah.map(emk => (
                                    <div key={emk.id} className="flex items-center justify-between bg-card p-2 rounded-lg border text-sm group">
                                        <div>
                                            <div className="font-medium">{emk.mata_kuliah.nama}</div>
                                            <div className="text-xs text-muted-foreground">Kelas {emk.kelas.nama}</div>
                                        </div>
                                        <button onClick={() => removeMK(emk.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {event.event_mata_kuliah.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Belum ada mata kuliah</p>}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="border rounded-xl overflow-hidden bg-card">
                            <div className="p-4 border-b bg-muted/10 flex items-center gap-2 font-semibold">
                                <UserCheck className="h-4 w-4" /> Asisten Terpilih ({assistants.length})
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">No</th>
                                        <th className="px-4 py-3 text-left">Mata Kuliah</th>
                                        <th className="px-4 py-3 text-left">Kelas</th>
                                        <th className="px-4 py-3 text-left">Nama Asisten</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assistants.map((ast, i) => (
                                        <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-center text-muted-foreground">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium">{ast.mata_kuliah}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">{ast.kelas}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold">{ast.nama_asisten}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-tight">{ast.nim}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {assistants.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                                            <AlertCircle className="h-8 w-8 opacity-20" /> Belum ada asisten yang disetujui di event ini.
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
