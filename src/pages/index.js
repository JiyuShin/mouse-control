import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 페이지 로드 시 즉시 mouse-interactive 페이지로 리다이렉트
    router.replace('/mouse-interactive')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🖱️</div>
        <div className="text-xl">Loading Mouse Interactive...</div>
      </div>
    </div>
  )
}