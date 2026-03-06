import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Info, AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
        api.get(`/events/${eventId}`).then(r => {
            setEvent(r.data.event);
            setUserApp(r.data.user_application);
            setLoading(false);
        });
    }, [eventId]);

    const toggleMK = (id: number) => {
        setSelectedMK(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const submit = async () => {
        if (selectedMK.length === 0) return toast.error('Pilih minimal satu mata kuliah');
        if (!auth.user.profile?.nama_lengkap || !auth.user.profile?.nilai_ipk) {
            return toast.error('Harap lengkapi Profil Anda terlebih dahulu!');
        }

        setSubmitting(true);
        try {
            await api.post('/applications/apply', {
                event_id: eventId,
                event_mata_kuliah_ids: selectedMK
            });
            toast.success('Pendaftaran berhasil dikirim!');
            window.location.href = '/oprec/my-applications';
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal mengirim pendaftaran');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout breadcrumbs={breadcrumbs}><div className="p-10 text-center animate-pulse">Memuat form...</div></AppLayout>;

    const profileIncomplete = !auth.user.profile?.nama_lengkap || !auth.user.profile?.norek;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Daftar ${event?.nama}`} />
            <div className="p-5 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground group">
                        <Link href="/oprec/events"><ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Event</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{event?.nama}</h1>
                    <p className="text-muted-foreground">{event?.semester.nama} • <Badge variant="outline" className="capitalize">{event?.tipe}</Badge></p>
                </div>

                {profileIncomplete && (
                    <Card className="mb-8 border-amber-200 bg-amber-50">
                        <CardHeader className="flex flex-row items-center gap-4 py-4">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-amber-800 text-lg">Profil Belum Lengkap!</CardTitle>
                                <CardDescription className="text-amber-700">Anda harus melengkapi data diri, nomor rekening, dan IPK di halaman profil sebelum mendaftar.</CardDescription>
                            </div>
                            <Button asChild variant="outline" className="ml-auto border-amber-300 text-amber-800 hover:bg-amber-100">
                                <Link href="/profil">Lengkapi Profil</Link>
                            </Button>
                        </CardHeader>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-primary/10 shadow-sm overflow-hidden">
                            <CardHeader className="bg-primary/5 py-4">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" /> Pilih Mata Kuliah & Kelas
                                </CardTitle>
                                <CardDescription>Pilih satu atau lebih mata kuliah yang ingin Anda ajukan.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {event?.event_mata_kuliah.map((emk: any) => {
                                        const appliedOption = userApp?.application_mata_kuliah?.find((amk: any) => amk.event_mata_kuliah_id === emk.id);
                                        const hasApplied = !!appliedOption;
                                        const isSelected = selectedMK.includes(emk.id) || hasApplied;
                                        const minIpk = parseFloat(emk.mata_kuliah.nilai_minimum);
                                        const myIpk = parseFloat(auth.user.profile?.nilai_ipk || '0');
                                        const isEligible = minIpk === 0 || myIpk >= minIpk;

                                        return (
                                            <div key={emk.id}
                                                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all group ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' : 'border-muted hover:border-primary/20 cursor-pointer'} ${!isEligible && !hasApplied ? 'opacity-60 grayscale cursor-not-allowed border-dashed bg-muted/20' : ''}`}
                                                onClick={() => !hasApplied && isEligible && toggleMK(emk.id)}
                                            >
                                                <Checkbox checked={isSelected} disabled={!isEligible || hasApplied} onCheckedChange={() => !hasApplied && isEligible && toggleMK(emk.id)} className="mt-1" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-lg leading-none mb-1">{emk.mata_kuliah.nama}</h4>
                                                        <div className="flex items-center gap-2">
                                                            {hasApplied && (
                                                                <Badge variant={appliedOption.status === 'approved' ? 'default' : appliedOption.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                                                    {appliedOption.status}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="bg-background">Kelas {emk.kelas.nama}</Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-2">Kode: {emk.mata_kuliah.kode} • {emk.mata_kuliah.sks} SKS</p>

                                                    <div className="flex items-center gap-3">
                                                        {minIpk > 0 && (
                                                            <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                <Info className="h-3 w-3" /> Min. IPK: {minIpk}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
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
                        <Card className="sticky top-6 border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Ringkasan Pendaftaran</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Nama</span>
                                        <span className="font-medium">{auth.user.profile?.nama_lengkap || auth.user.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">NIM</span>
                                        <span className="font-medium font-mono">{auth.user.nim}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IPK Anda</span>
                                        <span className={`font-bold ${parseFloat(auth.user.profile?.nilai_ipk || '0') < 3 ? 'text-amber-600' : 'text-green-600'}`}>{auth.user.profile?.nilai_ipk || '0.00'}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-semibold">Matakuliah Dipilih</span>
                                        <Badge variant="default">{selectedMK.length}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedMK.map(id => {
                                            const emk = event.event_mata_kuliah.find((x: any) => x.id === id);
                                            return (
                                                <div key={id} className="text-xs bg-muted/30 p-2 rounded-lg border border-muted-foreground/10 flex justify-between items-center">
                                                    <span className="truncate flex-1 pr-2">{emk.mata_kuliah.nama}</span>
                                                    <span className="font-bold opacity-70">{emk.kelas.nama}</span>
                                                </div>
                                            );
                                        })}
                                        {selectedMK.length === 0 && <p className="text-xs text-center text-muted-foreground py-2 italic font-serif">Belum ada pilihan.</p>}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 pt-6">
                                <Button className="w-full h-12 shadow-md shadow-primary/20" disabled={submitting || selectedMK.length === 0 || profileIncomplete} onClick={submit}>
                                    {submitting ? 'Mengirim...' : (
                                        <>
                                            Kirim Pendaftaran <Send className="h-4 w-4 ml-2" />
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
