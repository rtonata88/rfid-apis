import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/Utils/currency';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function RefundsIndex({ auth, refundRequests, summary, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'pending');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [isSearching, setIsSearching] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);

    // Form states
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Auto-search with debounce
    useEffect(() => {
        if (!hasUserInteracted) return;

        const delayedSearch = setTimeout(() => {
            const hasSearch = search.trim() !== '';
            const hasDateFrom = dateFrom !== '';
            const hasDateTo = dateTo !== '';
            
            if (hasSearch || hasDateFrom || hasDateTo || 
                search !== filters.search || 
                status !== filters.status ||
                dateFrom !== filters.date_from || dateTo !== filters.date_to) {
                
                const params = {};
                if (hasSearch) params.search = search;
                if (status) params.status = status;
                if (hasDateFrom) params.date_from = dateFrom;
                if (hasDateTo) params.date_to = dateTo;
                
                setIsSearching(true);
                router.get(route('refunds.index'), params, {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsSearching(false),
                });
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, status, dateFrom, dateTo, hasUserInteracted]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('pending');
        setDateFrom('');
        setDateTo('');
        setHasUserInteracted(true);
        setIsSearching(true);
        router.get(route('refunds.index'), {}, {
            onFinish: () => setIsSearching(false),
        });
    };

    const handleApprove = (refund) => {
        setSelectedRefund(refund);
        setAdminNotes('');
        setErrors({});
        setShowApproveModal(true);
    };

    const handleReject = (refund) => {
        setSelectedRefund(refund);
        setRejectionReason('');
        setErrors({});
        setShowRejectModal(true);
    };

    const submitApproval = (e) => {
        e.preventDefault();
        setProcessing(true);
        
        router.post(route('refunds.approve', selectedRefund.id), {
            admin_notes: adminNotes,
        }, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedRefund(null);
                setAdminNotes('');
            },
            onError: (errors) => setErrors(errors),
            onFinish: () => setProcessing(false),
        });
    };

    const submitRejection = (e) => {
        e.preventDefault();
        setProcessing(true);
        
        router.post(route('refunds.reject', selectedRefund.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedRefund(null);
                setRejectionReason('');
            },
            onError: (errors) => setErrors(errors),
            onFinish: () => setProcessing(false),
        });
    };

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Refund Management
                    </h2>
                </div>
            }
        >
            <Head title="Refund Management" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6">
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                                {summary.pending_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Pending Requests</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency(summary.pending_amount)} total
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                                {summary.approved_today}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Approved Today</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6">
                            <div className="text-lg sm:text-2xl font-bold text-red-600">
                                {summary.rejected_today}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Rejected Today</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">
                                {refundRequests?.total || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Results</div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by ID, amount, tag, attendee name, email, reference..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setHasUserInteracted(true);
                                        }}
                                        className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    {isSearching && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Filters Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value);
                                                setHasUserInteracted(true);
                                            }}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => {
                                                setDateFrom(e.target.value);
                                                setHasUserInteracted(true);
                                            }}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => {
                                                setDateTo(e.target.value);
                                                setHasUserInteracted(true);
                                            }}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                                        <button
                                            onClick={handleClearFilters}
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    {refundRequests?.data && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {refundRequests.total > 0 ? (
                                    <>
                                        Showing {refundRequests.from} to {refundRequests.to} of {refundRequests.total} refund request{refundRequests.total !== 1 ? 's' : ''}
                                        {(search || status || dateFrom || dateTo) && (
                                            <span className="text-blue-600"> (filtered)</span>
                                        )}
                                    </>
                                ) : (
                                    search || status || dateFrom || dateTo ? 'No refund requests match your search criteria' : 'No refund requests found'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Refund Requests List */}
                    <div className="space-y-4">
                        {refundRequests?.data?.length > 0 ? (
                            refundRequests.data.map((refund) => (
                                <div key={refund.id} className="bg-white overflow-hidden shadow-sm rounded-lg">
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    {getStatusBadge(refund.approval_status)}
                                                    <span className="text-lg font-semibold text-gray-900">
                                                        {formatCurrency(refund.amount)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(refund.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Tag:</div>
                                                        <div className="font-medium">
                                                            {refund.rfid_tag?.short_code || 'N/A'}
                                                        </div>
                                                        {refund.rfid_tag?.attendee && (
                                                            <div className="text-sm text-gray-600">
                                                                {refund.rfid_tag.attendee.attendee_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="text-sm text-gray-500">Payment Method:</div>
                                                        <div className="font-medium text-sm">
                                                            {refund.payment_method || 'N/A'}
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="text-sm text-gray-500">Reference:</div>
                                                        <div className="font-medium text-sm">
                                                            {refund.reference}
                                                        </div>
                                                    </div>
                                                </div>

                                                {refund.description && (
                                                    <div className="mt-2">
                                                        <div className="text-sm text-gray-500">Description:</div>
                                                        <div className="text-sm text-gray-900">
                                                            {refund.description}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {refund.approval_status === 'pending' && (
                                                <div className="flex space-x-3 mt-4 sm:mt-0 sm:ml-6">
                                                    <button
                                                        onClick={() => handleApprove(refund)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(refund)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                                    >
                                                        Reject
                                                    </button>
                                                    <Link
                                                        href={route('refunds.show', refund.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                                <div className="px-6 py-12 text-center">
                                    <div className="text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            {search || dateFrom || dateTo ? 'No matching refund requests' : 'No refund requests yet'}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {search || dateFrom || dateTo 
                                                ? 'Try adjusting your search filters.' 
                                                : 'Refund requests will appear here when attendees submit them.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {refundRequests?.links?.length > 3 && (
                        <div className="bg-white px-4 py-3 rounded-lg shadow-sm mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                                <div className="text-sm text-gray-700 text-center sm:text-left">
                                    Showing {refundRequests?.from} to {refundRequests?.to} of {refundRequests?.total} results
                                </div>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {refundRequests?.links?.map((link, index) => (
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

            {/* Approve Refund Modal */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Approve Refund</h3>
                        <button
                            onClick={() => setShowApproveModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {selectedRefund && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Amount:</span> {formatCurrency(selectedRefund.amount)}
                                </div>
                                <div>
                                    <span className="font-medium">Tag:</span> {selectedRefund.rfid_tag?.short_code}
                                </div>
                                <div>
                                    <span className="font-medium">Attendee:</span> {selectedRefund.rfid_tag?.attendee?.attendee_name}
                                </div>
                                <div>
                                    <span className="font-medium">Current Balance:</span> {formatCurrency(selectedRefund.rfid_tag?.balance || 0)}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submitApproval} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="admin_notes" value="Admin Notes (Optional)" />
                            <textarea
                                id="admin_notes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Optional notes about this approval..."
                            />
                            <InputError message={errors.admin_notes} className="mt-2" />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowApproveModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {processing ? 'Approving...' : 'Approve Refund'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Reject Refund Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Reject Refund</h3>
                        <button
                            onClick={() => setShowRejectModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {selectedRefund && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Amount:</span> {formatCurrency(selectedRefund.amount)}
                                </div>
                                <div>
                                    <span className="font-medium">Tag:</span> {selectedRefund.rfid_tag?.short_code}
                                </div>
                                <div>
                                    <span className="font-medium">Attendee:</span> {selectedRefund.rfid_tag?.attendee?.attendee_name}
                                </div>
                                <div>
                                    <span className="font-medium">Reference:</span> {selectedRefund.reference}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submitRejection} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="rejection_reason" value="Reason for Rejection" />
                            <textarea
                                id="rejection_reason"
                                required
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Please explain why this refund is being rejected..."
                            />
                            <InputError message={errors.rejection_reason} className="mt-2" />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {processing ? 'Rejecting...' : 'Reject Refund'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
