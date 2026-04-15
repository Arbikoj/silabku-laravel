import { CenteredSpinner } from '@/components/centered-spinner';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2, CalendarRange } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '#' }, { title: 'Semester', href: '/admin/semesters' }];

interface Semester { id: number; nama: string; tipe: string; tahun: number; is_active: boolean; }

function SemesterModal({ open, onClose, onSaved, initial }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: Semester;
}) {
    const [form, setForm] = useState({ nama: '', tipe: 'gasal', tahun: new Date().getFullYear(), is_active: false });

    useEffect(() => {
        if (initial) setForm({ nama: initial.nama, tipe: initial.tipe, tahun: initial.tahun, is_active: initial.is_active });
        else setForm({ nama: '', tipe: 'gasal', tahun: new Date().getFullYear(), is_active: false });
    }, [initial, open]);

    const submit = async () => {
        try {
            if (initial) await api.put(`/semesters/${initial.id}`, form);
            else await api.post('/semesters', form);
            toast.success('Semester berhasil disimpan');
            onSaved(); onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{initial ? 'Edit Semester' : 'Tambah Semester'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Nama Semester</Label>
                        <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Genap 2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <Label>Tipe</Label>
                            <Select value={form.tipe} onValueChange={v => setForm(f => ({ ...f, tipe: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gasal">Gasal</SelectItem>
                                    <SelectItem value="genap">Genap</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label>Tahun</Label>
                            <Input type="number" value={form.tahun} onChange={e => setForm(f => ({ ...f, tahun: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                        <Label htmlFor="is_active">Semester Aktif</Label>
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

export default function SemesterPage() {
    const [data, setData] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<Semester | undefined>();

    const fetch = () => {
        setLoading(true);
        api.get('/semesters', { params: { per_page: 50 } })
            .then(r => setData(r.data.data))
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetch(); }, []);

    const handleDelete = async (s: Semester) => {
        if (!confirm(`Hapus semester "${s.nama}"?`)) return;
        await api.delete(`/semesters/${s.id}`);
        toast.success('Semester dihapus'); fetch();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semester" />
            <SemesterModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetch} initial={editData} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2"><CalendarRange className="h-5 w-5" /> Kelola Semester</h1>
                    <Button onClick={() => { setEditData(undefined); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
                </div>
                {loading ? <CenteredSpinner className="py-16" /> : (
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Tipe</th>
                                    <th className="px-4 py-3 text-left">Tahun</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(s => (
                                    <tr key={s.id} className="border-t hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{s.nama}</td>
                                        <td className="px-4 py-3 capitalize">{s.tipe}</td>
                                        <td className="px-4 py-3">{s.tahun}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Aktif' : 'Tidak Aktif'}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="icon" variant="secondary" onClick={() => { setEditData(s); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada semester</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
