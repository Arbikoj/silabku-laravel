import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
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
            <div className="p-5">
                <div className="mb-10 text-center">
                    <h1 className="from-primary to-primary/60 mb-2 bg-gradient-to-r bg-clip-text text-3xl font-extrabold text-transparent">
                        Daftar Rekrutmen Asisten
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-lg">
                        Kesempatan untuk bergabung sebagai Asisten Praktikum atau Tutorial Silabku. Pilih event yang sedang dibuka di bawah ini.
                    </p>
                </div>

                <div className="group relative mx-auto mb-6 max-w-md">
                    <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 h-4 w-4 transition-colors" />
                    <Input
                        placeholder="Cari event..."
                        className="border-muted-foreground/20 focus-visible:ring-primary/20 h-11 rounded-full pl-10 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-muted h-64 animate-pulse rounded-2xl border" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filtered.map((ev) => (
                            <Card
                                key={ev.id}
                                className="border-muted-foreground/10 hover:border-primary/30 hover:shadow-primary/5 group overflow-hidden transition-all hover:shadow-xl"
                            >
                                <CardHeader className="bg-muted/30 border-b pb-4">
                                    <div className="mb-2 flex items-start justify-between">
                                        <Badge variant="outline" className="bg-background/80 capitalize">
                                            {ev.tipe}
                                        </Badge>
                                        <Badge className="bg-green-500 hover:bg-green-600">Terbuka</Badge>
                                    </div>
                                    <CardTitle className="group-hover:text-primary text-xl transition-colors">{ev.nama}</CardTitle>
                                    <CardDescription>{ev.semester.nama}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <p className="text-muted-foreground line-clamp-2 text-sm">{ev.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" /> Berakhir: {ev.tanggal_tutup || 'Tidak ditentukan'}
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" /> {ev.event_mata_kuliah?.length || 0} Mata Kuliah
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {ev.event_mata_kuliah?.slice(0, 3).map((emk: any, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                                {emk.mata_kuliah.nama}
                                            </Badge>
                                        ))}
                                        {(ev.event_mata_kuliah?.length || 0) > 3 && (
                                            <span className="text-muted-foreground text-[10px]">+{ev.event_mata_kuliah.length - 3} lagi</span>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-end pt-0 pr-6 pb-6">
                                    <Button asChild className="shadow-primary/20 group rounded-full px-6 shadow-lg">
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
