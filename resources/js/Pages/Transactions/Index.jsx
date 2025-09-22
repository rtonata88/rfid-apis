import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/Utils/currency';

export default function Index({ auth, transactions, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Auto-search with debounce
    useEffect(() => {
        if (!hasUserInteracted) return;

        const delayedSearch = setTimeout(() => {
            const hasSearch = search.trim() !== '';
            const hasType = type !== '';
            const hasDateFrom = dateFrom !== '';
            const hasDateTo = dateTo !== '';
            
            if (hasSearch || hasType || hasDateFrom || hasDateTo || 
                search !== filters.search || type !== filters.type || 
                dateFrom !== filters.date_from || dateTo !== filters.date_to) {
                
                const params = {};
                if (hasSearch) params.search = search;
                if (hasType) params.type = type;
                if (hasDateFrom) params.date_from = dateFrom;
                if (hasDateTo) params.date_to = dateTo;
                
                setIsSearching(true);
                router.get(route('transactions.index'), params, {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsSearching(false),
                });
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, type, dateFrom, dateTo, hasUserInteracted]);

    const handleSearch = () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (type) params.type = type;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        
        setIsSearching(true);
        router.get(route('transactions.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setType('');
        setDateFrom('');
        setDateTo('');
        setHasUserInteracted(true);
        setIsSearching(true);
        router.get(route('transactions.index'), {}, {
            onFinish: () => setIsSearching(false),
        });
    };

    const getTypeBadge = (type) => {
        const classes = {
            load: 'bg-green-100 text-green-800',
            spend: 'bg-purple-100 text-purple-800',
            refund: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[type] || 'bg-gray-100 text-gray-800'}`}>
                {type}
            </span>
        );
    };

    const getAmountDisplay = (transaction) => {
        const amount = parseFloat(transaction.amount);
        const sign = transaction.type === 'spend' ? '-' : '+';
        const color = transaction.type === 'spend' ? 'text-red-600' : 'text-green-600';
        
        return (
            <span className={`font-medium ${color}`}>
                {sign}{formatCurrency(amount)}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Transactions
                    </h2>
                    <div className="flex space-x-3">
                        <Link
                            href="/tags"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Manage Tags
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Transactions" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {/* Search and Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by tag, vendor, product..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    {isSearching && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <select
                                        value={type}
                                        onChange={(e) => {
                                            setType(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Types</option>
                                        <option value="load">Load</option>
                                        <option value="spend">Spend</option>
                                        <option value="refund">Refund</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        placeholder="From Date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setDateFrom(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        placeholder="To Date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSearch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex-1"
                                    >
                                        Search
                                    </button>
                                    <button
                                        onClick={handleClearFilters}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm flex-1"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {transactions?.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(transactions.summary.total_loaded || 0)}
                                </div>
                                <div className="text-sm text-gray-600">Total Loaded</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {transactions.summary.load_count || 0} transactions
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(transactions.summary.total_spent || 0)}
                                </div>
                                <div className="text-sm text-gray-600">Total Spent</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {transactions.summary.spend_count || 0} transactions
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(transactions.summary.total_refunded || 0)}
                                </div>
                                <div className="text-sm text-gray-600">Total Refunded</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {transactions.summary.refund_count || 0} transactions
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="text-2xl font-bold text-blue-600">
                                    {transactions.summary.total_transactions || 0}
                                </div>
                                <div className="text-sm text-gray-600">Total Transactions</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    All time
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results count */}
                    {transactions?.data && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {transactions.total > 0 ? (
                                    <>
                                        Showing {transactions.from} to {transactions.to} of {transactions.total} transaction{transactions.total !== 1 ? 's' : ''}
                                        {(search || type || dateFrom || dateTo) && (
                                            <span className="text-blue-600"> (filtered)</span>
                                        )}
                                    </>
                                ) : (
                                    search || type || dateFrom || dateTo ? 'No transactions match your search criteria' : 'No transactions found'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Transactions Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tag
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor/Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions?.data?.length > 0 ? transactions.data.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTypeBadge(transaction.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {transaction.rfid_tag?.short_code || 'N/A'}
                                                    </div>
                                                    {transaction.rfid_tag?.attendee && (
                                                        <div className="text-sm text-gray-500">
                                                            {transaction.rfid_tag.attendee.attendee_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getAmountDisplay(transaction)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    Before: {formatCurrency(transaction.balance_before)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    After: {formatCurrency(transaction.balance_after)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {transaction.vendor ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction.vendor.name}
                                                        </div>
                                                        {transaction.product && (
                                                            <div className="text-sm text-gray-500">
                                                                {transaction.product.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">System</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {transaction.description || 'No description'}
                                                </div>
                                                {transaction.reference && (
                                                    <div className="text-xs text-gray-500">
                                                        Ref: {transaction.reference}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(transaction.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(transaction.created_at).toLocaleTimeString()}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                        {search || type || dateFrom || dateTo ? 'No matching transactions' : 'No transactions yet'}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {search || type || dateFrom || dateTo 
                                                            ? 'Try adjusting your search filters.' 
                                                            : 'Transactions will appear here once tags are used.'
                                                        }
                                                    </p>
                                                    {!(search || type || dateFrom || dateTo) && (
                                                        <div className="mt-6">
                                                            <Link
                                                                href="/tags"
                                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                View Tags
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {transactions?.links?.length > 3 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {transactions?.from} to {transactions?.to} of {transactions?.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {transactions?.links?.map((link, index) => (
                                            link.url ? (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={`px-3 py-2 text-sm rounded-md ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
