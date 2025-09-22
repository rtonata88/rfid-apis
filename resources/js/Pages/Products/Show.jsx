import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/currency';

export default function Show({ auth, product }) {

    const getTransactionTypeBadge = (type) => {
        const classes = {
            load: 'bg-green-100 text-green-800',
            spend: 'bg-purple-100 text-purple-800',
            refund: 'bg-blue-100 text-blue-800',
            adjustment: 'bg-yellow-100 text-yellow-800',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[type] || classes.load}`}>
                {type}
            </span>
        );
    };

    const getAvailabilityBadge = (isAvailable, stockQuantity) => {
        if (!isAvailable) {
            return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">Unavailable</span>;
        }
        
        if (stockQuantity === null) {
            return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>;
        }
        
        if (stockQuantity > 10) {
            return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>;
        } else if (stockQuantity > 0) {
            return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
        } else {
            return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>;
        }
    };

    const canEdit = auth.user.user_type === 'EVENT_ADMIN' || 
                   auth.user.user_type === 'SUPER_ADMIN' || 
                   (auth.user.user_type === 'VENDOR' && product.vendor?.user_id === auth.user.id);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Product: {product.name}
                    </h2>
                    <div className="flex space-x-2">
                        {canEdit && (
                            <Link
                                href={route('products.edit', product.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                                Edit Product
                            </Link>
                        )}
                        <Link
                            href={route('products.index')}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                            Back to Products
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Product: ${product.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Product Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Product Image */}
                                <div>
                                    {product.image_url ? (
                                        <img 
                                            src={product.image_url} 
                                            alt={product.name}
                                            className="w-full h-96 object-cover rounded-lg border border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 ${product.image_url ? 'hidden' : ''}`}>
                                        <div className="text-center">
                                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-500">No image available</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                                        {product.category && (
                                            <p className="text-lg text-gray-500 mt-1">{product.category}</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-3xl font-bold text-green-600">
                                            {formatCurrency(product.price)}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Availability</label>
                                        {getAvailabilityBadge(product.is_available, product.stock_quantity)}
                                    </div>

                                    {product.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                                            <p className="text-gray-900 leading-relaxed">{product.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {product.sku && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500">SKU</label>
                                                <p className="mt-1 text-sm font-mono text-gray-900">{product.sku}</p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Stock</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.stock_quantity === null ? 'Unlimited' : `${product.stock_quantity} units`}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Vendor</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            <Link 
                                                href={route('vendors.show', product.vendor.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {product.vendor.name}
                                            </Link>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Created</label>
                                            <p className="mt-1">{new Date(product.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Updated</label>
                                            <p className="mt-1">{new Date(product.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
