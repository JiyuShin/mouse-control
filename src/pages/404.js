import React from 'react'
import Link from 'next/link'

export default function Custom404() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🖱️</div>
        <h1 className="text-4xl font-bold mb-4">404 - 페이지를 찾을 수 없습니다</h1>
        <p className="text-xl mb-6">요청하신 페이지가 존재하지 않습니다.</p>
        <div className="space-y-4">
          <Link 
            href="/mouse-interactive"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 mx-2 inline-block"
          >
            🎮 Mouse Interactive 페이지로 이동
          </Link>
          <Link 
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 mx-2 inline-block"
          >
            🏠 홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
