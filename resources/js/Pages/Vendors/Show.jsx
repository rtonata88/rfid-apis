import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/currency';

export default function Show({ auth, vendor, salesStats, recentTransactions, topProducts }) {

    const getStatusBadge = (status) => {
        const classes = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${classes[status] || classes.inactive}`}>
                {status}
            </span>
        );
    };

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

    const canEdit = auth.user.user_type === 'EVENT_ADMIN' || 
                   auth.user.user_type === 'SUPER_ADMIN' || 
                   (auth.user.user_type === 'VENDOR' && vendor.user_id === auth.user.id);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Vendor: {vendor.name}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={route('products.index', { vendor_id: vendor.id })}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Manage Products
                        </Link>
                        {canEdit && (
                            <Link
                                href={route('vendors.edit', vendor.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                                Edit Vendor
                            </Link>
                        )}
                        <Link
                            href={route('vendors.index')}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                            Back to Vendors
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Vendor: ${vendor.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Vendor Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">Vendor Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Vendor Name</label>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">{vendor.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            {getStatusBadge(vendor.status)}
                                        </div>
                                    </div>

                                    {vendor.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Description</label>
                                            <p className="mt-1 text-sm text-gray-900">{vendor.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Products</label>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{vendor.products_count || 0}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Terminals</label>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{vendor.terminals ? vendor.terminals.length : 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {vendor.contact_person && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                                            <p className="mt-1 text-sm text-gray-900">{vendor.contact_person}</p>
                                        </div>
                                    )}

                                    {vendor.contact_email && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Contact Email</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                <a href={`mailto:${vendor.contact_email}`} className="text-blue-600 hover:text-blue-800">
                                                    {vendor.contact_email}
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    {vendor.contact_phone && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                <a href={`tel:${vendor.contact_phone}`} className="text-blue-600 hover:text-blue-800">
                                                    {vendor.contact_phone}
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Created</label>
                                        <p className="mt-1 text-sm text-gray-900">{new Date(vendor.created_at).toLocaleString()}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                                        <p className="mt-1 text-sm text-gray-900">{new Date(vendor.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Statistics */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(salesStats.total_sales || 0)}</div>
                                    <div className="text-sm text-gray-500">Total Sales</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{salesStats.total_transactions || 0}</div>
                                    <div className="text-sm text-gray-500">Total Transactions</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(salesStats.avg_transaction || 0)}</div>
                                    <div className="text-sm text-gray-500">Average Transaction</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    {topProducts && topProducts.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        {product.sku && (
                                                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.category || 'Uncategorized'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(product.price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.total_sold || 0} units
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                        {formatCurrency(product.total_revenue || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            product.stock_quantity > 10 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : product.stock_quantity > 0 
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {product.stock_quantity || 0} left
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    {recentTransactions && recentTransactions.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentTransactions.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getTransactionTypeBadge(transaction.type)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <span className={transaction.type === 'spend' ? 'text-red-600' : 'text-green-600'}>
                                                            {transaction.type === 'spend' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.rfid_tag ? (
                                                            <Link 
                                                                href={route('tags.show', transaction.rfid_tag.id)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                {transaction.rfid_tag.short_code}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                        {transaction.rfid_tag?.attendee && (
                                                            <div className="text-xs text-gray-500">
                                                                {transaction.rfid_tag.attendee.attendee_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {transaction.product ? (
                                                            <div>
                                                                <div className="font-medium">{transaction.product.name}</div>
                                                                {transaction.quantity > 1 && (
                                                                    <div className="text-xs text-gray-500">Qty: {transaction.quantity}</div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.user ? transaction.user.name : 'System'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(transaction.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vendor Terminals */}
                    {vendor.terminals && vendor.terminals.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Terminals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {vendor.terminals.map((terminal) => (
                                        <div key={terminal.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="font-medium text-gray-900">{terminal.name}</div>
                                            {terminal.description && (
                                                <div className="text-sm text-gray-500 mt-1">{terminal.description}</div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-2">
                                                ID: {terminal.id}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Data States */}
                    {(!recentTransactions || recentTransactions.length === 0) && 
                     (!topProducts || topProducts.length === 0) && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-12 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No transaction data yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    This vendor hasn't processed any transactions yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
