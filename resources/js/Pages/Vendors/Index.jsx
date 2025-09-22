import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/Utils/currency';

export default function Index({ auth, vendors, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        description: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        status: 'active'
    });

    // Auto-search with debounce
    useEffect(() => {
        if (!hasUserInteracted) return;

        const delayedSearch = setTimeout(() => {
            const hasSearch = search.trim() !== '';
            const hasStatus = status !== '';
            
            if (hasSearch || hasStatus || 
                search !== filters.search || status !== filters.status) {
                
                const params = {};
                if (hasSearch) params.search = search;
                if (hasStatus) params.status = status;
                
                setIsSearching(true);
                router.get(route('vendors.index'), params, {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsSearching(false),
                });
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, status, hasUserInteracted]);

    const handleSearch = () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (status) params.status = status;
        
        setIsSearching(true);
        router.get(route('vendors.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setHasUserInteracted(true);
        setIsSearching(true);
        router.get(route('vendors.index'), {}, {
            onFinish: () => setIsSearching(false),
        });
    };

    const handleCreateVendor = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/vendors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: JSON.stringify(newVendor),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewVendor({
                    name: '',
                    description: '',
                    contact_person: '',
                    contact_email: '',
                    contact_phone: '',
                    status: 'active'
                });
                router.reload();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create vendor');
            }
        } catch (error) {
            alert('Failed to create vendor');
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
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
                        Vendors
                    </h2>
                    {(auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Create New Vendor
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Vendors" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {/* Search and Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, contact person, email..."
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
                    {vendors?.data && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {vendors.total > 0 ? (
                                    <>
                                        Showing {vendors.from} to {vendors.to} of {vendors.total} vendor{vendors.total !== 1 ? 's' : ''}
                                        {(search || status) && (
                                            <span className="text-blue-600"> (filtered)</span>
                                        )}
                                    </>
                                ) : (
                                    search || status ? 'No vendors match your search criteria' : 'No vendors found'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Vendors Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Products
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
                                    {vendors?.data?.length > 0 ? vendors.data.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {vendor.name}
                                                    </div>
                                                    {vendor.description && (
                                                        <div className="text-sm text-gray-500">
                                                            {vendor.description.length > 50 
                                                                ? `${vendor.description.substring(0, 50)}...`
                                                                : vendor.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(vendor.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vendor.contact_person && (
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {vendor.contact_person}
                                                    </div>
                                                )}
                                                {vendor.contact_email && (
                                                    <div className="text-sm text-gray-500">
                                                        {vendor.contact_email}
                                                    </div>
                                                )}
                                                {vendor.contact_phone && (
                                                    <div className="text-sm text-gray-500">
                                                        {vendor.contact_phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {vendor.products_count || 0} products
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(vendor.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <Link
                                                    href={`/vendors/${vendor.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </Link>
                                                {(auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && (
                                                    <Link
                                                        href={`/vendors/${vendor.id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                        {search || status ? 'No matching vendors' : 'No vendors yet'}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {search || status 
                                                            ? 'Try adjusting your search filters.' 
                                                            : 'Get started by creating your first vendor.'
                                                        }
                                                    </p>
                                                    {!(search || status) && (auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && (
                                                        <div className="mt-6">
                                                            <button
                                                                onClick={() => setShowCreateModal(true)}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                Create Vendor
                                                            </button>
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
                        {vendors?.links?.length > 3 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {vendors?.from} to {vendors?.to} of {vendors?.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {vendors?.links?.map((link, index) => (
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

            {/* Create Vendor Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Create New Vendor</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateVendor} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newVendor.name}
                                        onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={newVendor.description}
                                        onChange={(e) => setNewVendor({...newVendor, description: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                    <input
                                        type="text"
                                        value={newVendor.contact_person}
                                        onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                    <input
                                        type="email"
                                        value={newVendor.contact_email}
                                        onChange={(e) => setNewVendor({...newVendor, contact_email: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={newVendor.contact_phone}
                                        onChange={(e) => setNewVendor({...newVendor, contact_phone: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={newVendor.status}
                                        onChange={(e) => setNewVendor({...newVendor, status: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                    >
                                        Create Vendor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
