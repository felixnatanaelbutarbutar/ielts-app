'use client';

import { signIn } from 'next-auth/react';

export default function LoginModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Login untuk Mulai Latihan</h2>
        <p className="mb-4 text-gray-600">Gunakan Google untuk login cepat dan aman.</p>
        <button 
          onClick={() => signIn('google', { callbackUrl: '/' })} 
          className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Login with Google
        </button>
        <button 
          onClick={() => window.close()}  // Atau redirect home
          className="w-full p-3 mt-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}