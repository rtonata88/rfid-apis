import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/currency';

export default function RefundShow({ auth, transaction, relatedTransactions }) {
    const getStatusBadge = (approvalStatus) => {
        const status = approvalStatus || 'unknown';
        const classes = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getTransactionTypeBadge = (type) => {
        const classes = {
            load: 'bg-green-100 text-green-800',
            spend: 'bg-purple-100 text-purple-800',
            refund: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[type] || 'bg-gray-100 text-gray-800'}`}>
                {type}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Refund Request Details
                    </h2>
                    <Link
                        href={route('refunds.index')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Back to Refunds
                    </Link>
                </div>
            }
        >
            <Head title="Refund Details" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Refund Details */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-800">Refund Request</h3>
                                {getStatusBadge(transaction.approval_status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Amount</label>
                                        <div className="text-2xl font-bold text-red-600">
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Reference</label>
                                        <div className="text-sm text-gray-900">{transaction.reference}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Requested Date</label>
                                        <div className="text-sm text-gray-900">
                                            {new Date(transaction.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Description</label>
                                        <div className="text-sm text-gray-900">{transaction.description}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Tag</label>
                                        <div className="text-sm text-gray-900">
                                            {transaction.rfid_tag?.short_code || 'N/A'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Attendee</label>
                                        <div className="text-sm text-gray-900">
                                            {transaction.rfid_tag?.attendee?.attendee_name || 'N/A'}
                                        </div>
                                        {transaction.rfid_tag?.attendee?.attendee_email && (
                                            <div className="text-sm text-gray-500">
                                                {transaction.rfid_tag.attendee.attendee_email}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Balance Before</label>
                                        <div className="text-sm text-gray-900">
                                            {formatCurrency(transaction.balance_before)}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Balance After</label>
                                        <div className="text-sm text-gray-900">
                                            {formatCurrency(transaction.balance_after)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Actions/Notes */}
                            {transaction.approval_status === 'approved' && (
                                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-2">Approval Details</h4>
                                    <div className="text-sm text-green-700">
                                        <div>Approved: {new Date(transaction.metadata.approved_at).toLocaleString()}</div>
                                        {transaction.metadata.admin_notes && (
                                            <div className="mt-2">
                                                <strong>Admin Notes:</strong> {transaction.metadata.admin_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {transaction.approval_status === 'rejected' && (
                                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                                    <h4 className="font-medium text-red-800 mb-2">Rejection Details</h4>
                                    <div className="text-sm text-red-700">
                                        <div>Rejected: {new Date(transaction.metadata.rejected_at).toLocaleString()}</div>
                                        {transaction.metadata.rejection_reason && (
                                            <div className="mt-2">
                                                <strong>Rejection Reason:</strong> {transaction.metadata.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Transactions */}
                    {relatedTransactions?.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Tag Activity</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vendor/Product
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {relatedTransactions.map((relatedTransaction) => (
                                                <tr key={relatedTransaction.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getTransactionTypeBadge(relatedTransaction.type)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`font-medium ${relatedTransaction.type === 'spend' ? 'text-red-600' : 'text-green-600'}`}>
                                                            {relatedTransaction.type === 'spend' ? '-' : '+'}{formatCurrency(relatedTransaction.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {relatedTransaction.vendor ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {relatedTransaction.vendor.name}
                                                                </div>
                                                                {relatedTransaction.product && (
                                                                    <div className="text-sm text-gray-500">
                                                                        {relatedTransaction.product.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">System</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(relatedTransaction.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(relatedTransaction.created_at).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
