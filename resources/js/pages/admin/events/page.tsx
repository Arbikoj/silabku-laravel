import { CenteredSpinner } from '@/components/centered-spinner';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Calendar, Eye, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '#' }, { title: 'Event Oprec', href: '/admin/events' }];

interface Event {
    id: number;
    nama: string;
    tipe: string;
    semester_id: number;
    is_open: boolean;
    tanggal_buka: string;
    tanggal_tutup: string;
    deskripsi: string;
    semester: { nama: string };
}

interface Semester { id: number; nama: string; }

function EventModal({ open, onClose, onSaved, initial, semesters }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: Event; semesters: Semester[];
}) {
    const [form, setForm] = useState({
        nama: '', tipe: 'praktikum', semester_id: '', is_open: false,
        tanggal_buka: '', tanggal_tutup: '', deskripsi: ''
    });

    useEffect(() => {
        if (initial) setForm({
            nama: initial.nama, tipe: initial.tipe, semester_id: initial.semester_id.toString(),
            is_open: initial.is_open, 
            tanggal_buka: initial.tanggal_buka ? initial.tanggal_buka.split('T')[0] : '',
            tanggal_tutup: initial.tanggal_tutup ? initial.tanggal_tutup.split('T')[0] : '', 
            deskripsi: initial.deskripsi ?? ''
        });
        else setForm({
            nama: '', tipe: 'praktikum', semester_id: '', is_open: false,
            tanggal_buka: '', tanggal_tutup: '', deskripsi: ''
        });
    }, [initial, open]);

    const submit = async () => {
        try {
            const data = { ...form, is_open: !!form.is_open };
            if (initial) await api.put(`/events/${initial.id}`, data);
            else await api.post('/events', data);
            toast.success('Event berhasil disimpan');
            onSaved(); onClose();
        } catch (e: unknown) {
            const err = e as any;
            toast.error(err.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit Event' : 'Tambah Event'}</DialogTitle>
                    <DialogDescription>Isi detail event rekrutmen asisten di bawah ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Nama Event</Label>
                        <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Asisten Praktikum Gasal 2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <Label>Tipe</Label>
                            <Select value={form.tipe} onValueChange={v => setForm(f => ({ ...f, tipe: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="praktikum">Praktikum</SelectItem>
                                    <SelectItem value="tutorial">Tutorial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label>Semester</Label>
                            <Select value={form.semester_id} onValueChange={v => setForm(f => ({ ...f, semester_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                <SelectContent>
                                    {semesters.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <Label>Tgl Buka</Label>
                            <Input type="date" value={form.tanggal_buka} onChange={e => setForm(f => ({ ...f, tanggal_buka: e.target.value }))} />
                        </div>
                        <div className="grid gap-1">
                            <Label>Tgl Tutup</Label>
                            <Input type="date" value={form.tanggal_tutup} onChange={e => setForm(f => ({ ...f, tanggal_tutup: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <Label>Deskripsi</Label>
                        <Textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} rows={3} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_open_ev" checked={form.is_open} onChange={e => setForm(f => ({ ...f, is_open: e.target.checked }))} />
                        <Label htmlFor="is_open_ev">Buka Pendaftaran Sekarang</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button onClick={submit}>Simpan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EventAdminPage() {
    const [data, setData] = useState<Event[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<Event | undefined>();

    const fetch = () => {
        setLoading(true);
        api.get('/events').then(r => setData(r.data.data)).finally(() => setLoading(false));
    };

    const fetchSemesters = () => {
        api.get('/semesters', { params: { per_page: 50 } }).then(r => setSemesters(r.data.data));
    };

    useEffect(() => { fetch(); fetchSemesters(); }, []);

    const handleDelete = async (e: Event) => {
        if (!confirm(`Hapus event "${e.nama}"?`)) return;
        await api.delete(`/events/${e.id}`);
        toast.success('Event dihapus'); fetch();
    };

    const toggleOpen = async (e: Event) => {
        await api.post(`/events/${e.id}/toggle-open`);
        toast.success('Status event diperbarui'); fetch();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Event Oprec" />
            <EventModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetch} initial={editData} semesters={semesters} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" /> Recruitment Events</h1>
                    <Button onClick={() => { setEditData(undefined); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Buat Event</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? <div className="col-span-full"><CenteredSpinner className="py-20" /></div> : data.map(ev => (
                        <div key={ev.id} className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant={ev.is_open ? 'default' : 'secondary'}>{ev.is_open ? 'OPEN' : 'CLOSED'}</Badge>
                                <Badge variant="outline" className="capitalize">{ev.tipe}</Badge>
                            </div>
                            <h3 className="font-bold text-lg leading-tight mb-1">{ev.nama}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{ev.semester.nama}</p>
                            <div className="text-xs text-muted-foreground flex flex-col gap-1 mb-4">
                                <span>Buka: {ev.tanggal_buka || '-'}</span>
                                <span>Tutup: {ev.tanggal_tutup || '-'}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/admin/events/${ev.id}`}><Eye className="h-3 w-3 mr-1" /> Detail</Link></Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditData(ev); setModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant={ev.is_open ? 'destructive' : 'default'} onClick={() => toggleOpen(ev)} title={ev.is_open ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}>
                                    <Power className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(ev)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    ))}
                    {!loading && data.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">Belum ada event pendaftaran</div>}
                </div>
            </div>
        </AppLayout>
    );
}
