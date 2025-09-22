import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { formatCurrency, formatNumber } from '@/Utils/currency';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function AttendeeDashboard({
    auth,
    tag,
    walletStats,
    recentTransactions,
    spendingByVendor
}) {

    const [showLinkTagModal, setShowLinkTagModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);

    const { data: linkData, setData: setLinkData, post: postLink, processing: linkProcessing, errors: linkErrors, reset: resetLink } = useForm({
        tag_identifier: '',
    });

    const { data: refundData, setData: setRefundData, post: postRefund, processing: refundProcessing, errors: refundErrors, reset: resetRefund } = useForm({
        amount: '',
    });

    const handleLinkTag = (e) => {
        e.preventDefault();
        postLink(route('attendee.link-tag'), {
            onSuccess: () => {
                setShowLinkTagModal(false);
                resetLink();
            }
        });
    };

    const handleRequestRefund = (e) => {
        e.preventDefault();
        postRefund(route('attendee.request-refund'), {
            onSuccess: () => {
                setShowRefundModal(false);
                resetRefund();
            }
        });
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

    const balanceColor = walletStats.balance > 50 ? 'text-green-600' : walletStats.balance > 20 ? 'text-yellow-600' : 'text-red-600';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        My Wallet
                    </h2>
                    <div className="flex space-x-2">
                        {!tag && (
                            <button
                                onClick={() => setShowLinkTagModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                                Link RFID Tag
                            </button>
                        )}
                        <button
                            onClick={() => setShowRefundModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Request Refund
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="My Wallet" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Wallet Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className={`text-3xl font-bold ${balanceColor}`}>
                                {formatCurrency(walletStats.balance)}
                            </div>
                            <div className="text-sm text-gray-600">Current Balance</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Available to spend
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(walletStats.total_loaded)}</div>
                            <div className="text-sm text-gray-600">Total Loaded</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Money added to wallet
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(walletStats.total_spent)}</div>
                            <div className="text-sm text-gray-600">Total Spent</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Money spent at vendors
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(walletStats.total_refunded)}</div>
                            <div className="text-sm text-gray-600">Total Refunded</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Money refunded
                            </div>
                        </div>
                    </div>

                    {/* Tag Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">RFID Tag Information</h3>
                        {tag ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Tag Code</label>
                                    <p className="mt-1 text-lg font-mono font-bold text-gray-900">{tag.short_code}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Status</label>
                                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                        tag.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {tag.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Balance</label>
                                    <p className={`mt-1 text-lg font-bold ${balanceColor}`}>{formatCurrency(tag.balance)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No RFID Tag Linked</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Link your RFID tag to start using your digital wallet.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowLinkTagModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Link RFID Tag
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Spending Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Vendor</h3>
                            <div className="space-y-3">
                                {spendingByVendor.length > 0 ? spendingByVendor.map((vendor, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{vendor.vendor_name}</div>
                                            <div className="text-xs text-gray-500">{formatNumber(vendor.transaction_count)} purchases</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-purple-600">{formatCurrency(vendor.total_spent)}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm">No spending data available</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Account Type</span>
                                    <span className="font-medium">Event Attendee</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tag Status</span>
                                    <span className={`font-medium ${tag ? 'text-green-600' : 'text-red-600'}`}>
                                        {tag ? 'Linked' : 'Not Linked'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Member Since</span>
                                    <span className="font-medium">{new Date(auth.user.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Recent Transactions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
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
                                                    {transaction.vendor?.name || 'N/A'}
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
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {tag ? 'Start shopping at event vendors to see your transaction history.' : 'Link your RFID tag to start making purchases.'}
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Link Tag Modal */}
            <Modal show={showLinkTagModal} onClose={() => setShowLinkTagModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Link RFID Tag</h3>
                        <button
                            onClick={() => setShowLinkTagModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleLinkTag} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="tag_identifier" value="Tag Code or UID" />
                            <TextInput
                                id="tag_identifier"
                                type="text"
                                required
                                value={linkData.tag_identifier}
                                onChange={(e) => setLinkData('tag_identifier', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Enter your tag code or scan your tag"
                                isFocused
                            />
                            <InputError message={linkErrors.tag_identifier} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-600">
                                Enter the code printed on your RFID tag or scan it with a reader.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowLinkTagModal(false)}
                                disabled={linkProcessing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={linkProcessing}
                            >
                                {linkProcessing ? 'Linking...' : 'Link Tag'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Refund Request Modal */}
            <Modal show={showRefundModal} onClose={() => setShowRefundModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Request Refund</h3>
                        <button
                            onClick={() => setShowRefundModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleRequestRefund} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="amount" value="Refund Amount" />
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={walletStats.balance}
                                required
                                value={refundData.amount}
                                onChange={(e) => setRefundData('amount', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="0.00"
                            />
                            <InputError message={refundErrors.amount} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-600">
                                Maximum refund amount: {formatCurrency(walletStats.balance)}
                            </p>
                        </div>


                        <div className="flex justify-end space-x-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowRefundModal(false)}
                                disabled={refundProcessing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={refundProcessing}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {refundProcessing ? 'Submitting...' : 'Submit Request'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
