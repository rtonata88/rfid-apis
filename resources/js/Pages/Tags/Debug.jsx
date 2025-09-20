import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Debug({ auth, tags, filters }) {
    console.log('Debug props:', { auth, tags, filters });

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Debug Tags Page
                </h2>
            }
        >
            <Head title="Debug Tags" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3>Debug Information:</h3>
                        <pre>{JSON.stringify({ tags: tags?.data?.length || 0, filters }, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}