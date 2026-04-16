import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BookOpen, Upload, Calendar, Send, Info, Loader2, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface BapPageProps {
    jadwalPraktikums: any[];
    bapProgress: Record<string, any[]>;
}

export default function BapIndex({ jadwalPraktikums, bapProgress }: BapPageProps) {
    const defaultDate = new Date().toISOString().split('T')[0];

    const SimpleAccordionItem = ({ pertemuanKe, isDone, existingData, jadwal }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm px-1">
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className={`flex w-8 h-8 items-center justify-center rounded-full text-sm font-medium shrink-0
                            ${isDone ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {pertemuanKe}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">Pertemuan {pertemuanKe}</span>
                            {isDone && <span className="text-xs text-muted-foreground truncate">{existingData.tanggal?.split('T')[0]} - {existingData.topik?.substring(0, 30)}...</span>}
                        </div>
                    </div>
                    <div>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                </button>
                {isOpen && (
                    <div className="px-4 pb-4">
                        <BapForm jadwal={jadwal} pertemuanKe={pertemuanKe} existingData={existingData} />
                    </div>
                )}
            </div>
        );
    };

    const BapForm = ({ jadwal, pertemuanKe, existingData }: { jadwal: any, pertemuanKe: number, existingData: any }) => {
        const { data, setData, post, processing, errors } = useForm({
            jadwal_praktikum_id: jadwal.id,
            pertemuan_ke: pertemuanKe,
            tanggal: existingData?.tanggal ? existingData.tanggal.split('T')[0] : defaultDate,
            topik: existingData?.topik || '',
            foto_1: null as File | null,
            foto_2: null as File | null,
            foto_3: null as File | null,
        });

        const fotoData = existingData?.foto_google_drive_ids ? JSON.parse(existingData.foto_google_drive_ids) : null;
        const isCompleted = !!existingData?.topik;

        const submit = (e: React.FormEvent) => {
            e.preventDefault();
            post(route('bap.store'), {
                preserveScroll: true,
                onSuccess: () => toast.success(`Pertemuan ${pertemuanKe} berhasil disimpan!`),
                onError: () => toast.error('Terjadi kesalahan saat menyimpan data.')
            });
        };

        return (
            <form onSubmit={submit} className="space-y-4 p-4 bg-muted/20 border rounded-lg mt-2 relative">
                {isCompleted && (
                    <div className="absolute top-2 right-4 flex items-center text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Tersimpan
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tanggal Pertemuan</Label>
                        <Input 
                            type="date" 
                            value={data.tanggal} 
                            onChange={e => setData('tanggal', e.target.value)} 
                            className="bg-white"
                        />
                        {errors.tanggal && <p className="text-red-500 text-xs">{errors.tanggal}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Topik / Materi Pembahasan</Label>
                        <Textarea 
                            placeholder="Tuliskan topik yang dibahas pada pertemuan ini..." 
                            value={data.topik}
                            onChange={e => setData('topik', e.target.value)}
                            rows={3}
                            className="bg-white resize-none"
                        />
                        {errors.topik && <p className="text-red-500 text-xs">{errors.topik}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Dokumentasi (Minimal 3 Foto, Max: 2MB/foto)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => {
                                const photoKey = `foto_${i}` as 'foto_1'|'foto_2'|'foto_3';
                                const hasExistingFoto = fotoData && fotoData[photoKey];
                                
                                return (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-white relative hover:bg-slate-50 transition-colors">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={e => setData(photoKey, e.target.files ? e.target.files[0] : null)}
                                            />
                                            <div className="text-center p-4">
                                                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-xs text-muted-foreground truncate w-full max-w-full">
                                                    {data[photoKey] ? data[photoKey]?.name : hasExistingFoto ? '✓ Foto sudah diupload' : `Foto ${i}`}
                                                </p>
                                            </div>
                                        </div>
                                        {errors[photoKey] && <p className="text-red-500 text-xs">{errors[photoKey]}</p>}
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Foto akan disimpan ke folder Google Drive Anda.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Simpan Pertemuan {pertemuanKe}
                    </Button>
                </div>
            </form>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Berita Acara Praktikum', href: '/bap' }]}>
            <Head title="BAP Asisten" />
            
            <div className="flex h-full w-full flex-col gap-6 p-6 mx-auto max-w-5xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Berita Acara Praktikum (BAP)</h1>
                    <p className="text-muted-foreground">
                        Silakan kelola pelaporan praktikum untuk setiap mata kuliah yang Anda asistensi.
                    </p>
                </div>

                <div className="grid gap-6">
                    {jadwalPraktikums.map((jadwal) => {
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const { post, processing } = useForm({ jadwal_praktikum_id: jadwal.id });
                        
                        const handleGenerate = () => {
                            post(route('bap.generate'), {
                                preserveScroll: true,
                                onSuccess: (page) => {
                                    if(page.props.flash?.error) {
                                        toast.error(page.props.flash.error);
                                    } else if (page.props.flash?.success) {
                                        toast.success(page.props.flash.success);
                                    }
                                    
                                    if(page.props.flash?.doc_url) {
                                        window.open(page.props.flash.doc_url, '_blank');
                                    }
                                },
                                onError: () => {
                                    toast.error('Terjadi kesalahan pada server saat meng-generate.');
                                }
                            });
                        };

                        const currentBapData = bapProgress[jadwal.id] || [];
                        const completedCount = currentBapData.filter(d => !!d.topik).length;
                        const isReadyToGenerate = completedCount > 0;

                        return (
                            <Card key={jadwal.id} className="border-t-4 border-t-indigo-400 shadow-sm">
                                <CardHeader className="bg-indigo-50/50 pb-4">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-xl text-indigo-950">
                                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                                {jadwal.mata_kuliah?.nama}
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-1">
                                                Kelas {jadwal.kelas?.nama} • {jadwal.hari}, {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-sm font-medium bg-white px-3 py-1 rounded-full border shadow-sm">
                                                Progress: <span className={completedCount === 10 ? 'text-emerald-600' : 'text-blue-600'}>{completedCount}/10</span>
                                            </div>
                                            <Button 
                                                onClick={handleGenerate} 
                                                disabled={processing || !isReadyToGenerate}
                                                className="bg-indigo-600 hover:bg-indigo-700 shadow flex items-center"
                                            >
                                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                                Generate Dokumen BAP
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 bg-slate-50/50">
                                    <div className="w-full space-y-2">
                                        {Array.from({ length: 10 }).map((_, idx) => {
                                            const pertemuanKe = idx + 1;
                                            const existingData = currentBapData.find((d: any) => d.pertemuan_ke === pertemuanKe);
                                            const isDone = !!existingData?.topik;
                                            // Make first uncompleted item open by default or rely on simple click to open
                                            // We'll just define a simple AccordionItem substitute inline
                                            return (
                                                <SimpleAccordionItem 
                                                    key={pertemuanKe}
                                                    pertemuanKe={pertemuanKe}
                                                    isDone={isDone}
                                                    existingData={existingData}
                                                    jadwal={jadwal}
                                                />
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {jadwalPraktikums.length === 0 && (
                        <Card className="border-dashed shadow-none bg-slate-50">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Info className="w-12 h-12 mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-900">Belum ada Jadwal Praktikum</h3>
                                <p className="max-w-sm mt-1">Anda belum ditugaskan ke jadwal praktikum apa pun pada semester ini yang memerlukan pelaporan BAP.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
