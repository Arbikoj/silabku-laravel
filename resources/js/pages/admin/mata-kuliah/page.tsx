import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { cn, PASTEL_PALETTE } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2, BookMarked } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '#' }, { title: 'Mata Kuliah', href: '/admin/mata-kuliah' }];

interface MataKuliah { id: number; kode: string; nama: string; sks: number; nilai_minimum: string | null; color: string | null; kelas: any[]; }

function MKModal({ open, onClose, onSaved, initial }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: MataKuliah;
}) {
    const [form, setForm] = useState({ kode: '', nama: '', sks: 2, nilai_minimum: '', color: PASTEL_PALETTE[0] });

    useEffect(() => {
        if (initial) setForm({ kode: initial.kode, nama: initial.nama, sks: initial.sks, nilai_minimum: initial.nilai_minimum || '', color: initial.color || PASTEL_PALETTE[0] });
        else setForm({ kode: '', nama: '', sks: 2, nilai_minimum: '', color: PASTEL_PALETTE[0] });
    }, [initial, open]);

    const submit = async () => {
        try {
            if (initial) await api.put(`/mata-kuliah/${initial.id}`, form);
            else await api.post('/mata-kuliah', form);
            toast.success('Mata kuliah berhasil disimpan');
            onSaved(); onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{initial ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <Label>Kode</Label>
                            <Input value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))} placeholder="MK001" />
                        </div>
                        <div className="grid gap-1">
                            <Label>SKS</Label>
                            <Input type="number" min={1} max={6} value={form.sks} onChange={e => setForm(f => ({ ...f, sks: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <Label>Nama Mata Kuliah</Label>
                        <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Algoritma dan Pemrograman" />
                    </div>
                    <div className="grid gap-1">
                        <Label>Nilai Minimum Syarat Mata Kuliah</Label>
                        <Select value={(!form.nilai_minimum) ? "none" : form.nilai_minimum} onValueChange={v => setForm(f => ({ ...f, nilai_minimum: v === 'none' ? '' : v }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih syarat nilai..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tidak ada syarat</SelectItem>
                                {['A', 'AB', 'B', 'BC', 'C', 'D', 'E'].map(grade => (
                                    <SelectItem key={grade} value={grade}>Minimal {grade}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label>Warna Identitas (untuk Jadwal)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {PASTEL_PALETTE.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                                        form.color === c ? "border-primary shadow-sm" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setForm(f => ({ ...f, color: c }))}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            <input type="color" className="p-0.5 h-9 w-12 rounded border cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                            <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder={PASTEL_PALETTE[0]} className="flex-1 font-mono" />
                        </div>
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

export default function MataKuliahPage() {
    const [data, setData] = useState<MataKuliah[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<MataKuliah | undefined>();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetch = () => {
        setLoading(true);
        api.get('/mata-kuliah', { params: { search, page, per_page: 15 } })
            .then(r => { setData(r.data.data); setTotal(r.data.meta.total); })
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetch(); }, [search, page]);

    const handleDelete = async (mk: MataKuliah) => {
        if (!confirm(`Hapus mata kuliah "${mk.nama}"?`)) return;
        await api.delete(`/mata-kuliah/${mk.id}`);
        toast.success('Mata kuliah dihapus'); fetch();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mata Kuliah" />
            <MKModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetch} initial={editData} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2"><BookMarked className="h-5 w-5" /> Mata Kuliah</h1>
                    <div className="flex gap-2">
                        <Input placeholder="Cari kode / nama..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-56" />
                        <Button onClick={() => { setEditData(undefined); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
                    </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left">Kode</th>
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-left">SKS</th>
                                <th className="px-4 py-3 text-left">Min. IPK</th>
                                <th className="px-4 py-3 text-left">Kelas</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
                            ) : data.map(mk => (
                                <tr key={mk.id} className="border-t hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono">{mk.kode}</td>
                                    <td className="px-4 py-3 font-medium">{mk.nama}</td>
                                    <td className="px-4 py-3">{mk.sks} SKS</td>
                                    <td className="px-4 py-3">
                                        {mk.nilai_minimum
                                            ? <Badge variant="outline">&ge; {mk.nilai_minimum}</Badge>
                                            : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="px-4 py-3">{mk.kelas?.length ?? 0} kelas</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button size="icon" variant="secondary" onClick={() => { setEditData(mk); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="destructive" onClick={() => handleDelete(mk)}><Trash2 className="h-4 w-4" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada mata kuliah</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <span>Total: {total}</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                        <Button size="sm" variant="outline" disabled={data.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
