import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/currency';

export default function Show({ auth, tag, transactionSummary }) {

    const getStatusBadge = (status) => {
        const classes = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            blocked: 'bg-red-100 text-red-800',
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
                        RFID Tag: {tag.short_code}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={route('tags.edit', tag.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Edit Tag
                        </Link>
                        <Link
                            href={route('tags.index')}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                            Back to Tags
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Tag: ${tag.short_code}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Tag Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">Tag Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Short Code</label>
                                        <p className="mt-1 text-lg font-mono font-bold text-gray-900">{tag.short_code}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            {getStatusBadge(tag.status)}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                                        <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(tag.balance)}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Issued Status</label>
                                        <p className="mt-1">
                                            <span className={`px-2 py-1 text-xs rounded-full ${tag.is_issued ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {tag.is_issued ? 'Issued' : 'Not Issued'}
                                            </span>
                                            {tag.issued_at && (
                                                <span className="ml-2 text-sm text-gray-500">
                                                    on {new Date(tag.issued_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tag.tag_uid && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Tag UID</label>
                                            <p className="mt-1 text-sm font-mono text-gray-900 break-all">{tag.tag_uid}</p>
                                        </div>
                                    )}

                                    {tag.embedded_number && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Embedded Number</label>
                                            <p className="mt-1 text-sm font-mono text-gray-900">{tag.embedded_number}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Created</label>
                                        <p className="mt-1 text-sm text-gray-900">{new Date(tag.created_at).toLocaleString()}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                                        <p className="mt-1 text-sm text-gray-900">{new Date(tag.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendee Information */}
                    {tag.attendee && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Linked Attendee</h3>
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-blue-800">Name</label>
                                            <p className="mt-1 text-sm text-blue-900">{tag.attendee.attendee_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-blue-800">Email</label>
                                            <p className="mt-1 text-sm text-blue-900">{tag.attendee.attendee_email}</p>
                                        </div>
                                        {tag.attendee.attendee_phone && (
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800">Phone</label>
                                                <p className="mt-1 text-sm text-blue-900">{tag.attendee.attendee_phone}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-blue-800">Linked On</label>
                                            <p className="mt-1 text-sm text-blue-900">{new Date(tag.attendee.linked_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction Summary */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(transactionSummary.total_loaded)}</div>
                                    <div className="text-sm text-gray-500">Total Loaded</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(transactionSummary.total_spent)}</div>
                                    <div className="text-sm text-gray-500">Total Spent</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(transactionSummary.total_refunded)}</div>
                                    <div className="text-sm text-gray-500">Total Refunded</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">{transactionSummary.transaction_count}</div>
                                    <div className="text-sm text-gray-500">Transactions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
                            {tag.transactions && tag.transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {tag.transactions.map((transaction) => (
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
                                                        {formatCurrency(transaction.balance_after)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div>
                                                            {transaction.description || 'No description'}
                                                            {transaction.vendor && (
                                                                <div className="text-xs text-gray-500">
                                                                    Vendor: {transaction.vendor.name}
                                                                </div>
                                                            )}
                                                            {transaction.product && (
                                                                <div className="text-xs text-gray-500">
                                                                    Product: {transaction.product.name}
                                                                </div>
                                                            )}
                                                        </div>
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
                                <p className="text-gray-500 text-center py-8">No transactions found for this tag.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}