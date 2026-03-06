// src/app/page.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TestSessionButton } from './components/ui/TestSessionButton';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [topics, setTopics] = useState<Array<{ id: string; name: string; slug: string; icon: string }>>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const iconMap: Record<string, string> = {
    Users: '👨‍👩‍👧‍👦',
    GraduationCap: '🎓',
    Plane: '✈️',
    Laptop: '💻',
    Globe: '🌍'
  };

  const topicDescriptions: Record<string, string> = {
    family: 'Pertanyaan seperti: Describe your family members, family traditions, atau daily family life.',
    education: 'Pertanyaan seperti: Talk about your school/college, favorite subjects, atau future study plans.',
    travel: 'Pertanyaan seperti: Describe a memorable trip, dream destination, atau travel preferences.',
    technology: 'Pertanyaan seperti: How technology affects daily life, favorite gadgets, atau future tech.',
    environment: 'Pertanyaan seperti: Environmental issues, recycling habits, atau protecting nature.'
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/topics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTopics(data);
        } else {
          console.error('Data topics bukan array:', data);
          setTopics([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Gagal ambil topics:', err);
        setTopics([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && selectedTopic) {
      router.push(`/practice/new?topic=${selectedTopic}`);
      setSelectedTopic(null);
    }
  }, [status, selectedTopic, router]);

  const handleTopicClick = (slug: string) => {
    if (!session) {
      setSelectedTopic(slug);
      setShowLoginModal(true);
      return;
    }
    router.push(`/practice/new?topic=${slug}`);
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' });
    setShowLoginModal(false);
  };

  const handleCancel = () => {
    setShowLoginModal(false);
    setSelectedTopic(null);
  };

  const isLoggedIn = status === 'authenticated';

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse w-6 h-6 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="fixed bottom-20 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IELTS Speaking Practice</h1>
                <p className="text-xs text-gray-500">Master your speaking skills</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {session?.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-[1600px] mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="max-w-3xl mb-20">
          <div className="inline-block mb-5">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 shadow-sm">
              ✨ Practice Makes Perfect
            </span>
          </div>
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Practice Your<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Speaking Skills</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Tingkatkan kemampuan speaking IELTS Anda dengan latihan interaktif.
            Setiap sesi akan dinilai berdasarkan <span className="font-semibold text-blue-600">grammar</span>, <span className="font-semibold text-purple-600">fluency</span>, <span className="font-semibold text-pink-600">vocabulary</span>, dan <span className="font-semibold text-indigo-600">coherence</span>.
          </p>
        </div>

        {/* Topics Grid - Changed to 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
          {topics.length > 0 ? (
            topics.map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic.slug)}
                className="group cursor-pointer"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-transparent hover:border-indigo-300 shadow-lg hover:shadow-2xl transition-all duration-500 p-10 transform hover:-translate-y-3 overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/0 via-purple-100/0 to-pink-100/0 group-hover:from-blue-100/70 group-hover:via-purple-100/40 group-hover:to-pink-100/20 transition-all duration-700"></div>
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl group-hover:scale-175 group-hover:rotate-45 transition-all duration-700 opacity-60"></div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-7xl mb-5 transform group-hover:scale-130 group-hover:-rotate-6 transition-all duration-400">
                      {iconMap[topic.icon] || '📌'}
                    </div>
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-500">
                      {topic.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 opacity-90 group-hover:opacity-100 transition-opacity">
                      {topicDescriptions[topic.slug] || `Latih speaking tentang ${topic.name.toLowerCase()}.`}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base font-bold text-indigo-600 group-hover:text-purple-600 transition-colors">
                        Mulai Latihan
                      </span>
                      <span className="text-indigo-600 group-hover:text-purple-600 transform group-hover:translate-x-2 group-hover:scale-125 transition-all text-2xl animate-pulse">➜</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-500 text-lg">
                Tidak ada topik tersedia. Pastikan backend berjalan.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isLoggedIn && (
          <div className="text-center mb-16">
            <Link href="/history">
              <button className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-base font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                📚 Lihat Riwayat Sesi
              </button>
            </Link>
          </div>
        )}

        {/* Test Session Button */}
        <div className="text-center mb-20">
          <TestSessionButton />
        </div>


      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full transform animate-scale-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h2>
              <p className="text-gray-600">
                Login untuk memulai latihan speaking Anda
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full p-4 bg-white border-2 border-gray-300 text-gray-800 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 mb-3 font-semibold flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.70 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 6.75c1.63 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.70 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.30-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={handleCancel}
              className="w-full p-4 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}