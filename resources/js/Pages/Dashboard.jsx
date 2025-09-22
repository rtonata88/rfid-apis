import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency, formatNumber } from '@/Utils/currency';

export default function Dashboard({
    auth,
    stats,
    financialStats,
    transactionStats,
    recentTransactions,
    topVendors,
    recentProducts,
    chartData,
    dateRange
}) {

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        HiEvents Dashboard
                    </h2>
                    <div className="text-sm text-gray-600">
                        {dateRange.start_date} to {dateRange.end_date}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.total_tags)}</div>
                            <div className="text-sm text-gray-600">Total RFID Tags</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatNumber(stats.active_tags)} active, {formatNumber(stats.issued_tags)} issued
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(financialStats.total_loaded)}</div>
                            <div className="text-sm text-gray-600">Total Loaded</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatNumber(transactionStats.load_transactions)} transactions
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(financialStats.total_spent)}</div>
                            <div className="text-sm text-gray-600">Total Spent</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatNumber(transactionStats.spend_transactions)} transactions
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialStats.total_balance)}</div>
                            <div className="text-sm text-gray-600">Total Balance</div>
                            <div className="text-xs text-gray-500 mt-1">
                                In circulation
                            </div>
                        </div>
                    </div>

                    {/* Vendor and System Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vendors</span>
                                    <span className="font-medium">{formatNumber(stats.total_vendors)} ({formatNumber(stats.active_vendors)} active)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Products</span>
                                    <span className="font-medium">{formatNumber(stats.total_products)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Users</span>
                                    <span className="font-medium">{formatNumber(stats.total_users)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Refunded</span>
                                    <span className="font-medium text-red-600">{formatCurrency(financialStats.total_refunded)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Vendors</h3>
                            <div className="space-y-3">
                                {topVendors.map((vendor, index) => (
                                    <div key={vendor.id} className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{vendor.name}</div>
                                            <div className="text-xs text-gray-500">{formatNumber(vendor.transaction_count)} sales</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-green-600">{formatCurrency(vendor.total_sales)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Products</h3>
                            <div className="space-y-3">
                                {recentProducts.map((product, index) => (
                                    <div key={product.id} className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {product.category || 'Uncategorized'} • {product.vendor?.name}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-purple-600">{formatCurrency(product.price)}</div>
                                            <div className={`text-xs ${product.is_available ? 'text-green-600' : 'text-red-600'}`}>
                                                {product.is_available ? 'Available' : 'Unavailable'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Daily Activity Chart */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity (Last 7 Days)</h3>
                        <div className="h-64 flex items-end space-x-2">
                            {chartData.map((day, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center space-y-1">
                                        <div
                                            className="w-full bg-green-500 rounded-t"
                                            style={{ height: `${Math.max(5, (day.loaded / Math.max(...chartData.map(d => d.loaded), 1)) * 200)}px` }}
                                            title={`Loaded: ${formatCurrency(day.loaded)}`}
                                        ></div>
                                        <div
                                            className="w-full bg-purple-500 rounded-b"
                                            style={{ height: `${Math.max(5, (day.spent / Math.max(...chartData.map(d => d.spent), 1)) * 200)}px` }}
                                            title={`Spent: ${formatCurrency(day.spent)}`}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 text-center">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-6 mt-4">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                                <span className="text-sm text-gray-600">Money Loaded</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                                <span className="text-sm text-gray-600">Money Spent</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${transaction.type === 'load' ? 'bg-green-100 text-green-800' :
                                                      transaction.type === 'spend' ? 'bg-purple-100 text-purple-800' :
                                                      'bg-red-100 text-red-800'}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.rfid_tag?.short_code || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.vendor?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.product?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
