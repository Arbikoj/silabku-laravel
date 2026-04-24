import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CheckCircle, Clock, GraduationCap, LayoutDashboard, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

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
