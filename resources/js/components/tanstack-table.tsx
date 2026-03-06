import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableProps } from '@/interface/TableProps';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';

type PaginationState = {
    pageIndex: number;
    pageSize: number;
};

interface ServerSideDataTableProps<TData, TValue> extends DataTableProps<TData, TValue> {
    pagination: PaginationState;
    onPaginationChange: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void;
    pageCount: number;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    pagination,
    onPaginationChange,
    pageCount,
    sorting,
    onSortingChange,
}: ServerSideDataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        pageCount,
        manualPagination: true,
        manualSorting: true,
        state: {
            pagination,
            sorting,
        },
        onPaginationChange,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange,
        getSortedRowModel: getSortedRowModel(),
    });

    function renderPageNumbers({
        pageIndex,
        pageCount,
        setPageIndex,
    }: {
        pageIndex: number;
        pageCount: number;
        setPageIndex: (index: number) => void;
    }) {
        const pages: (number | 'dots')[] = [];

        const visiblePages = 3;
        const start = Math.max(1, pageIndex + 1 - 1);
        const end = Math.min(pageCount, start + visiblePages - 1);

        if (start > 2) {
            pages.push(1, 'dots');
        } else {
            for (let i = 1; i < start; i++) pages.push(i);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < pageCount - 1) {
            pages.push('dots', pageCount);
        } else {
            for (let i = end + 1; i <= pageCount; i++) pages.push(i);
        }

        return pages.map((page, idx) => {
            if (page === 'dots') {
                return (
                    <span key={`dots-${idx}`} className="text-muted-foreground px-2">
                        <MoreHorizontal className="h-4 w-4" />
                    </span>
                );
            }

            const isActive = page === pageIndex + 1;
            return (
                <Button key={page} variant={isActive ? 'default' : 'outline'} size="sm" onClick={() => setPageIndex(page - 1)} className="px-3">
                    {page}
                </Button>
            );
        });
    }

    return (
        <div className="space-y-4 p-4">
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <ChevronUp size={14} />,
                                                    desc: <ChevronDown size={14} />,
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-muted-foreground py-6 text-center text-sm">
                                        Data kosong
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} size="sm" variant="outline">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            {renderPageNumbers({
                                pageIndex: table.getState().pagination.pageIndex,
                                pageCount: table.getPageCount(),
                                setPageIndex: table.setPageIndex,
                            })}
                            <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} size="sm" variant="outline">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm">Rows per page:</span>
                            <select
                                value={table.getState().pagination.pageSize}
                                onChange={(e) => table.setPageSize(Number(e.target.value))}
                                className="rounded border px-2 py-1 text-sm"
                            >
                                {[10, 20, 30, 40, 50].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
