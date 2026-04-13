import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Check, Info, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ApplicationFormPage({ eventId }: { eventId: string }) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const [event, setEvent] = useState<any>(null);
    const [userApp, setUserApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMK, setSelectedMK] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

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

    const submit = async () => {
        if (selectedMK.length === 0) return toast.error('Pilih minimal satu mata kuliah');
        const profile = auth.user.profile;
        if (!profile || !profile.nama_lengkap || !profile.norek || !profile.transkrip_gd_id || !profile.ktm_gd_id || !profile.nilai_ipk || !profile.no_wa) {
            return toast.error('Harap lengkapi Profil Anda terlebih dahulu!');
        }

        setSubmitting(true);
        try {
            await api.post('/applications/apply', {
                event_id: eventId,
                event_mata_kuliah_ids: selectedMK,
            });
            toast.success('Pendaftaran berhasil dikirim!');
            window.location.href = '/oprec/my-applications';
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal mengirim pendaftaran');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="animate-pulse p-10 text-center">Memuat form...</div>
            </AppLayout>
        );

    const profileIncomplete = !auth.user.profile || !auth.user.profile.nama_lengkap || !auth.user.profile.norek || !auth.user.profile.transkrip_gd_id || !auth.user.profile.ktm_gd_id || !auth.user.profile.nilai_ipk || !auth.user.profile.no_wa;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Daftar ${event?.nama}`} />
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
                                        const minIpk = parseFloat(emk.mata_kuliah.nilai_minimum);
                                        const myIpk = parseFloat(auth.user.profile?.nilai_ipk || '0');
                                        const isEligible = minIpk === 0 || myIpk >= minIpk;

                                        return (
                                            <div
                                                key={emk.id}
                                                className={`group flex items-start gap-4 rounded-xl border-2 p-4 transition-all ${isSelected ? 'border-primary bg-primary/5 scale-[1.01] shadow-md' : 'border-muted hover:border-primary/20 cursor-pointer'} ${!isEligible && !hasApplied ? 'bg-muted/20 cursor-not-allowed border-dashed opacity-60 grayscale' : ''}`}
                                                onClick={() => !hasApplied && isEligible && toggleMK(emk.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={!isEligible || hasApplied}
                                                    onCheckedChange={() => !hasApplied && isEligible && toggleMK(emk.id)}
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
                                                        {minIpk > 0 && (
                                                            <div
                                                                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] ${isEligible ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                                                            >
                                                                <Info className="h-3 w-3" /> Min. IPK: {minIpk}
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
                                    disabled={submitting || selectedMK.length === 0 || profileIncomplete}
                                    onClick={submit}
                                >
                                    {submitting ? (
                                        'Mengirim...'
                                    ) : (
                                        <>
                                            Kirim Pendaftaran <Send className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
