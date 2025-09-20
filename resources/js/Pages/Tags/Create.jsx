import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        tag_uid: '',
        short_code: '',
        embedded_number: '',
        initial_balance: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('tags.store'));
    };

    const generateShortCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('short_code', result);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create New RFID Tag
                    </h2>
                    <Link
                        href={route('tags.index')}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                    >
                        Back to Tags
                    </Link>
                </div>
            }
        >
            <Head title="Create RFID Tag" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Short Code */}
                            <div>
                                <label htmlFor="short_code" className="block text-sm font-medium text-gray-700">
                                    Short Code *
                                </label>
                                <div className="mt-1 flex space-x-2">
                                    <input
                                        type="text"
                                        id="short_code"
                                        value={data.short_code}
                                        onChange={(e) => setData('short_code', e.target.value.toUpperCase())}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="ABC123XY"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={generateShortCode}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                                    >
                                        Generate
                                    </button>
                                </div>
                                {errors.short_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.short_code}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    This code will be printed on the physical tag for easy identification.
                                </p>
                            </div>

                            {/* Tag UID */}
                            <div>
                                <label htmlFor="tag_uid" className="block text-sm font-medium text-gray-700">
                                    Tag UID (Optional)
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
                                <p className="mt-1 text-sm text-gray-500">
                                    The unique identifier from the RFID chip. Can be added later when tag is scanned.
                                </p>
                            </div>

                            {/* Embedded Number */}
                            <div>
                                <label htmlFor="embedded_number" className="block text-sm font-medium text-gray-700">
                                    Embedded Number (Optional)
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
                                <p className="mt-1 text-sm text-gray-500">
                                    Additional number embedded in the tag for identification.
                                </p>
                            </div>

                            {/* Initial Balance */}
                            <div>
                                <label htmlFor="initial_balance" className="block text-sm font-medium text-gray-700">
                                    Initial Balance (Optional)
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">N$</span>
                                    </div>
                                    <input
                                        type="number"
                                        id="initial_balance"
                                        step="0.01"
                                        min="0"
                                        value={data.initial_balance}
                                        onChange={(e) => setData('initial_balance', e.target.value)}
                                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.initial_balance && (
                                    <p className="mt-1 text-sm text-red-600">{errors.initial_balance}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    Pre-load the tag with money. This will create an initial transaction.
                                </p>
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
                                <p className="mt-1 text-sm text-gray-500">
                                    Only active tags can be used for transactions.
                                </p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('tags.index')}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? 'Creating...' : 'Create Tag'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}