import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/Utils/currency';

export default function Index({ auth, tags, filters = {} }) {
    console.log('Index component props:', { auth, tags, filters });

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [issued, setIssued] = useState(filters.issued || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Auto-search with debounce - only after user has interacted
    useEffect(() => {
        if (!hasUserInteracted) return;

        const delayedSearch = setTimeout(() => {
            // Only search if values have actually changed and contain meaningful data
            const hasSearch = search.trim() !== '';
            const hasStatus = status !== '';
            const hasIssued = issued !== '';
            
            if (hasSearch || hasStatus || hasIssued || 
                search !== filters.search || status !== filters.status || issued !== filters.issued) {
                
                const params = {};
                if (hasSearch) params.search = search;
                if (hasStatus) params.status = status;
                if (hasIssued) params.issued = issued;
                
                setIsSearching(true);
                router.get(route('tags.index'), params, {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsSearching(false),
                });
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, status, issued, hasUserInteracted]);

    // Early return if no tags data
    if (!tags) {
        return (
            <AuthenticatedLayout>
                <Head title="RFID Tags" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <p>Loading tags...</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const handleSearch = () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (status) params.status = status;
        if (issued) params.issued = issued;
        
        setIsSearching(true);
        router.get(route('tags.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setIssued('');
        setHasUserInteracted(true);
        setIsSearching(true);
        router.get(route('tags.index'), {}, {
            onFinish: () => setIsSearching(false),
        });
    };

    const handleDelete = (id) => {
        if (id && confirm('Are you sure you want to delete this tag?')) {
            router.delete(route('tags.destroy', id));
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            blocked: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[status] || classes.inactive}`}>
                {status}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        RFID Tags
                    </h2>
                    <Link
                        href={route('tags.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Create New Tag
                    </Link>
                </div>
            }
        >
            <Head title="RFID Tags" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {/* Search and Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by tag ID, attendee name, email..."
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
                                        value={status}
                                        onChange={(e) => {
                                            setStatus(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                                <div>
                                    <select
                                        value={issued}
                                        onChange={(e) => {
                                            setIssued(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Tags</option>
                                        <option value="1">Issued Only</option>
                                        <option value="0">Unissued Only</option>
                                    </select>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSearch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                    >
                                        Search
                                    </button>
                                    <button
                                        onClick={handleClearFilters}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    {tags?.data && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {tags.total > 0 ? (
                                    <>
                                        Showing {tags.from} to {tags.to} of {tags.total} tag{tags.total !== 1 ? 's' : ''}
                                        {(search || status || issued) && (
                                            <span className="text-blue-600"> (filtered)</span>
                                        )}
                                    </>
                                ) : (
                                    search || status || issued ? 'No tags match your search criteria' : 'No tags found'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Tags Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tag Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Attendee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tags?.data?.length > 0 ? tags.data.map((tag) => (
                                        <tr key={tag.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {tag.short_code}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {tag.embedded_number && (
                                                            <span>Embedded: {tag.embedded_number}</span>
                                                        )}
                                                    </div>
                                                    {tag.tag_uid && (
                                                        <div className="text-xs text-gray-400 font-mono">
                                                            UID: {tag.tag_uid.length > 16 ? `${tag.tag_uid.substring(0, 16)}...` : tag.tag_uid}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    {getStatusBadge(tag.status)}
                                                    {tag.is_issued ? (
                                                        <span className="text-xs text-green-600">Issued</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">Not Issued</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(tag.balance)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {tag.transactions?.length || 0} transactions
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {tag.attendee ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {tag.attendee.attendee_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {tag.attendee.attendee_email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Unlinked</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(tag.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                {tag.id ? (
                                                    <Link
                                                        href={route('tags.show', tag.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-400">View</span>
                                                )}
                                                {tag.id ? (
                                                    <Link
                                                        href={route('tags.edit', tag.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-400">Edit</span>
                                                )}
                                                {!tag.attendee && tag.transactions?.length === 0 && (
                                                    <button
                                                        onClick={() => handleDelete(tag.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                        {search || status || issued ? 'No matching tags' : 'No tags yet'}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {search || status || issued 
                                                            ? 'Try adjusting your search filters or create a new tag.' 
                                                            : 'Get started by creating your first RFID tag.'
                                                        }
                                                    </p>
                                                    {!(search || status || issued) && (
                                                        <div className="mt-6">
                                                            <Link
                                                                href={route('tags.create')}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                Create Tag
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
                        {tags?.links?.length > 3 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {tags?.from} to {tags?.to} of {tags?.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {tags?.links?.map((link, index) => (
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