import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentViewerDialog } from '@/components/document-viewer-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Banknote, CreditCard, ExternalLink, FileText, Image as ImageIcon, Phone, Save, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profil Asisten', href: '/profil' }];

interface AuthProfile {
    foto?: string | null;
    nama_lengkap?: string | null;
    no_wa?: string | null;
    norek?: string | null;
    nama_rek?: string | null;
    bank?: string | null;
    nilai_ipk?: number | null;
    transkrip_gd_id?: string | null;
    ktm_gd_id?: string | null;
}

interface AuthUser {
    name?: string;
    nim?: string;
    email?: string;
    profile?: AuthProfile | null;
}

export default function AssistantProfilePage() {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        nama_lengkap: '',
        no_wa: '',
        norek: '',
        nama_rek: '',
        bank: '',
        nilai_ipk: 0,
    });
    const [transkripFile, setTranskripFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [ktmFile, setKtmFile] = useState<File | null>(null);
    const ktmInputRef = useRef<HTMLInputElement>(null);

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
                nilai_ipk: p.nilai_ipk || 0,
            });
            setLoading(false);
        } else {
            api.get('/profile')
                .then((r) => {
                    setProfile(r.data);
                    setForm({
                        nama_lengkap: r.data.nama_lengkap || '',
                        no_wa: r.data.no_wa || '',
                        norek: r.data.norek || '',
                        nama_rek: r.data.nama_rek || '',
                        bank: r.data.bank || '',
                        nilai_ipk: r.data.nilai_ipk || 0,
                    });
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [auth.user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
            if (transkripFile) {
                formData.append('transkrip', transkripFile);
            }
            if (ktmFile) {
                formData.append('ktm', ktmFile);
            }

            await api.post('/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Profil berhasil diperbarui');

            // Reload profile data to get updated transkrip gd id
            const r = await api.get('/profile');
            setProfile(r.data.profile || r.data);
            setTranskripFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setKtmFile(null);
            if (ktmInputRef.current) ktmInputRef.current.value = '';
        } catch {
            toast.error('Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="animate-pulse p-10 text-center font-medium">Memuat Profil...</div>
            </AppLayout>
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profil Asisten" />
            <div className="p-5">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Profil Saya</h1>
                        <p className="text-muted-foreground text-sm">Lengkapi data diri dan perbankan untuk verifikasi pendaftaran asisten.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="h-fit shadow-sm md:col-span-1">
                        <CardHeader className="items-center gap-4 border-b pb-4">
                            <div className="bg-primary/5 border-primary/20 group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2">
                                {profile?.foto ? (
                                    <img src={profile.foto} alt="Foto Profil" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="text-primary/40 h-12 w-12" />
                                )}
                                <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <ImageIcon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="text-center">
                                <CardTitle className="text-lg">{auth.user?.name}</CardTitle>
                                <CardDescription className="font-mono">{auth.user?.nim}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs font-semibold uppercase">Email</Label>
                                <p className="text-sm font-medium">{auth.user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs font-semibold uppercase">IPK Terakhir</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.nilai_ipk}
                                    onChange={(e) => setForm((f) => ({ ...f, nilai_ipk: Number(e.target.value) }))}
                                    className="h-8"
                                />
                                <p className="text-muted-foreground font-italic text-[10px]">* Pastikan input IPK sesuai KHS terbaru</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 md:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/50 py-4">
                                <CardTitle className="text-md flex items-center gap-2 font-semibold">
                                    <User className="h-4 w-4" /> Data Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid gap-1">
                                    <Label>Nama Lengkap (Sesuai KTP/Ijazah)</Label>
                                    <Input
                                        value={form.nama_lengkap}
                                        onChange={(e) => setForm((f) => ({ ...f, nama_lengkap: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Nomor WhatsApp</Label>
                                    <div className="relative">
                                        <Phone className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                        <Input
                                            value={form.no_wa}
                                            onChange={(e) => setForm((f) => ({ ...f, no_wa: e.target.value }))}
                                            className="pl-9"
                                            placeholder="0812xxxxxx"
                                            required
                                        />
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
                            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                                <div className="grid gap-1">
                                    <Label>Nama Pemilik Rekening</Label>
                                    <Input value={form.nama_rek} onChange={(e) => setForm((f) => ({ ...f, nama_rek: e.target.value }))} required />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Nama Bank</Label>
                                    <Input
                                        value={form.bank}
                                        onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
                                        placeholder="BCA / Mandiri / BNI"
                                        required
                                    />
                                </div>
                                <div className="grid gap-1 md:col-span-2">
                                    <Label>Nomor Rekening</Label>
                                    <div className="relative">
                                        <Banknote className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                        <Input
                                            value={form.norek}
                                            onChange={(e) => setForm((f) => ({ ...f, norek: e.target.value }))}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/50 py-4">
                                <CardTitle className="text-md flex items-center gap-2 font-semibold">
                                    <FileText className="h-4 w-4" /> Berkas Pendaftaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid gap-1">
                                    <Label>Transkrip Nilai Terakhir (PDF)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="application/pdf"
                                            ref={fileInputRef}
                                            onChange={(e) => setTranskripFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        {profile?.transkrip_gd_id && !transkripFile && (
                                            <DocumentViewerDialog
                                                title="Transkrip Nilai"
                                                src="/profil/transkrip"
                                                trigger={
                                                    <Button type="button" variant="outline" className="shrink-0 gap-2">
                                                        Lihat <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-[10px] text-red-500 italic">
                                        * Wajib diunggah / diperbarui sesuai semester berjalan. (Maks 5MB)
                                    </p>
                                </div>
                                <div className="grid gap-1 mt-2">
                                    <Label>Kartu Tanda Mahasiswa / KTM (PDF / Gambar)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="application/pdf,image/png,image/jpeg,image/jpg"
                                            ref={ktmInputRef}
                                            onChange={(e) => setKtmFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        {profile?.ktm_gd_id && !ktmFile && (
                                            <DocumentViewerDialog
                                                title="Kartu Tanda Mahasiswa"
                                                src="/profil/ktm"
                                                fileType={profile?.ktm_gd_id?.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image' : 'pdf'}
                                                trigger={
                                                    <Button type="button" variant="outline" className="shrink-0 gap-2">
                                                        Lihat <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-[10px] text-red-500 italic">
                                        * Wajib diunggah (Maks 5MB)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" size="lg" disabled={saving} className="px-10">
                                {saving ? (
                                    'Menyimpan...'
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
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
