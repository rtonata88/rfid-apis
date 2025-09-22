import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Hi-Events - RFID Event Management System" />
            
            {/* Navigation */}
            <nav className="fixed w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <img 
                                src="/logo.png" 
                                alt="Hi-Events Logo" 
                                className="w-8 h-8"
                            />
                            <span className="text-xl font-bold text-gray-900">Hi-Events</span>
                        </div>

                        {/* Auth Links */}
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        href={route('login')}
                                        className="text-gray-700 hover:text-gray-900 px-3 py-2 font-medium transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
                <div className="pt-20 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Hero Content */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                        Modern{' '}
                                        <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                                            RFID Event
                                        </span>{' '}
                                        Management
                                    </h1>
                                    <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                        Streamline your events with contactless payments, real-time analytics, 
                                        and seamless vendor management. The future of event experiences starts here.
                                    </p>
                                </div>


                            </div>

                            {/* Hero Image/Graphic */}
                            <div className="relative">
                                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
                                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                                        {/* Mock Dashboard Preview */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">Event Dashboard</h3>
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                                                    <div className="text-sm text-gray-600">Active Tags</div>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600">$12.4K</div>
                                                    <div className="text-sm text-gray-600">Revenue</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Food Court</span>
                                                    <span className="text-gray-900 font-medium">$4,250</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Merchandise</span>
                                                    <span className="text-gray-900 font-medium">$2,890</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="bg-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                Everything you need for successful events
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                From RFID tag management to real-time analytics, 
                                our platform provides all the tools you need.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">RFID Tag Management</h3>
                                <p className="text-gray-600">
                                    Issue, track, and manage RFID tags with real-time status updates and balance monitoring.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Contactless Payments</h3>
                                <p className="text-gray-600">
                                    Enable fast, secure transactions with RFID technology for a seamless attendee experience.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6.5A2.5 2.5 0 0115.5 14h-.79l.22 1.32a.75.75 0 01-1.48.25L13.19 14H6.81l-.26 1.57a.75.75 0 11-1.48-.25L5.29 14H4.5A2.5 2.5 0 012 11.5V5zm3.707 5.293L9 8.586l1.293 1.707a1 1 0 001.414-1.414l-2-2.667a1 1 0 00-1.414 0l-2 2.667a1 1 0 101.414 1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Management</h3>
                                <p className="text-gray-600">
                                    Comprehensive vendor dashboard with sales analytics, inventory tracking, and reporting.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Analytics</h3>
                                <p className="text-gray-600">
                                    Get instant insights into sales, attendance, and performance with detailed analytics.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Transaction Security</h3>
                                <p className="text-gray-600">
                                    Enterprise-grade security with encryption, fraud detection, and compliance monitoring.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Event Planning</h3>
                                <p className="text-gray-600">
                                    Plan and organize events with integrated tools for scheduling, resources, and coordination.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
                    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                            Ready to revolutionize your events?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of event organizers who trust Hi-Events 
                            for their RFID management needs.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center text-gray-400">
                            <p>&copy; 2025 Hi-Events. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}