import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatDateIndonesia } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Calendar, Clock, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Open Recruitment', href: '#' },
    { title: 'Event Terbuka', href: '/oprec/events' },
];

export default function OpenEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/applications/open-events').then((r) => {
            setEvents(r.data);
            setLoading(false);
        });
    }, []);

    const filtered = events.filter(
        (e) => e.nama.toLowerCase().includes(search.toLowerCase()) || e.semester.nama.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Recruitment Terbuka" />
            
            <div className="space-y-6 p-5">
                <section className="from-primary/10 via-background border bg-gradient-to-r to-indigo-500/10 shadow-sm rounded-3xl overflow-hidden p-6 md:p-8 relative">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 text-primary/5 opacity-50 pointer-events-none">
                        <Calendar className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col gap-4 text-left">
                        <div className="space-y-3 max-w-2xl">
                            <div className="bg-background/80 text-muted-foreground shadow-sm inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
                                <Search className="h-4 w-4" />
                                OPREC ASISTEN
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Daftar Rekrutmen Asisten</h1>
                                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                    Kesempatan untuk bergabung sebagai Asisten Praktikum atau Tutorial Silabku. 
                                    Pilih event yang sedang dibuka di bawah ini untuk memulai pendaftaran Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="group relative w-full max-w-md">
                        <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 h-4 w-4 transition-colors" />
                        <Input
                            placeholder="Cari event atau semester..."
                            className="bg-background border-muted-foreground/20 focus-visible:ring-primary/20 h-11 rounded-xl pl-10 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-muted h-64 animate-pulse rounded-2xl border" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((ev) => (
                            <Card
                                key={ev.id}
                                className="border-0 ring-1 ring-border/50 shadow-sm hover:ring-primary/30 group overflow-hidden transition-all hover:shadow-md"
                            >
                                <CardHeader className="bg-muted/30 border-b pb-4">
                                    <div className="mb-2 flex items-start justify-between">
                                        <Badge variant="outline" className="bg-background/80 capitalize">
                                            {ev.tipe}
                                        </Badge>
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Terbuka</Badge>
                                    </div>
                                    <CardTitle className="group-hover:text-primary text-lg transition-colors line-clamp-1">{ev.nama}</CardTitle>
                                    <CardDescription className="text-xs">{ev.semester.nama}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5">
                                    <p className="text-muted-foreground line-clamp-2 text-sm h-10">{ev.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
                                    <div className="grid grid-cols-1 gap-3 py-1">
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <div className="p-1.5 bg-primary/5 rounded-md text-primary">
                                                <Clock className="h-3.5 w-3.5" />
                                            </div>
                                            <span>Berakhir: <span className="font-medium">{formatDateIndonesia(ev.tanggal_tutup)}</span></span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <div className="p-1.5 bg-indigo-500/5 rounded-md text-indigo-500">
                                                <MapPin className="h-3.5 w-3.5" />
                                            </div>
                                            <span>Membuka <span className="font-medium text-indigo-600">{ev.event_mata_kuliah?.length || 0} Mata Kuliah</span></span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {ev.event_mata_kuliah?.slice(0, 3).map((emk: any, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                                                {emk.mata_kuliah.nama}
                                            </Badge>
                                        ))}
                                        {(ev.event_mata_kuliah?.length || 0) > 3 && (
                                            <span className="text-muted-foreground text-[10px] ml-1">+{ev.event_mata_kuliah.length - 3} lagi</span>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pr-6 pb-6 mt-2">
                                    <Button asChild className="w-full shadow-primary/20 group rounded-xl">
                                        <Link href={`/oprec/apply/${ev.id}`}>
                                            Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {filtered.length === 0 && (
                            <div className="bg-muted/20 text-muted-foreground col-span-full rounded-3xl border-2 border-dashed py-20 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-10" />
                                <p>Saat ini belum ada rekrutmen yang tersedia.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
