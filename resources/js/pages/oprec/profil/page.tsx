import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { User, Phone, CreditCard, Banknote, Image as ImageIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profil Asisten', href: '/profil' }];

export default function AssistantProfilePage() {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        nama_lengkap: '', no_wa: '', norek: '', nama_rek: '', bank: '', nilai_ipk: 0
    });

    useEffect(() => {
        if (auth.user?.profile) {
            const p = auth.user.profile;
            setProfile(p);
            setForm({
                nama_lengkap: p.nama_lengkap || '',
                no_wa: p.no_wa || '',
                norek: p.norek || '',
                nama_rek: p.nama_rek || '',
                bank: p.bank || '',
                nilai_ipk: p.nilai_ipk || 0
            });
            setLoading(false);
        } else {
            api.get('/profile').then(r => {
                setProfile(r.data);
                setForm({
                    nama_lengkap: r.data.nama_lengkap || '',
                    no_wa: r.data.no_wa || '',
                    norek: r.data.norek || '',
                    nama_rek: r.data.nama_rek || '',
                    bank: r.data.bank || '',
                    nilai_ipk: r.data.nilai_ipk || 0
                });
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [auth.user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/profile', form);
            toast.success('Profil berhasil diperbarui');
        } catch {
            toast.error('Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AppLayout breadcrumbs={breadcrumbs}><div className="p-10 text-center font-medium animate-pulse">Memuat Profil...</div></AppLayout>;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profil Asisten" />
            <div className="p-5 max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Profil Saya</h1>
                        <p className="text-muted-foreground text-sm">Lengkapi data diri dan perbankan untuk verifikasi pendaftaran asisten.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 shadow-sm h-fit">
                        <CardHeader className="pb-4 items-center gap-4 border-b">
                            <div className="h-24 w-24 rounded-full bg-primary/5 border-2 border-primary/20 flex items-center justify-center overflow-hidden relative group">
                                {profile?.foto ? (
                                    <img src={profile.foto} alt="Foto Profil" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-primary/40" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                                    <ImageIcon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="text-center">
                                <CardTitle className="text-lg">{auth.user?.name}</CardTitle>
                                <CardDescription className="font-mono">{auth.user?.nim}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Email</Label>
                                <p className="text-sm font-medium">{auth.user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">IPK Terakhir</Label>
                                <Input type="number" step="0.01" value={form.nilai_ipk} onChange={e => setForm(f => ({ ...f, nilai_ipk: Number(e.target.value) }))} className="h-8" />
                                <p className="text-[10px] text-muted-foreground font-italic">* Pastikan input IPK sesuai KHS terbaru</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/50 py-4">
                                <CardTitle className="text-md flex items-center gap-2 font-semibold">
                                    <User className="h-4 w-4" /> Data Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid gap-1">
                                    <Label>Nama Lengkap (Sesuai KTP/Ijazah)</Label>
                                    <Input value={form.nama_lengkap} onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))} required />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Nomor WhatsApp</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input value={form.no_wa} onChange={e => setForm(f => ({ ...f, no_wa: e.target.value }))} className="pl-9" placeholder="0812xxxxxx" required />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/50 py-4">
                                <CardTitle className="text-md flex items-center gap-2 font-semibold">
                                    <CreditCard className="h-4 w-4" /> Informasi Rekening Pembayaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-1">
                                    <Label>Nama Pemilik Rekening</Label>
                                    <Input value={form.nama_rek} onChange={e => setForm(f => ({ ...f, nama_rek: e.target.value }))} required />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Nama Bank</Label>
                                    <Input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} placeholder="BCA / Mandiri / BNI" required />
                                </div>
                                <div className="grid gap-1 md:col-span-2">
                                    <Label>Nomor Rekening</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input value={form.norek} onChange={e => setForm(f => ({ ...f, norek: e.target.value }))} className="pl-9" required />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" size="lg" disabled={saving} className="px-10">
                                {saving ? 'Menyimpan...' : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
