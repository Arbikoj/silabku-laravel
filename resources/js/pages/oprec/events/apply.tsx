import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CenteredSpinner } from '@/components/centered-spinner';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Check, Info, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ALL_GRADES = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];
const getValidGrades = (minGrade: string) => {
    if (!minGrade) return ALL_GRADES;
    const index = ALL_GRADES.indexOf(minGrade);
    return index >= 0 ? ALL_GRADES.slice(0, index + 1) : ALL_GRADES;
};

export default function ApplicationFormPage({ eventId }: { eventId: string }) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const [event, setEvent] = useState<any>(null);
    const [userApp, setUserApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMK, setSelectedMK] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState<Record<number, { nilai: string; file: File | null }>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Open Recruitment', href: '/oprec/events' },
        { title: 'Form Pendaftaran', href: '#' },
    ];

    useEffect(() => {
        api.get(`/events/${eventId}`).then((r) => {
            setEvent(r.data.event);
            setUserApp(r.data.user_application);
            setLoading(false);
        });
    }, [eventId]);

    const toggleMK = (id: number) => {
        setSelectedMK((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const openModal = () => {
        if (selectedMK.length === 0) return toast.error('Pilih minimal satu mata kuliah');
        const profile = auth.user.profile;
        if (!profile || !profile.nama_lengkap || !profile.norek || !profile.transkrip_gd_id || !profile.ktm_gd_id || !profile.nilai_ipk || !profile.no_wa) {
            return toast.error('Harap lengkapi Profil Anda terlebih dahulu!');
        }
        setFormData(selectedMK.reduce((acc, id) => ({ ...acc, [id]: { nilai: '', file: null } }), {}));
        setModalOpen(true);
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('event_id', eventId);
            selectedMK.forEach((id, index) => {
                data.append(`applications[${index}][event_mata_kuliah_id]`, id.toString());
                data.append(`applications[${index}][nilai_mata_kuliah]`, formData[id]?.nilai || '');
                if (formData[id]?.file) data.append(`applications[${index}][sptjm_file]`, formData[id]?.file as File);
            });

            await api.post('/applications/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Pendaftaran berhasil dikirim!');
            window.location.href = '/oprec/my-applications';
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal mengirim pendaftaran');
        } finally {
            setSubmitting(false);
            setModalOpen(false);
        }
    };

    if (loading)
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <CenteredSpinner className="p-10" />
            </AppLayout>
        );

    const profileIncomplete = !auth.user.profile || !auth.user.profile.nama_lengkap || !auth.user.profile.norek || !auth.user.profile.transkrip_gd_id || !auth.user.profile.ktm_gd_id || !auth.user.profile.nilai_ipk || !auth.user.profile.no_wa;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Daftar ${event?.nama}`} />
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Lengkapi Data Pendaftaran</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedMK.map((id) => {
                            const emk = event.event_mata_kuliah.find((x: any) => x.id === id);
                            const minGrade = emk.mata_kuliah.nilai_minimum;
                            return (
                                <div key={id} className="p-4 border rounded-md space-y-3">
                                    <div className="font-bold text-sm">{emk.mata_kuliah.nama} - Kelas {emk.kelas.nama}</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Nilai Anda (Min: {minGrade || '-'}) <span className="text-red-500">*</span></Label>
                                            <Select value={formData[id]?.nilai} onValueChange={(v) => setFormData(prev => ({...prev, [id]: {...prev[id], nilai: v}}))}>
                                                <SelectTrigger><SelectValue placeholder="Pilih Nilai..." /></SelectTrigger>
                                                <SelectContent>
                                                    {getValidGrades(minGrade).map(g => (
                                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>File SPTJM (PDF) <span className="text-red-500">*</span></Label>
                                            <Input type="file" accept=".pdf" onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setFormData(prev => ({...prev, [id]: {...prev[id], file}}));
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                        <Button onClick={submit} disabled={submitting || selectedMK.some(id => !formData[id]?.nilai || !formData[id]?.file)}>{submitting ? 'Mengirim...' : 'Kirim Pendaftaran'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="p-5">
                <div className="mb-6">
                    <Button asChild variant="ghost" size="sm" className="text-muted-foreground group mb-4 -ml-2">
                        <Link href="/oprec/events">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Kembali ke Daftar Event
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{event?.nama}</h1>
                    <p className="text-muted-foreground">
                        {event?.semester.nama} •{' '}
                        <Badge variant="outline" className="capitalize">
                            {event?.tipe}
                        </Badge>
                    </p>
                </div>

                {profileIncomplete && (
                    <Card className="mb-8 border-amber-200 bg-amber-50">
                        <CardHeader className="flex flex-row items-center gap-4 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-amber-800">Profil Belum Lengkap!</CardTitle>
                                <CardDescription className="text-amber-700">
                                    Anda harus melengkapi data diri, nomor rekening, IPK, Kartu Tanda Mahasiswa (KTM), dan Transkrip di halaman profil sebelum mendaftar.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline" className="ml-auto border-amber-300 text-amber-800 hover:bg-amber-100">
                                <Link href="/profil">Lengkapi Profil</Link>
                            </Button>
                        </CardHeader>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <Card className="border-primary/10 overflow-hidden shadow-sm">
                            <CardHeader className="bg-primary/5 py-4">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <Check className="text-primary h-4 w-4" /> Pilih Mata Kuliah & Kelas
                                </CardTitle>
                                <CardDescription>Pilih satu atau lebih mata kuliah yang ingin Anda ajukan.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {event?.event_mata_kuliah.map((emk: any) => {
                                        const appliedOption = userApp?.application_mata_kuliah?.find(
                                            (amk: any) => amk.event_mata_kuliah_id === emk.id,
                                        );
                                        const hasApplied = !!appliedOption;
                                        const isSelected = selectedMK.includes(emk.id) || hasApplied;
                                        const minGrade = emk.mata_kuliah.nilai_minimum;
                                        const isEligible = true;

                                        return (
                                            <div
                                                key={emk.id}
                                                className={`group flex items-start gap-4 rounded-xl border-2 p-4 transition-all ${isSelected ? 'border-primary bg-primary/5 scale-[1.01] shadow-md' : 'border-muted hover:border-primary/20 cursor-pointer'} ${!isEligible && !hasApplied ? 'bg-muted/20 cursor-not-allowed border-dashed opacity-60 grayscale' : ''}`}
                                                onClick={() => !hasApplied && isEligible && toggleMK(emk.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={hasApplied}
                                                    onCheckedChange={() => !hasApplied && toggleMK(emk.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="mb-1 text-lg leading-none font-bold">{emk.mata_kuliah.nama}</h4>
                                                        <div className="flex items-center gap-2">
                                                            {hasApplied && (
                                                                <Badge
                                                                    variant={
                                                                        appliedOption.status === 'approved'
                                                                            ? 'default'
                                                                            : appliedOption.status === 'rejected'
                                                                              ? 'destructive'
                                                                              : 'secondary'
                                                                    }
                                                                    className="capitalize"
                                                                >
                                                                    {appliedOption.status}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="bg-background">
                                                                Kelas {emk.kelas.nama}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground mb-2 text-xs">
                                                        Kode: {emk.mata_kuliah.kode} • {emk.mata_kuliah.sks} SKS
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        {minGrade && (
                                                            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary px-2 py-0.5 text-[10px]">
                                                                <Info className="h-3 w-3" /> Syarat Nilai Minimal: {minGrade}
                                                            </div>
                                                        )}
                                                        <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                                                            Kuota: {Math.ceil(emk.kelas.jumlah_mhs / 8)} Orang
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1">
                        <Card className="border-primary/20 shadow-primary/5 sticky top-6 overflow-hidden shadow-lg">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                                    Ringkasan Pendaftaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Nama</span>
                                        <span className="font-medium">{auth.user.profile?.nama_lengkap || auth.user.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">NIM</span>
                                        <span className="font-mono font-medium">{auth.user.nim}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IPK Anda</span>
                                        <span
                                            className={`font-bold ${parseFloat(auth.user.profile?.nilai_ipk || '0') < 3 ? 'text-amber-600' : 'text-green-600'}`}
                                        >
                                            {auth.user.profile?.nilai_ipk || '0.00'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-semibold">Matakuliah Dipilih</span>
                                        <Badge variant="default">{selectedMK.length}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedMK.map((id) => {
                                            const emk = event.event_mata_kuliah.find((x: any) => x.id === id);
                                            return (
                                                <div
                                                    key={id}
                                                    className="bg-muted/30 border-muted-foreground/10 flex items-center justify-between rounded-lg border p-2 text-xs"
                                                >
                                                    <span className="flex-1 truncate pr-2">{emk.mata_kuliah.nama}</span>
                                                    <span className="font-bold opacity-70">{emk.kelas.nama}</span>
                                                </div>
                                            );
                                        })}
                                        {selectedMK.length === 0 && (
                                            <p className="text-muted-foreground py-2 text-center font-serif text-xs italic">Belum ada pilihan.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 pt-6">
                                <Button
                                    className="shadow-primary/20 h-12 w-full shadow-md"
                                    disabled={selectedMK.length === 0 || profileIncomplete}
                                    onClick={openModal}
                                >
                                    Pilih Nilai & Upload SPTJM <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
