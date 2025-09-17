import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Link from 'next/link'

function AdvancedMouseComponent() {
  const [mouseData, setMouseData] = useState({
    x: 0,
    y: 0,
    velocity: 0,
    acceleration: 0,
    pressure: 0,
    isClicking: false
  })
  
  const [visualMode, setVisualMode] = useState('particle') // particle, wave, geometric, paint
  const [particles, setParticles] = useState([])
  const [trails, setTrails] = useState([])
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastPositionRef = useRef({ x: 0, y: 0, timestamp: 0 })
  const lastVelocityRef = useRef(0)

  // 마우스 데이터 계산 및 업데이트
  const updateMouseData = useCallback((e) => {
    const now = performance.now()
    const currentPos = { x: e.clientX, y: e.clientY }
    const lastPos = lastPositionRef.current
    
    // 속도 계산 (pixels per millisecond)
    const deltaTime = now - lastPos.timestamp
    const deltaX = currentPos.x - lastPos.x
    const deltaY = currentPos.y - lastPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = deltaTime > 0 ? distance / deltaTime : 0
    
    // 가속도 계산
    const acceleration = Math.abs(velocity - lastVelocityRef.current)
    
    setMouseData(prev => ({
      ...prev,
      x: currentPos.x,
      y: currentPos.y,
      velocity: velocity * 1000, // pixels per second
      acceleration: acceleration * 1000
    }))
    
    // 파티클 생성 (속도에 따라)
    if (velocity > 0.1) {
      const particleCount = Math.min(Math.floor(velocity * 5), 10)
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: Math.random().toString(36),
        x: currentPos.x + (Math.random() - 0.5) * 20,
        y: currentPos.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * velocity * 0.5,
        vy: (Math.random() - 0.5) * velocity * 0.5,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 4,
        color: `hsl(${(currentPos.x / window.innerWidth) * 360}, 70%, 60%)`
      }))
      
      setParticles(prev => [...prev, ...newParticles].slice(-200))
    }
    
    // 트레일 추가
    setTrails(prev => [{
      x: currentPos.x,
      y: currentPos.y,
      timestamp: now,
      velocity: velocity
    }, ...prev].slice(0, 50))
    
    lastPositionRef.current = { ...currentPos, timestamp: now }
    lastVelocityRef.current = velocity
  }, [])

  // 마우스 이벤트 핸들러
  useEffect(() => {
    const handleMouseMove = updateMouseData
    
    const handleMouseDown = (e) => {
      setMouseData(prev => ({ ...prev, isClicking: true, pressure: 1 }))
      
      // 클릭 시 강력한 파티클 폭발
      const explosionParticles = Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2
        const speed = 2 + Math.random() * 3
        return {
          id: Math.random().toString(36),
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.015,
          size: 3 + Math.random() * 5,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`
        }
      })
      
      setParticles(prev => [...prev, ...explosionParticles].slice(-300))
    }
    
    const handleMouseUp = () => {
      setMouseData(prev => ({ ...prev, isClicking: false, pressure: 0 }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateMouseData])

  // 파티클 애니메이션
  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.99,
          vy: particle.vy * 0.99 + 0.1, // 중력 효과
          life: particle.life - particle.decay,
          size: particle.size * 0.99
        }))
        .filter(particle => particle.life > 0 && particle.size > 0.1)
      )
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // 시각화 모드에 따른 배경 스타일
  const getBackgroundStyle = () => {
    if (typeof window === 'undefined') {
      return { background: '#000000' }
    }
    
    switch (visualMode) {
      case 'wave':
        return {
          background: `radial-gradient(circle at ${mouseData.x}px ${mouseData.y}px, 
            hsl(${(mouseData.x / window.innerWidth) * 360}, 50%, 20%) 0%, 
            #000000 50%)`
        }
      case 'geometric':
        return {
          background: `conic-gradient(from ${mouseData.velocity}deg at ${mouseData.x}px ${mouseData.y}px, 
            #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)`
        }
      case 'paint':
        return {
          background: `linear-gradient(${mouseData.velocity}deg, 
            hsl(${mouseData.x / 10}deg, 70%, 30%), 
            hsl(${mouseData.y / 10}deg, 70%, 30%))`
        }
      default:
        return { background: '#000000' }
    }
  }

  return (
    <>
      <Head>
        <title>Advanced Mouse Visualization</title>
        <meta name="description" content="Advanced mouse interaction and physics simulation" />
      </Head>

      <div 
        className="min-h-screen text-white overflow-hidden relative cursor-none transition-all duration-300"
        style={getBackgroundStyle()}
      >
        {/* Control Panel */}
        <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-80 p-4 rounded-lg backdrop-blur-sm">
          <h1 className="text-lg font-bold mb-3">🎮 Advanced Mouse Visualization</h1>
          
          <div className="space-y-2 text-sm">
            <div>Position: ({Math.round(mouseData.x)}, {Math.round(mouseData.y)})</div>
            <div>Velocity: {Math.round(mouseData.velocity)} px/s</div>
            <div>Acceleration: {Math.round(mouseData.acceleration)}</div>
            <div>Status: {mouseData.isClicking ? '🔴 Clicking' : '⚪ Idle'}</div>
            <div>Particles: {particles.length}</div>
          </div>
          
          <div className="mt-4">
            <label className="block text-xs mb-2">Visualization Mode:</label>
            <select 
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded text-sm w-full"
            >
              <option value="particle">Particles</option>
              <option value="wave">Waves</option>
              <option value="geometric">Geometric</option>
              <option value="paint">Paint</option>
            </select>
          </div>
        </div>

        {/* Data Visualization Panel */}
        <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 p-4 rounded-lg backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3">📊 Real-time Analysis</h2>
          
          {/* Velocity Gauge */}
          <div className="mb-3">
            <div className="text-xs mb-1">Velocity Gauge</div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.min(mouseData.velocity / 10, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Acceleration Gauge */}
          <div className="mb-3">
            <div className="text-xs mb-1">Acceleration Gauge</div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-100"
                style={{ width: `${Math.min(mouseData.acceleration / 10, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Color Preview */}
          <div className="mb-3">
            <div className="text-xs mb-1">Current Color</div>
            <div 
              className="w-32 h-6 rounded border-2 border-white"
              style={{ 
                backgroundColor: typeof window !== 'undefined' 
                  ? `hsl(${(mouseData.x / window.innerWidth) * 360}, 70%, 60%)`
                  : 'hsl(200, 70%, 60%)'
              }}
            />
          </div>
        </div>

        {/* 사용자 정의 마우스 커서 */}
        <div
          className="fixed pointer-events-none z-40 transition-all duration-75"
          style={{
            left: mouseData.x - 15,
            top: mouseData.y - 15,
            width: 30 + Math.min(mouseData.velocity / 10, 20),
            height: 30 + Math.min(mouseData.velocity / 10, 20),
            borderRadius: '50%',
            border: '2px solid white',
            backgroundColor: typeof window !== 'undefined' 
              ? `hsl(${(mouseData.x / window.innerWidth) * 360}, 70%, 60%)`
              : 'hsl(200, 70%, 60%)',
            transform: `scale(${mouseData.isClicking ? 1.5 : 1}) rotate(${mouseData.velocity}deg)`,
            boxShadow: `0 0 ${10 + mouseData.velocity / 5}px currentColor`
          }}
        />

        {/* 파티클 시스템 */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="fixed rounded-full pointer-events-none"
            style={{
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life,
              zIndex: 30,
              filter: `blur(${(1 - particle.life) * 2}px)`
            }}
          />
        ))}

        {/* 트레일 효과 */}
        {visualMode === 'particle' && trails.map((trail, index) => (
          <div
            key={`${trail.timestamp}-${index}`}
            className="fixed rounded-full pointer-events-none"
            style={{
              left: trail.x - 2,
              top: trail.y - 2,
              width: 4 + trail.velocity * 2,
              height: 4 + trail.velocity * 2,
              backgroundColor: typeof window !== 'undefined' 
                ? `hsl(${(trail.x / window.innerWidth) * 360}, 70%, 60%)`
                : 'hsl(200, 70%, 60%)',
              opacity: Math.max(0, 1 - (index / trails.length)),
              zIndex: 25
            }}
          />
        ))}

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-6 z-10 relative">
            <h2 className="text-5xl font-bold mb-8 animate-pulse">
              Advanced Mouse Physics
            </h2>
            <p className="text-xl opacity-80 max-w-3xl mx-auto">
              Mouse velocity, acceleration, and position data are measured in real-time
              and converted into various physical effects and visual representations.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-sm">Velocity Detection</div>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm">Precision Tracking</div>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl mb-2">🌊</div>
                <div className="text-sm">Physics Simulation</div>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm">Real-time Rendering</div>
              </div>
            </div>

            <div className="mt-8">
              <Link 
                href="/"
                className="inline-block bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-6 rounded-lg transition duration-300 backdrop-blur-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// 클라이언트 사이드에서만 렌더링되도록 동적 import 사용
const AdvancedMouse = dynamic(() => Promise.resolve(AdvancedMouseComponent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⚡</div>
        <div className="text-xl">Loading Advanced Mouse Visualization...</div>
      </div>
    </div>
  )
})

export default AdvancedMouse
