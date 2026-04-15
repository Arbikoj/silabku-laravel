import { CenteredSpinner } from '@/components/centered-spinner';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '#' }, { title: 'Laboratorium', href: '/admin/laboratorium' }];

interface Laboratorium { id: number; name: string; bio: string | null; }

function LabModal({ open, onClose, onSaved, initial }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: Laboratorium;
}) {
    const [form, setForm] = useState({ name: '', bio: '' });

    useEffect(() => {
        if (initial) setForm({ name: initial.name, bio: initial.bio || '' });
        else setForm({ name: '', bio: '' });
    }, [initial, open]);

    const submit = async () => {
        try {
            if (initial) await api.put(`/laboratorium/${initial.id}`, form);
            else await api.post('/laboratorium', form);
            toast.success('Laboratorium berhasil disimpan');
            onSaved(); onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{initial ? 'Edit Laboratorium' : 'Tambah Laboratorium'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Nama Laboratorium</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lab Komputer 1" />
                    </div>
                    <div className="grid gap-1">
                        <Label>Keterangan / Bio</Label>
                        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Keterangan mengenai laboratorium..." rows={4} />
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

export default function LaboratoriumPage() {
    const [data, setData] = useState<Laboratorium[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<Laboratorium | undefined>();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetch = () => {
        setLoading(true);
        api.get('/laboratorium', { params: { search, page, per_page: 15 } })
            .then(r => { setData(r.data.data); setTotal(r.data.meta.total); })
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetch(); }, [search, page]);

    const handleDelete = async (lab: Laboratorium) => {
        if (!confirm(`Hapus laboratorium "${lab.name}"?`)) return;
        try {
            await api.delete(`/laboratorium/${lab.id}`);
            toast.success('Laboratorium dihapus'); fetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menghapus');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laboratorium" />
            <LabModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetch} initial={editData} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Kelola Laboratorium</h1>
                    <div className="flex gap-2">
                        <Input placeholder="Cari laboratorium..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-56" />
                        <Button onClick={() => { setEditData(undefined); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
                    </div>
                </div>
                <div className="rounded-lg border overflow-hidden bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left w-1/4">Nama</th>
                                <th className="px-4 py-3 text-left">Bio / Keterangan</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8">
                                        <CenteredSpinner className="py-4" iconClassName="h-6 w-6" />
                                    </td>
                                </tr>
                            ) : data.map(lab => (
                                <tr key={lab.id} className="border-t hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{lab.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground line-clamp-2 max-w-md">{lab.bio || '—'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button size="icon" variant="secondary" onClick={() => { setEditData(lab); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="destructive" onClick={() => handleDelete(lab)}><Trash2 className="h-4 w-4" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Belum ada laboratorium</td></tr>}
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
