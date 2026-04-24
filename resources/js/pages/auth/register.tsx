import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    nim: string;
    email: string;
    nama_lengkap: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        nim: '',
        email: '',
        nama_lengkap: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Buat Akun Baru" description="Isi data di bawah untuk membuat akun mahasiswa">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nama_lengkap" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap</Label>
                        <Input
                            id="nama_lengkap"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.nama_lengkap}
                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                            disabled={processing}
                            placeholder="Nama Lengkap sesuai KTP"
                            className="rounded-xl"
                        />
                        <InputError message={errors.nama_lengkap} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Username</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                tabIndex={2}
                                autoComplete="username"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="Username"
                                className="rounded-xl"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nim" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">NIM</Label>
                            <Input
                                id="nim"
                                type="text"
                                required
                                tabIndex={3}
                                autoComplete="off"
                                value={data.nim}
                                onChange={(e) => setData('nim', e.target.value)}
                                disabled={processing}
                                placeholder="Nomor Induk Mahasiswa"
                                className="rounded-xl"
                            />
                            <InputError message={errors.nim} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={4}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                            className="rounded-xl"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password" title="password label" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={5}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="Password"
                                className="rounded-xl"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Konfirmasi</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={6}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="Ulangi password"
                                className="rounded-xl"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>
                    </div>

                    <Button type="submit" className="mt-4 w-full rounded-full h-11 font-bold shadow-lg shadow-primary/20" tabIndex={7} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Buat Akun Sekarang
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Sudah punya akun?{' '}
                    <TextLink href={route('login')} className="font-bold underline underline-offset-4 decoration-primary/30 hover:decoration-primary" tabIndex={8}>
                        Masuk Disini
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
