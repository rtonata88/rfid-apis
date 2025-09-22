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

export default function Index({ auth, products, filters = {}, categories = [], vendors = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [available, setAvailable] = useState(filters.available || '');
    const [vendorId, setVendorId] = useState(filters.vendor_id || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        vendor_id: auth.user.user_type === 'VENDOR' ? auth.user.vendor?.id || '' : '',
        name: '',
        description: '',
        price: '',
        sku: '',
        category: '',
        is_available: true,
        stock_quantity: '',
        image_url: ''
    });

    // Auto-search with debounce
    useEffect(() => {
        if (!hasUserInteracted) return;

        const delayedSearch = setTimeout(() => {
            const hasSearch = search.trim() !== '';
            const hasCategory = category !== '';
            const hasAvailable = available !== '';
            const hasVendor = vendorId !== '';
            
            if (hasSearch || hasCategory || hasAvailable || hasVendor ||
                search !== filters.search || category !== filters.category || 
                available !== filters.available || vendorId !== filters.vendor_id) {
                
                const params = {};
                if (hasSearch) params.search = search;
                if (hasCategory) params.category = category;
                if (hasAvailable) params.available = available;
                if (hasVendor) params.vendor_id = vendorId;
                
                setIsSearching(true);
                router.get(route('products.index'), params, {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsSearching(false),
                });
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, category, available, vendorId, hasUserInteracted]);

    const handleSearch = () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (available !== '') params.available = available;
        if (vendorId) params.vendor_id = vendorId;
        
        setIsSearching(true);
        router.get(route('products.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('');
        setAvailable('');
        setVendorId('');
        setHasUserInteracted(true);
        setIsSearching(true);
        router.get(route('products.index'), {}, {
            onFinish: () => setIsSearching(false),
        });
    };

    const handleCreateProduct = (e) => {
        e.preventDefault();
        
        post(route('products.store'), {
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
        reset({
            vendor_id: auth.user.user_type === 'VENDOR' ? auth.user.vendor?.id || '' : '',
            name: '',
            description: '',
            price: '',
            sku: '',
            category: '',
            is_available: true,
            stock_quantity: '',
            image_url: ''
        });
    };

    const getAvailabilityBadge = (isAvailable, stockQuantity) => {
        if (!isAvailable) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Unavailable</span>;
        }
        
        if (stockQuantity === null) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>;
        }
        
        if (stockQuantity > 10) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>;
        } else if (stockQuantity > 0) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
        } else {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>;
        }
    };

    const canManageProducts = auth.user.user_type === 'EVENT_ADMIN' || 
                             auth.user.user_type === 'SUPER_ADMIN' || 
                             auth.user.user_type === 'VENDOR';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Products
                    </h2>
                    {canManageProducts && (
                        <PrimaryButton
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm font-medium"
                        >
                            Add New Product
                        </PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title="Products" />

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
                                        placeholder="Search products..."
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
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <select
                                        value={available}
                                        onChange={(e) => {
                                            setAvailable(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Products</option>
                                        <option value="true">Available Only</option>
                                        <option value="false">Unavailable Only</option>
                                    </select>
                                </div>

                                {(auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && vendors.length > 0 && (
                                    <div>
                                        <select
                                            value={vendorId}
                                            onChange={(e) => {
                                                setVendorId(e.target.value);
                                                setHasUserInteracted(true);
                                            }}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">All Vendors</option>
                                            {vendors.map((vendor) => (
                                                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex space-x-2 mt-4">
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

                    {/* Results count */}
                    {products?.data && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {products.total > 0 ? (
                                    <>
                                        Showing {products.from} to {products.to} of {products.total} product{products.total !== 1 ? 's' : ''}
                                        {(search || category || available || vendorId) && (
                                            <span className="text-blue-600"> (filtered)</span>
                                        )}
                                    </>
                                ) : (
                                    search || category || available || vendorId ? 'No products match your search criteria' : 'No products found'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Products Grid */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {products?.data?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {products.data.map((product) => (
                                    <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        {product.image_url && (
                                            <div className="mb-4">
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name}
                                                    className="w-full h-48 object-cover rounded-md"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                                {product.category && (
                                                    <p className="text-sm text-gray-500">{product.category}</p>
                                                )}
                                            </div>

                                            {product.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {product.description.length > 100 
                                                        ? `${product.description.substring(0, 100)}...`
                                                        : product.description
                                                    }
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <div className="text-lg font-bold text-green-600">
                                                    {formatCurrency(product.price)}
                                                </div>
                                                {getAvailabilityBadge(product.is_available, product.stock_quantity)}
                                            </div>

                                            {product.sku && (
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            )}

                                            <div className="text-sm text-gray-500">
                                                Stock: {product.stock_quantity ?? 'Unlimited'}
                                            </div>

                                            {(auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && (
                                                <div className="text-sm text-gray-500">
                                                    Vendor: {product.vendor?.name}
                                                </div>
                                            )}

                                            <div className="flex space-x-2 pt-2">
                                                <Link
                                                    href={route('products.show', product.id)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    View
                                                </Link>
                                                {canManageProducts && (
                                                    <>
                                                        <Link
                                                            href={route('products.edit', product.id)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {search || category || available || vendorId ? 'No matching products' : 'No products yet'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {search || category || available || vendorId 
                                        ? 'Try adjusting your search filters.' 
                                        : 'Get started by adding your first product.'
                                    }
                                </p>
                                {!(search || category || available || vendorId) && canManageProducts && (
                                    <div className="mt-6">
                                        <PrimaryButton
                                            onClick={() => setShowCreateModal(true)}
                                            className="shadow-sm"
                                        >
                                            Add Product
                                        </PrimaryButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {products?.links?.length > 3 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {products?.from} to {products?.to} of {products?.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {products?.links?.map((link, index) => (
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

            {/* Create Product Modal */}
            <Modal show={showCreateModal} onClose={closeModal} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Add New Product</h3>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreateProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN') && vendors.length > 0 && (
                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="vendor_id" value="Vendor" />
                                    <select
                                        id="vendor_id"
                                        value={data.vendor_id}
                                        onChange={(e) => setData('vendor_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select a vendor</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.vendor_id} className="mt-2" />
                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="name" value="Product Name" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Enter product name"
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="price" value="Price" />
                                <TextInput
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="0.00"
                                />
                                <InputError message={errors.price} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="sku" value="SKU" />
                                <TextInput
                                    id="sku"
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Product SKU"
                                />
                                <InputError message={errors.sku} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="category" value="Category" />
                                <TextInput
                                    id="category"
                                    type="text"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Product category"
                                />
                                <InputError message={errors.category} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="stock_quantity" value="Stock Quantity" />
                                <TextInput
                                    id="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={data.stock_quantity}
                                    onChange={(e) => setData('stock_quantity', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Leave blank for unlimited"
                                />
                                <InputError message={errors.stock_quantity} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="image_url" value="Image URL" />
                                <TextInput
                                    id="image_url"
                                    type="url"
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="https://example.com/image.jpg"
                                />
                                <InputError message={errors.image_url} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="description" value="Description" />
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Describe the product..."
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.is_available}
                                        onChange={(e) => setData('is_available', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Product is available for sale</span>
                                </label>
                                <InputError message={errors.is_available} className="mt-2" />
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
                                    'Create Product'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
