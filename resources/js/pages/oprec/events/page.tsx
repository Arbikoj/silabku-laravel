import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ArrowRight, Clock, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Open Recruitment', href: '#' }, { title: 'Event Terbuka', href: '/oprec/events' }];

export default function OpenEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/applications/open-events').then(r => {
            setEvents(r.data);
            setLoading(false);
        });
    }, []);

    const filtered = events.filter(e => e.nama.toLowerCase().includes(search.toLowerCase()) || e.semester.nama.toLowerCase().includes(search.toLowerCase()));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Recruitment Terbuka" />
            <div className="p-5 max-w-6xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Daftar Rekrutmen Asisten</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">Kesempatan untuk bergabung sebagai Asisten Praktikum atau Tutorial Silabku. Pilih event yang sedang dibuka di bawah ini.</p>
                </div>

                <div className="mb-6 max-w-md mx-auto relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input placeholder="Cari event..." className="pl-10 h-11 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse border" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.map(ev => (
                            <Card key={ev.id} className="overflow-hidden border-muted-foreground/10 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                                <CardHeader className="bg-muted/30 pb-4 border-b">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-background/80 capitalize">{ev.tipe}</Badge>
                                        <Badge className="bg-green-500 hover:bg-green-600">Terbuka</Badge>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{ev.nama}</CardTitle>
                                    <CardDescription>{ev.semester.nama}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{ev.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" /> Berakhir: {ev.tanggal_tutup || 'Tidak ditentukan'}
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5" /> {ev.event_mata_kuliah?.length || 0} Mata Kuliah
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {ev.event_mata_kuliah?.slice(0, 3).map((emk: any, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">{emk.mata_kuliah.nama}</Badge>
                                        ))}
                                        {(ev.event_mata_kuliah?.length || 0) > 3 && <span className="text-[10px] text-muted-foreground">+{ev.event_mata_kuliah.length - 3} lagi</span>}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-6 pr-6 justify-end">
                                    <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 group">
                                        <Link href={`/oprec/apply/${ev.id}`}>
                                            Daftar Sekarang <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 bg-muted/20 border-2 border-dashed rounded-3xl text-center text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                <p>Saat ini belum ada rekrutmen yang tersedia.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
