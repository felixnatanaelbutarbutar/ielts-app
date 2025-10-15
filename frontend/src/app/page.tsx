// frontend/src/app/page.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TestSessionButton } from './components/ui/TestSessionButton'; // Updated import path
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = [
    { name: 'Education', slug: 'education', icon: '📚' },
    { name: 'Travel', slug: 'travel', icon: '✈️' },
    { name: 'Work', slug: 'work', icon: '💼' },
    { name: 'Family', slug: 'family', icon: '👨‍👩‍👧‍👦' },
    { name: 'Technology', slug: 'technology', icon: '💻' },
    { name: 'Environment', slug: 'environment', icon: '🌍' },
    { name: 'Health', slug: 'health', icon: '🏥' },
  ];

  // Fix: useEffect buat redirect setelah login sukses
  useEffect(() => {
    if (status === 'authenticated' && selectedTopic) {
      router.push(`/practice?topic=${selectedTopic}&level=intermediate`);
      setSelectedTopic(null);
    }
  }, [status, selectedTopic, router]);

  const handleTopicClick = (topic: string) => {
    if (!session) {
      setSelectedTopic(topic);
      setShowLoginModal(true);
      return;
    }
    router.push(`/practice?topic=${topic}&level=intermediate`);
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' });  // Callback ke dashboard, useEffect handle redirect
    setShowLoginModal(false);
  };

  const handleCancel = () => {
    setShowLoginModal(false);
    setSelectedTopic(null);
  };

  const isLoggedIn = status === 'authenticated';  // Fix: Gunakan status buat akurasi

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            IELTS Speaking Practice
          </h1>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-600">
                  Selamat datang, {session?.user?.name}!
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}  // Fix: signOut, bukan signIn
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Pilih Topik Latihan Speaking
          </h2>
          <p className="text-gray-500">
            Latih kemampuan speaking Anda dengan topik-topik populer IELTS. Setiap sesi akan dinilai berdasarkan grammar, fluency, vocabulary, dan coherence.
          </p>
        </div>

        {/* Grid 7 Topik Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic.slug}
              onClick={() => handleTopicClick(topic.slug)}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-200">
                <div className="text-4xl mb-4">{topic.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {topic.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Latih kemampuan berbicara tentang {topic.name.toLowerCase()}.
                </p>
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                  Mulai Latihan
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol Riwayat Sesi (Kalau Login) */}
        {isLoggedIn && (
          <div className="text-center mt-12">
            <Link href="/history">
              <button className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md font-semibold">
                Lihat Riwayat Sesi
              </button>
            </Link>
          </div>
        )}

        {/* Tambahkan Tombol Test Session */}
        <div className="text-center mt-12">
          <TestSessionButton />
        </div>
      </main>

      {/* Modal Login */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Login Diperlukan</h2>
            <p className="mb-6 text-gray-600 text-center">
              Silakan login dengan Google untuk mulai latihan.
            </p>
            <button
              onClick={handleGoogleLogin}
              className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 transition mb-3 font-semibold"
            >
              Login with Google
            </button>
            <button
              onClick={handleCancel}
              className="w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}