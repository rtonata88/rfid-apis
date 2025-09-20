import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/currency';

export default function Edit({ auth, tag }) {
    const { data, setData, put, processing, errors } = useForm({
        tag_uid: tag.tag_uid || '',
        short_code: tag.short_code || '',
        embedded_number: tag.embedded_number || '',
        status: tag.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('tags.update', tag.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit RFID Tag: {tag.short_code}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={route('tags.show', tag.id)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                        >
                            View Tag
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
            <Head title={`Edit Tag: ${tag.short_code}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Current Tag Info */}
                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Current Tag Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Balance:</span> {formatCurrency(tag.balance)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Issued:</span> {tag.is_issued ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Created:</span> {new Date(tag.created_at).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span className="font-medium">Transactions:</span> {tag.transactions?.length || 0}
                                    </div>
                                </div>
                                {tag.attendee && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded">
                                        <span className="font-medium text-blue-800">Linked to:</span> {tag.attendee.attendee_name} ({tag.attendee.attendee_email})
                                    </div>
                                )}
                            </div>

                            {/* Short Code */}
                            <div>
                                <label htmlFor="short_code" className="block text-sm font-medium text-gray-700">
                                    Short Code *
                                </label>
                                <input
                                    type="text"
                                    id="short_code"
                                    value={data.short_code}
                                    onChange={(e) => setData('short_code', e.target.value.toUpperCase())}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                {errors.short_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.short_code}</p>
                                )}
                            </div>

                            {/* Tag UID */}
                            <div>
                                <label htmlFor="tag_uid" className="block text-sm font-medium text-gray-700">
                                    Tag UID
                                </label>
                                <input
                                    type="text"
                                    id="tag_uid"
                                    value={data.tag_uid}
                                    onChange={(e) => setData('tag_uid', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="35D946B11B080400040CC00E6C72AA90"
                                />
                                {errors.tag_uid && (
                                    <p className="mt-1 text-sm text-red-600">{errors.tag_uid}</p>
                                )}
                            </div>

                            {/* Embedded Number */}
                            <div>
                                <label htmlFor="embedded_number" className="block text-sm font-medium text-gray-700">
                                    Embedded Number
                                </label>
                                <input
                                    type="text"
                                    id="embedded_number"
                                    value={data.embedded_number}
                                    onChange={(e) => setData('embedded_number', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="2974210357"
                                />
                                {errors.embedded_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.embedded_number}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('tags.show', tag.id)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update Tag'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}