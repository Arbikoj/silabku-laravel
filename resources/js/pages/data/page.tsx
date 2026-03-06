import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data',
        href: '/data',
    },
];

const cards = [
    { title: 'Guru', href: '/data/guru' },
    { title: 'Mapel', href: '/data/mapel' },
    { title: 'Jurusan', href: '/data/jurusan' },
    { title: 'Kelas', href: '/data/kelas' },
    { title: 'Jam Pelajaran', href: '/data/jam' },
];

export default function DataPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {cards.map((card, index) => (
                        <Link
                            key={index}
                            href={card.href}
                            className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border text-xl font-semibold transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {card.title}
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
