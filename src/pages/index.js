import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-8">🖱️</div>
        <h1 className="text-5xl font-bold mb-6">Mouse Control</h1>
        <p className="text-xl mb-8 text-gray-300">마우스 인터랙티브 웹 애플리케이션</p>
        
        <div className="space-y-4">
          <Link 
            href="/mouse-interactive"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105 inline-block"
          >
            🎮 Mouse Interactive 시작하기
          </Link>
          
          <div className="mt-6">
            <Link 
              href="/advanced-mouse"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 inline-block mr-4"
            >
              🚀 Advanced Mouse
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-gray-400">
          <p>마우스의 움직임을 추적하고 인터랙티브한 경험을 제공합니다</p>
        </div>
      </div>
    </div>
  )
}