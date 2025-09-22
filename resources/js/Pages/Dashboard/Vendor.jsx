import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatCurrency, formatNumber } from '@/Utils/currency';

export default function VendorDashboard({
    auth,
    vendor,
    productStats,
    salesStats,
    recentTransactions,
    vendorProducts,
    chartData,
    dateRange
}) {

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Vendor Dashboard - {vendor.name}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={route('products.index')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Manage Products
                        </Link>
                        <Link
                            href={route('vendors.edit', vendor.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Edit Store
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Vendor Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Sales Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(salesStats.total_revenue)}</div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Last 30 days
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600">{formatNumber(salesStats.total_transactions)}</div>
                            <div className="text-sm text-gray-600">Total Sales</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Transactions completed
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-purple-600">{formatNumber(salesStats.total_items_sold)}</div>
                            <div className="text-sm text-gray-600">Items Sold</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Units moved
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(salesStats.avg_transaction)}</div>
                            <div className="text-sm text-gray-600">Avg Transaction</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Per sale
                            </div>
                        </div>
                    </div>

                    {/* Product and Inventory Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Overview</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Products</span>
                                    <span className="font-medium">{formatNumber(productStats.total_products)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Products</span>
                                    <span className="font-medium text-green-600">{formatNumber(productStats.active_products)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Low Stock</span>
                                    <span className="font-medium text-yellow-600">{formatNumber(productStats.low_stock_products)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Out of Stock</span>
                                    <span className="font-medium text-red-600">{formatNumber(productStats.out_of_stock_products)}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route('products.create')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm text-center inline-block"
                                >
                                    Add New Product
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Products</h3>
                            <div className="space-y-3">
                                {vendorProducts.length > 0 ? vendorProducts.map((product, index) => (
                                    <div key={product.id} className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {product.category || 'Uncategorized'} • {formatCurrency(product.price)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                !product.is_available 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : product.stock_quantity === null 
                                                        ? 'bg-green-100 text-green-800'
                                                        : product.stock_quantity > 10 
                                                            ? 'bg-green-100 text-green-800'
                                                            : product.stock_quantity > 0 
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                                {!product.is_available 
                                                    ? 'Unavailable' 
                                                    : product.stock_quantity === null 
                                                        ? 'Available'
                                                        : product.stock_quantity > 0 
                                                            ? `${product.stock_quantity} left`
                                                            : 'Out of Stock'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm">No products yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={route('products.index')}
                                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm text-center"
                                >
                                    View All Products
                                </Link>
                                <Link
                                    href={route('transactions.index')}
                                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm text-center"
                                >
                                    View All Transactions
                                </Link>
                                <Link
                                    href={route('vendors.show', vendor.id)}
                                    className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm text-center"
                                >
                                    View Store Profile
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Daily Sales Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales (Last 7 Days)</h3>
                            <div className="h-64 flex items-end space-x-2">
                                {chartData.map((day, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="w-full flex flex-col items-center">
                                            <div
                                                className="w-full bg-green-500 rounded"
                                                style={{ height: `${Math.max(5, (day.revenue / Math.max(...chartData.map(d => d.revenue), 1)) * 200)}px` }}
                                                title={`Revenue: ${formatCurrency(day.revenue)}`}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 text-center">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-gray-600 text-center">
                                            {formatCurrency(day.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
                            <Link
                                href={route('transactions.index')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                View All
                            </Link>
                        </div>
                        {recentTransactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentTransactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getTransactionTypeBadge(transaction.type)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                    {formatCurrency(transaction.amount)}
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
                                                    {transaction.rfid_tag?.attendee ? (
                                                        transaction.rfid_tag.attendee.attendee_name
                                                    ) : (
                                                        <span className="text-gray-400">Anonymous</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(transaction.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Start by adding products to your store.
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href={route('products.create')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        Add Your First Product
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
