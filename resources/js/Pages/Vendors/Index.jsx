import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/Utils/currency';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ auth, vendors, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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

    const handleCreateVendor = (e) => {
        e.preventDefault();
        
        post(route('vendors.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
            onError: () => {
                // Errors are automatically handled by Inertia
            }
        });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        clearErrors();
        reset();
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
                    {auth.user.user_type === 'SUPER_ADMIN' && (
                        <PrimaryButton
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm font-medium"
                        >
                            Create New Vendor
                        </PrimaryButton>
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
                                                    {!(search || status) && auth.user.user_type === 'SUPER_ADMIN' && (
                                                        <div className="mt-6">
                                                            <PrimaryButton
                                                                onClick={() => setShowCreateModal(true)}
                                                                className="shadow-sm"
                                                            >
                                                                Create Vendor
                                                            </PrimaryButton>
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
            <Modal show={showCreateModal} onClose={closeModal} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Create New Vendor</h3>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreateVendor} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <InputLabel htmlFor="vendor_name" value="Vendor Name" />
                                <TextInput
                                    id="vendor_name"
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Enter vendor name"
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="vendor_description" value="Description" />
                                <textarea
                                    id="vendor_description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Describe the vendor's business..."
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="contact_person" value="Contact Person" />
                                    <TextInput
                                        id="contact_person"
                                        type="text"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Full name"
                                    />
                                    <InputError message={errors.contact_person} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="contact_email" value="Contact Email" />
                                    <TextInput
                                        id="contact_email"
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(e) => setData('contact_email', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="contact@vendor.com"
                                    />
                                    <InputError message={errors.contact_email} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="contact_phone" value="Contact Phone" />
                                    <TextInput
                                        id="contact_phone"
                                        type="tel"
                                        value={data.contact_phone}
                                        onChange={(e) => setData('contact_phone', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="+264 81 123 4567"
                                    />
                                    <InputError message={errors.contact_phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="vendor_status" value="Status" />
                                    <select
                                        id="vendor_status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <InputError message={errors.status} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <SecondaryButton
                                type="button"
                                onClick={closeModal}
                                disabled={processing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="relative"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Vendor'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
