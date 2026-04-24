import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, Link } from '@inertiajs/react';
import {
    Users,
    Calendar,
    Award,
    ClipboardList,
    Clock,
    ArrowRight,
    CheckCircle2,
    CalendarClock,
    GraduationCap,
    Building2
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { props } = usePage<any>();
    const { stats, auth } = props;
    const userRole = auth?.user?.role || 'user';
    const userName = auth?.user?.name || 'User';

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Ensure tokens are saved if coming from a redirect
        const token = props.auth_token;
        if (token && typeof token === "string") {
            localStorage.setItem("auth_token", token);
        }

        const storedUser = localStorage.getItem("auth_user");
        if (storedUser && !auth?.user) {
            // we rely on auth config from usePage mostly, this is fallback
        }
    }, [props.auth_token]);

    const isAdminOrDosen = userRole === 'admin' || userRole === 'dosen';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 border border-primary/10">
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Selamat Datang, {userName}!</h1>
                        <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                            {isAdminOrDosen 
                                ? "Pantau aktivitas rekrutmen, jadwal praktikum, dan penerbitan sertifikat asisten laboratorium dari satu tempat." 
                                : "Akses pendaftaran asisten laboratorium, lihat jadwal praktikum, dan unduh sertifikat kamu dengan mudah."}
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-12 -mr-4 md:-mr-12 opacity-10 pointer-events-none">
                        <GraduationCap className="w-48 h-48 md:w-64 md:h-64" />
                    </div>
                </div>

                {isAdminOrDosen ? (
                    <AdminDashboard stats={stats || {}} />
                ) : (
                    <UserDashboard stats={stats || {}} />
                )}
            </div>
        </AppLayout>
    );
}

function AdminDashboard({ stats }: { stats: any }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Event Aktif" 
                    value={stats.active_events || 0} 
                    icon={CalendarClock} 
                    description="Event rekrutmen yang berjalan" 
                    className="border-l-4 border-l-blue-500"
                />
                <StatCard 
                    title="Total Pendaftar" 
                    value={stats.total_applicants || 0} 
                    icon={Users} 
                    description="Asisten yang telah mendaftar" 
                    className="border-l-4 border-l-purple-500"
                />
                <StatCard 
                    title="Seleksi Tertunda" 
                    value={stats.pending_selections || 0} 
                    icon={Clock} 
                    description="Pendaftar butuh direview" 
                    className="border-l-4 border-l-amber-500"
                />
                <StatCard 
                    title="Sertifikat Terbit" 
                    value={stats.issued_certificates || 0} 
                    icon={Award} 
                    description="Total sertifikat asisten diterbitkan" 
                    className="border-l-4 border-l-green-500"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Events Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start md:items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Event Terbaru</CardTitle>
                            <CardDescription>Event rekrutmen yang baru-baru ini dibuat</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                            <Link href="/admin/events">Lihat Semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats.recent_events && stats.recent_events.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recent_events.map((ev: any) => (
                                    <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CalendarClock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{ev.nama}</p>
                                                <p className="text-xs text-muted-foreground truncate">{ev.jenis_event}</p>
                                            </div>
                                        </div>
                                        <Badge variant={ev.is_active ? "default" : "secondary"} className="shrink-0 ml-2">
                                            {ev.is_active ? "Aktif" : "Selesai"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed">
                                <Calendar className="h-8 w-8 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-foreground/70 font-medium">Belum ada event</p>
                                <p className="text-xs text-muted-foreground">Buat event rekrutmen baru di menu Data.</p>
                            </div>
                        )}
                        <Button variant="outline" size="sm" asChild className="w-full mt-4 sm:hidden">
                            <Link href="/admin/events">Lihat Semua Event</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Applications Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start md:items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Pendaftaran Terbaru</CardTitle>
                            <CardDescription>Pendaftar asisten laboratorium belakangan ini</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                            <Link href="/seleksi">Kelola Seleksi</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats.recent_applications && stats.recent_applications.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recent_applications.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 pr-2">
                                                <p className="font-medium text-sm truncate">{app.user?.name || 'User'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{app.event?.nama}</p>
                                            </div>
                                        </div>
                                        <Badge variant={
                                            app.status === 'approved' ? 'default' :
                                            app.status === 'rejected' ? 'destructive' :
                                            'outline'
                                        } className="shrink-0">
                                            {app.status === 'approved' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Proses'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed">
                                <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-foreground/70 font-medium">Belum ada pendaftaran recent.</p>
                                <p className="text-xs text-muted-foreground">Pendaftar akan muncul saat event aktif.</p>
                            </div>
                        )}
                        <Button variant="outline" size="sm" asChild className="w-full mt-4 sm:hidden">
                            <Link href="/seleksi">Kelola Seleksi</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* Quick Actions Component */}
            <div>
                <h3 className="text-lg font-medium mb-3">Akses Cepat</h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
                    <QuickActionCard title="Laboratorium" icon={Building2} href="/admin/laboratorium" />
                    <QuickActionCard title="Jadwal Praktikum" icon={Calendar} href="/jadwal" />
                    <QuickActionCard title="Database Asisten" icon={Users} href="/database/all" />
                    <QuickActionCard title="Sertifikat" icon={Award} href="/sertifikat/penerbitan" />
                </div>
            </div>
        </div>
    );
}

function UserDashboard({ stats }: { stats: any }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard 
                    title="Pendaftaran Saya" 
                    value={stats.my_applications_count || 0} 
                    icon={ClipboardList} 
                    description="Total histori pendaftaran event" 
                    className="border-l-4 border-l-blue-500"
                />
                <StatCard 
                    title="Event Terbuka" 
                    value={stats.active_events_count || 0} 
                    icon={CalendarClock} 
                    description="Event rekrutmen yang bisa diikuti" 
                    className="border-l-4 border-l-purple-500"
                />
                <StatCard 
                    title="Status Profil" 
                    value="Lengkap" 
                    icon={CheckCircle2} 
                    description="Profil data asisten" 
                    className="border-l-4 border-l-green-500"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <div className="space-y-1">
                            <CardTitle>Riwayat Pendaftaran</CardTitle>
                            <CardDescription>Status pendaftaran asisten terbaru kamu</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-primary hover:text-primary/80">
                            <Link href="/oprec/my-applications">Lihat Semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {stats.my_recent_applications && stats.my_recent_applications.length > 0 ? (
                            <div className="space-y-4">
                                {stats.my_recent_applications.map((app: any) => (
                                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card/50 transition-colors hover:bg-muted/50 gap-4">
                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <ClipboardList className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{app.event?.nama}</p>
                                                <p className="text-xs text-muted-foreground">Mendaftar pada: {new Date(app.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <Badge variant={
                                            app.status === 'approved' ? 'default' :
                                            app.status === 'rejected' ? 'destructive' :
                                            'outline'
                                        } className="px-3 py-1 text-xs font-semibold self-start sm:self-center">
                                            {app.status === 'approved' ? 'Lulus Seleksi' : app.status === 'rejected' ? 'Tidak Lulus' : 'Dalam Proses'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                                <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-base font-medium">Belum ada riwayat pendaftaran</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Daftarkan diri Anda menjadi Asisten Laboratorium pada event yang sedang berlangsung.</p>
                                <Button asChild>
                                    <Link href="/oprec/events">Lihat Daftar Event</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4 flex flex-col h-full">
                    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                            <GraduationCap className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle>Mulai Karier Asisten</CardTitle>
                            <CardDescription>Jelajahi berbagai kesempatan terbuka.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full sm:w-auto z-10 relative" asChild>
                                <Link href="/oprec/events">
                                    Eksplor Event <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <Link href="/bap" className="group flex flex-col items-center justify-center p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-center h-full">
                            <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex flex-col items-center justify-center mb-3 transition-colors">
                                <Clock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-medium text-sm">Laporan BAP</h3>
                        </Link>
                        <Link href="/jadwal" className="group flex flex-col items-center justify-center p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-center h-full">
                            <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex flex-col items-center justify-center mb-3 transition-colors">
                                <Calendar className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-medium text-sm">Jadwal Praktikum</h3>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, description, className = "" }: any) {
    return (
        <Card className={`overflow-hidden hover:shadow-md transition-all duration-300 relative ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function QuickActionCard({ title, icon: Icon, href }: any) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group">
            <div className="h-10 w-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium line-clamp-2 leading-tight">{title}</p>
        </Link>
    );
}
