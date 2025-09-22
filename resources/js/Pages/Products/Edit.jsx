import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Edit({ auth, product, vendors = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        vendor_id: product.vendor_id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        sku: product.sku || '',
        category: product.category || '',
        is_available: product.is_available,
        stock_quantity: product.stock_quantity || '',
        image_url: product.image_url || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('products.update', product.id));
    };

    const canEditVendor = auth.user.user_type === 'EVENT_ADMIN' || auth.user.user_type === 'SUPER_ADMIN';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Product: {product.name}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={route('products.show', product.id)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                            View Product
                        </Link>
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
            <Head title={`Edit Product: ${product.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {canEditVendor && vendors.length > 0 && (
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
                                        <p className="mt-1 text-sm text-gray-500">
                                            Current stock will be updated to this value
                                        </p>
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
                                            rows={4}
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
                                        onClick={() => window.history.back()}
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
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Product'
                                        )}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Current Product Image Preview */}
                    {product.image_url && (
                        <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Product Image</h3>
                                <div className="max-w-md">
                                    <img 
                                        src={product.image_url} 
                                        alt={product.name}
                                        className="w-full h-64 object-cover rounded-md border border-gray-200"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
