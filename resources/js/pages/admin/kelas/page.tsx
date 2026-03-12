import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '#' }, { title: 'Daftar Kelas', href: '/admin/kelas-list' }];

interface Kelas {
    id: number;
    mata_kuliah_id: number;
    nama: string;
    jumlah_mhs: number;
    kuota_asisten: number;
    mata_kuliah: { nama: string; kode: string };
}

interface MataKuliah {
    id: number;
    nama: string;
    kode: string;
}

function KelasModal({ open, onClose, onSaved, initial, mataKuliahList }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: Kelas; mataKuliahList: MataKuliah[];
}) {
    const [form, setForm] = useState({ mata_kuliah_id: '', nama: '', jumlah_mhs: 0 });

    useEffect(() => {
        if (initial) setForm({ mata_kuliah_id: initial.mata_kuliah_id.toString(), nama: initial.nama, jumlah_mhs: initial.jumlah_mhs });
        else setForm({ mata_kuliah_id: '', nama: '', jumlah_mhs: 0 });
    }, [initial, open]);

    const submit = async () => {
        try {
            if (initial) await api.put(`/kelas/${initial.id}`, form);
            else await api.post('/kelas', form);
            toast.success('Kelas berhasil disimpan');
            onSaved(); onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{initial ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Mata Kuliah</Label>
                        <Select value={form.mata_kuliah_id} onValueChange={v => setForm(f => ({ ...f, mata_kuliah_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Pilih Mata Kuliah" /></SelectTrigger>
                            <SelectContent>
                                {mataKuliahList.map(mk => (
                                    <SelectItem key={mk.id} value={mk.id.toString()}>{mk.kode} - {mk.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label>Nama Kelas</Label>
                        <Select value={form.nama} onValueChange={v => setForm(f => ({ ...f, nama: v }))}>
                            <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="R">R</SelectItem>
                                <SelectItem value="RA">RA</SelectItem>
                                <SelectItem value="RB">RB</SelectItem>
                                <SelectItem value="RC">RC</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label>Jumlah Mahasiswa</Label>
                        <Input type="number" value={form.jumlah_mhs} onChange={e => setForm(f => ({ ...f, jumlah_mhs: Number(e.target.value) }))} />
                        <p className="text-xs text-muted-foreground mt-1">
                            Kuota asisten: {Math.ceil(form.jumlah_mhs / 8)} (1 asisten per 8 mhs)
                        </p>
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

export default function KelasAdminPage() {
    const [data, setData] = useState<Kelas[]>([]);
    const [mkList, setMkList] = useState<MataKuliah[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<Kelas | undefined>();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetch = () => {
        setLoading(true);
        api.get('/kelas', { params: { search, page, per_page: 15 } })
            .then(r => { setData(r.data.data); setTotal(r.data.meta.total); })
            .finally(() => setLoading(false));
    };

    const fetchMK = () => {
        api.get('/mata-kuliah/all').then(r => setMkList(r.data));
    };

    useEffect(() => { fetch(); fetchMK(); }, [search, page]);

    const handleDelete = async (k: Kelas) => {
        if (!confirm(`Hapus kelas "${k.nama}" - ${k.mata_kuliah.nama}?`)) return;
        await api.delete(`/kelas/${k.id}`);
        toast.success('Kelas dihapus'); fetch();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Kelas" />
            <KelasModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetch} initial={editData} mataKuliahList={mkList} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2"><School className="h-5 w-5" /> Kelola Kelas</h1>
                    <div className="flex gap-2">
                        <Input placeholder="Cari kelas / matkul..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-56" />
                        <Button onClick={() => { setEditData(undefined); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
                    </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left">Mata Kuliah</th>
                                <th className="px-4 py-3 text-left">Kelas</th>
                                <th className="px-4 py-3 text-center">Jml Mhs</th>
                                <th className="px-4 py-3 text-center">Kuota Asisten</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
                            ) : data.map(k => (
                                <tr key={k.id} className="border-t hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{k.mata_kuliah.nama}</div>
                                        <div className="text-xs text-muted-foreground">{k.mata_kuliah.kode}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{k.nama}</td>
                                    <td className="px-4 py-3 text-center">{k.jumlah_mhs}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="outline">{k.kuota_asisten} Orang</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button size="icon" variant="secondary" onClick={() => { setEditData(k); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="destructive" onClick={() => handleDelete(k)}><Trash2 className="h-4 w-4" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada kelas</td></tr>}
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
