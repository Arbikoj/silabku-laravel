import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const PASTEL_PALETTE = [
    '#F3C09F', '#FEE1BB', '#E083AC', '#69AAAF', '#908DCE',
    '#BC6C54', '#57B9FF', '#575799', '#8DD691', '#7A4179'
];

export function getCourseColor(color?: string | null, id?: number) {
    if (color && PASTEL_PALETTE.includes(color.toUpperCase())) return color;
    if (id !== undefined) return PASTEL_PALETTE[id % PASTEL_PALETTE.length];
    return PASTEL_PALETTE[0];
}

export function getContrastColor(hexColor: string) {
    // Remove hash if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate YIQ luminance
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return dark gray for light backgrounds, white for dark backgrounds
    return yiq >= 128 ? '#1a1a1a' : '#ffffff';
}

export function formatDateIndonesia(dateString: string | null | undefined) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date) + ' WIB';
    } catch {
        return '-';
    }
}

export function toLocalISO(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${mins}`;
    } catch {
        return '';
    }
}

