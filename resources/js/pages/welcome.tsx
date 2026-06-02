import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CheckCircle, Clock, GraduationCap, LayoutDashboard, Users, ChevronLeft, ChevronRight, CalendarDays, Building2, Filter, Calendar } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [activities, setActivities] = useState<any[]>([]);
    const [labs, setLabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLabFilter, setSelectedLabFilter] = useState('all');

    useEffect(() => {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        setLoading(true);
        api.get('/kegiatan-public', { params: { month, year } })
            .then(res => setActivities(res.data))
            .catch(err => console.error("Gagal memuat kegiatan", err))
            .finally(() => setLoading(false));
    }, [currentDate]);

    useEffect(() => {
        api.get('/laboratorium/all')
            .then(res => setLabs(res.data))
            .catch(err => console.error("Gagal memuat lab", err));
    }, []);

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthDays - i)
            });
        }
        
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }
        
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }
        
        return days;
    };

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getActivitiesForDate = (date: Date) => {
        const localDateStr = formatDateKey(date);
        return activities.filter(act => {
            const actDateStr = act.tanggal;
            const matchesDate = actDateStr === localDateStr;
            const matchesLab = selectedLabFilter === 'all' || 
                (selectedLabFilter === 'null' && act.laboratorium_id === null) || 
                (act.laboratorium_id !== null && String(act.laboratorium_id) === selectedLabFilter);
            return matchesDate && matchesLab;
        });
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const getMonthName = (date: Date) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[date.getMonth()];
    };

    const formatDateIndo = (date: Date) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[date.getDay()];
        return `${dayName}, ${date.getDate()} ${getMonthName(date)} ${date.getFullYear()}`;
    };

    const calendarDays = generateCalendarDays();
    const selectedDateActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Head title="Silabku - Sistem Pengelolaan Asisten Praktikum" />
            
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <AppLogo className="h-8 w-auto" />
                    </div>
                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg shadow-md shadow-primary/20"
                                >
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.08)_0,transparent_70%)] blur-3xl opacity-70" />
                
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                            </span>
                            Pendaftaran Asisten Praktikum Semester Berjalan Telah Dibuka
                        </div>
                        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
                            Sistem Pengelolaan Data <br />
                            <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Asisten Praktikum</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
                            Silabku merupakan platform rekrutmen dan manajemen asisten praktikum digital untuk 
                            <span className="font-semibold text-foreground"> Prodi Sains Data, Fakultas Sains, Institut Teknologi Sumatera.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={auth.user ? route('dashboard') : route('register')}
                                className="group flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                            >
                                Mulai Sekarang
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/oprec/events"
                                className="flex h-12 items-center gap-2 rounded-full border bg-background px-8 text-sm font-bold transition-all hover:bg-muted"
                            >
                                Lihat Lowongan
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Stats */}
            <section className="py-20 bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                        <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-background shadow-sm border hover:shadow-md transition-shadow">
                            <div className="mb-6 rounded-2xl bg-primary/10 p-4 text-primary">
                                <Users className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold">Rekrutmen Terintegrasi</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Proses pendaftaran, unggah berkas, hingga seleksi dilakukan dalam satu platform yang transparan.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-background shadow-sm border hover:shadow-md transition-shadow">
                            <div className="mb-6 rounded-2xl bg-indigo-500/10 p-4 text-indigo-500">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold">Manajemen BAP Digital</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Pengisian Berita Acara Praktikum (BAP) menjadi lebih mudah, cepat, dan terdokumentasi dengan baik.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-background shadow-sm border hover:shadow-md transition-shadow">
                            <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-500">
                                <GraduationCap className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold">Monitoring Kinerja</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Memudahkan dosen dan admin dalam memantau kehadiran serta performa asisten setiap pertemuan.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Alur Menjadi Asisten</h2>
                        <p className="mt-4 text-muted-foreground">Ikuti langkah-langkah mudah berikut untuk bergabung bersama kami.</p>
                    </div>
                    <div className="relative">
                        <div className="absolute top-12 left-0 hidden h-0.5 w-full bg-border lg:block" />
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                            {[
                                { title: 'Daftar Akun', icon: <Users />, desc: 'Buat akun menggunakan data mahasiswa aktif ITERA.' },
                                { title: 'Pilih Event', icon: <Clock />, desc: 'Pilih lowongan asisten praktikum yang sedang dibuka.' },
                                { title: 'Seleksi Admin', icon: <CheckCircle />, desc: 'Lengkapi berkas dan tunggu verifikasi dari tim pengelola.' },
                                { title: 'Mulai Bertugas', icon: <GraduationCap />, desc: 'Jika lolos, Anda resmi menjadi asisten praktikum Silabku.' },
                            ].map((step, i) => (
                                <div key={i} className="relative flex flex-col items-center text-center">
                                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-muted text-primary shadow-sm mb-6">
                                        {step.icon}
                                    </div>
                                    <h4 className="mb-2 font-bold">{step.title}</h4>
                                    <p className="text-xs text-muted-foreground px-4">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Calendar Section */}
            <section className="py-20 bg-muted/20 border-y">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/80 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
                            <CalendarDays className="h-4.5 w-4.5" />
                            Agenda Laboratorium
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Jadwal & Kegiatan Laboratorium</h2>
                        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Lihat agenda penggunaan ruangan laboratorium di luar jam praktikum rutin, seperti penelitian, ujian susulan, atau peminjaman ruangan.
                        </p>
                    </div>

                    {/* Filters & Navigation Control */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-background p-4 rounded-2xl border shadow-sm">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={prevMonth}
                                className="p-2 hover:bg-muted rounded-full border transition-colors cursor-pointer"
                                aria-label="Bulan sebelumnya"
                            >
                                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <h3 className="text-lg font-bold min-w-[150px] text-center">
                                {getMonthName(currentDate)} {currentDate.getFullYear()}
                            </h3>
                            <button 
                                onClick={nextMonth}
                                className="p-2 hover:bg-muted rounded-full border transition-colors cursor-pointer"
                                aria-label="Bulan berikutnya"
                            >
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:inline">Ruangan</span>
                            <select 
                                value={selectedLabFilter} 
                                onChange={e => setSelectedLabFilter(e.target.value)}
                                className="w-full sm:w-[220px] h-9 px-3 border rounded-lg bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                            >
                                <option value="all">Semua Ruangan</option>
                                <option value="null">Tanpa Laboratorium (Umum)</option>
                                {labs.map(l => (
                                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Calendar Grid Container */}
                        <div className="lg:col-span-2 bg-background border rounded-3xl p-6 shadow-sm relative">
                            {loading && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-3xl z-40 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <div className="grid grid-cols-7 gap-2 mb-4 text-center font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="py-2">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((cell, idx) => {
                                    const dateActs = getActivitiesForDate(cell.date);
                                    const isSelected = selectedDate && formatDateKey(cell.date) === formatDateKey(selectedDate);
                                    const isToday = formatDateKey(cell.date) === formatDateKey(new Date());

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedDate(cell.date)}
                                            className={`
                                                min-h-[90px] p-2 border rounded-xl flex flex-col justify-between transition-all duration-200 cursor-pointer select-none relative
                                                ${cell.isCurrentMonth ? 'bg-background hover:bg-muted/50 border-border/60' : 'bg-muted/10 text-muted-foreground/50 border-border/20'}
                                                ${isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary' : ''}
                                                ${isToday ? 'bg-primary/5 border-primary/30 font-bold' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs ${isToday ? 'bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-full font-bold' : ''}`}>
                                                    {cell.day}
                                                </span>
                                                {dateActs.length > 0 && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow shadow-indigo-500/50" />
                                                )}
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1 overflow-hidden">
                                                {dateActs.slice(0, 2).map(act => (
                                                    <div 
                                                        key={act.id} 
                                                        className="text-[9px] font-bold leading-tight px-1 py-0.5 rounded truncate bg-indigo-500/10 text-indigo-600 border border-indigo-500/10"
                                                        title={act.nama_kegiatan}
                                                    >
                                                        {act.nama_kegiatan}
                                                    </div>
                                                ))}
                                                {dateActs.length > 2 && (
                                                    <div className="text-[8px] font-bold text-muted-foreground pl-1">
                                                        +{dateActs.length - 2} kegiatan lagi
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Details Container */}
                        <div className="lg:col-span-1 bg-background border rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[400px]">
                            <div className="border-b pb-4 mb-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Detail Kegiatan</h3>
                                <p className="text-sm font-bold text-foreground mt-1">
                                    {selectedDate ? formatDateIndo(selectedDate) : 'Pilih tanggal'}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 max-h-[450px] pr-1">
                                {selectedDateActivities.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                        <Calendar className="w-12 h-12 text-muted-foreground/20 mb-3" />
                                        <p className="text-sm font-bold text-foreground">Tidak Ada Kegiatan</p>
                                        <p className="text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
                                            Laboratorium kosong/bebas pada tanggal ini. Tidak ada jadwal peminjaman atau kegiatan khusus.
                                        </p>
                                    </div>
                                ) : (
                                    selectedDateActivities.map(act => (
                                        <div 
                                            key={act.id}
                                            className="p-4 rounded-2xl bg-muted/40 border border-border/50 hover:shadow-md hover:bg-muted/60 transition-all flex flex-col gap-2.5"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-bold text-sm text-foreground leading-tight">
                                                    {act.nama_kegiatan}
                                                </h4>
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span>{act.jam_mulai.slice(0, 5)} - {act.jam_selesai.slice(0, 5)} WIB</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    <span>
                                                        {act.laboratorium ? act.laboratorium.name : 'Luar Laboratorium / Umum'}
                                                    </span>
                                                </div>
                                            </div>

                                            {act.keterangan && (
                                                <div className="text-xs border-t pt-2 mt-1 text-muted-foreground leading-relaxed italic bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                                                    {act.keterangan}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex flex-col items-center gap-6">
                        <AppLogo className="opacity-50 grayscale hover:grayscale-0 transition-all" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Prodi Sains Data, Fakultas Sains</p>
                            <p className="text-sm text-muted-foreground">Institut Teknologi Sumatera</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Silabku. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
