import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { DropdownItem, type NavItem } from '@/types';
import { usePage, Link } from '@inertiajs/react';
import {
    Award,
    Bolt,
    BookOpen,
    Database,
    Folder,
    LayoutGrid,
    GraduationCap,
    ClipboardList,
    Calendar,
    Building2,
    Layers,
    CalendarRange,
    CalendarDays,
    CalendarRangeIcon,
    LucideCalendarRange,
} from 'lucide-react';
import AppLogo from './app-logo';
import { NavDropdown } from './nav-dropdown';
import { Badge } from './ui/badge';

export function AppSidebar() {
    const { auth, active_semester } = usePage<{ auth: { user: { role: string } | null }, active_semester: any }>().props;
    const role = auth?.user?.role ?? 'user';

    // ── Menu: semua user ───────────────────────────────────────
    const baseMenuItems: DropdownItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
            isActive: true,
        },
    ];

    // ── Menu: Data ───────────────────────────────────────────
    const dataItems: DropdownItem[] = [
        {
            title: 'Data',
            url: '#',
            icon: Layers,
            isActive: true,
            items: [
                { title: 'Laboratorium', url: '/admin/laboratorium' },
                { title: 'Semester', url: '/admin/semesters' },
                { title: 'Mata Kuliah', url: '/admin/mata-kuliah' },
                { title: 'Daftar Kelas', url: '/admin/kelas-list' },
            ],
        },
    ];

    // ── Menu: Jadwal ──────────────────────────────────────────
    const jadwalItems: DropdownItem[] = [
        {
            title: 'Jadwal Praktikum',
            url: '/jadwal',
            icon: CalendarDays,
            isActive: true,
        },
    ];

    // ── Menu: Laporan BAP (Asisten) ───────────────────────────
    const bapItems: DropdownItem[] = [
        {
            title: 'Laporan BAP',
            url: '/bap',
            icon: ClipboardList,
            isActive: true,
        },
    ];

    // ── Menu: mahasiswa (role = user) ─────────────────────────
    const oprecItems: DropdownItem[] = [
        {
            title: 'Open Recruitment',
            url: '#',
            icon: GraduationCap,
            isActive: true,
            items: [
                { title: 'Profil Asisten', url: '/profil' },
                { title: 'Event Terbuka', url: '/oprec/events' },
                { title: 'Pendaftaran Saya', url: '/oprec/my-applications' },
            ],
        },
    ];

    // ── Menu: admin ───────────────────────────────────────────
    const adminItems: DropdownItem[] = [
        {
            title: 'Events',
            url: '/admin/events',
            icon: LucideCalendarRange,
            isActive: true,
        },
    ];

    // ── Menu: admin + dosen ───────────────────────────────────
    const seleksiItems: DropdownItem[] = [
        {
            title: 'Seleksi Asisten',
            url: '/seleksi',
            icon: ClipboardList,
            isActive: true,
        },
    ];

    // ── Menu: database asisten ─────────────────────────────────
    const databaseItems: DropdownItem[] = [
        {
            title: 'Database Asisten',
            url: '#',
            icon: Database,
            isActive: true,
            items: [
                { title: 'Semua Asisten', url: '/database' },
                { title: 'Per Event', url: '/database/event' },
            ],
        },
    ];

    const sertifikatItems: DropdownItem[] = [
        {
            title: 'Sertifikat',
            url: '/database/sertifikat',
            icon: Award,
            isActive: true,
        },
    ];

    // ── Build full nav ─────────────────────────────────────────
    const dropdownNav: DropdownItem[] = [
        ...baseMenuItems,
        ...((role === 'admin') ? dataItems : []),
        ...((role === 'admin' || role === 'dosen' || role === 'user') ? jadwalItems : []),
        ...(role === 'user' ? bapItems : []),
        ...(role === 'user' ? oprecItems : []),
        ...(role === 'admin' ? adminItems : []),
        ...((role === 'admin' || role === 'dosen') ? seleksiItems : []),
        ...((role === 'admin' || role === 'dosen') ? databaseItems : []),
        ...((role === 'admin' || role === 'dosen') ? sertifikatItems : []),
    ];

    const footerNavItems: NavItem[] = [
        { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
        { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                        {active_semester && (
                            <div className="px-3 py-1 flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Semester Aktif</span>
                                <Badge variant="outline" className="w-fit text-[11px] py-0 h-5 border-primary/30 text-primary bg-primary/5">
                                    {active_semester.nama}
                                </Badge>
                            </div>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavDropdown items={dropdownNav} mainTitle={role === 'admin' ? 'Admin' : role === 'dosen' ? 'Dosen' : 'Mahasiswa'} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
