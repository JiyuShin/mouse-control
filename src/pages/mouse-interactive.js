import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// 에러 경계 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">⚡ Loading...</h2>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              새로고침
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function MouseInteractiveComponent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const [clickHistory, setClickHistory] = useState([])
  const [trailPoints, setTrailPoints] = useState([])
  const [ripples, setRipples] = useState([])
  const [sparkles, setSparkles] = useState([])
  const [waves, setWaves] = useState([])
  const [mouseSpeed, setMouseSpeed] = useState(0)
  const [mouseVelocity, setMouseVelocity] = useState({ x: 0, y: 0 })
  const [lastMouseTime, setLastMouseTime] = useState(Date.now())
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [effectMode, setEffectMode] = useState('sparkle') // 기본은 sparkle, 하지만 이미지는 항상 표시
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageEffects, setImageEffects] = useState([])
  const [showImageUpload, setShowImageUpload] = useState(true)
  const [uploadCompleted, setUploadCompleted] = useState(false)
  const [extremeMode, setExtremeMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRecreateMode, setIsRecreateMode] = useState(false) // 재생성 모드
  const [mergedImages, setMergedImages] = useState([]) // 합쳐진 이미지들
  const [currentSoundPattern, setCurrentSoundPattern] = useState(null) // 현재 재생 중인 사운드 패턴
  const [soundTriggerTime, setSoundTriggerTime] = useState(0) // 사운드 트리거 시간
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const audioContextRef = useRef(null)
  const lastEffectTimeRef = useRef(0)
  const lastMotionSoundTimeRef = useRef(0)

  // 오디오 컨텍스트 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        console.log('🎵 Audio context initialized:', audioContextRef.current.state)
        
        // 사용자 상호작용 시 오디오 컨텍스트 활성화
        const enableAudio = () => {
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().then(() => {
              console.log('🎵 Audio context enabled by user interaction')
            })
          }
        }
        
        // 클릭, 터치, 키보드 이벤트로 오디오 활성화
        document.addEventListener('click', enableAudio)
        document.addEventListener('touchstart', enableAudio)
        document.addEventListener('keydown', enableAudio)
        
        return () => {
          document.removeEventListener('click', enableAudio)
          document.removeEventListener('touchstart', enableAudio)
          document.removeEventListener('keydown', enableAudio)
        }
      } catch (error) {
        console.log('❌ Web Audio API not supported:', error)
      }
    }
  }, [])

  // 이미지가 5장 이상 업로드되면 업로드 패널 자동 숨김
  useEffect(() => {
    if (uploadedImages.length >= 5) {
      setShowImageUpload(false)
    }
  }, [uploadedImages])

  // 모션 기반 간단한 사운드 함수
  const playMotionSound = (speed) => {
    console.log(`🎵 playMotionSound called with speed: ${speed}`)
    
    if (!audioContextRef.current) {
      console.log('❌ No audio context available')
      return
    }

    const audioContext = audioContextRef.current
    console.log(`🎵 Audio context state: ${audioContext.state}`)
    
    // 오디오 컨텍스트가 suspended 상태면 resume
    if (audioContext.state === 'suspended') {
      console.log('🔄 Resuming suspended audio context')
      audioContext.resume().then(() => {
        console.log('✅ Audio context resumed successfully')
      }).catch(err => {
        console.log('❌ Failed to resume audio context:', err)
      })
    }
    
    try {
      // 속도에 따른 볼륨 조절 (느리면 작은 소리, 빠르면 큰 소리)
      const volume = Math.min(0.4, 0.05 + speed * 0.01)
      
      // 속도에 따른 주파수 조절 (느리면 낮은 음, 빠르면 높은 음)
      const baseFreq = 200 + Math.min(speed * 6, 400) // 200Hz ~ 600Hz
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime)
      oscillator.type = 'sine' // 부드러운 사인파
      
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1) // 빠른 페이드아웃
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      
      console.log(`✅ Motion sound generated: freq=${baseFreq.toFixed(0)}Hz, vol=${volume.toFixed(2)}`)
      
    } catch (error) {
      console.log('❌ Motion sound failed:', error)
    }
  }

  // recreate 모드에서 클릭 강도에 따른 다양한 합성 효과음 (최적화)
  const playMergeSound = (intensity = 1, clickType = 'normal') => {
    if (!audioContextRef.current) return

    const audioContext = audioContextRef.current
    
    // 오디오 컨텍스트 상태 확인 및 즉시 복구
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    // 🚀 즉시 사운드 시작 (지연 없음)
    
    try {
      // 클릭마다 다른 사운드 패턴 (12가지 다양한 패턴)
      const soundPatterns = [
        // 패턴 1: 상승하는 아르페지오
        { frequencies: [220, 277, 330, 415], duration: 0.7, volume: 0.3 * intensity, wave: 'sine', pattern: 'ascending' },
        // 패턴 2: 하강하는 화음
        { frequencies: [880, 660, 495, 370], duration: 0.8, volume: 0.25 * intensity, wave: 'triangle', pattern: 'descending' },
        // 패턴 3: 펜타토닉 스케일
        { frequencies: [293, 330, 415, 554], duration: 0.6, volume: 0.35 * intensity, wave: 'sawtooth', pattern: 'pentatonic' },
        // 패턴 4: 마이너 코드
        { frequencies: [220, 261, 330, 392], duration: 0.9, volume: 0.28 * intensity, wave: 'sine', pattern: 'minor' },
        // 패턴 5: 메이저 코드
        { frequencies: [261, 329, 392, 523], duration: 0.8, volume: 0.32 * intensity, wave: 'triangle', pattern: 'major' },
        // 패턴 6: 디미니시드 코드
        { frequencies: [277, 330, 392, 466], duration: 0.7, volume: 0.3 * intensity, wave: 'square', pattern: 'diminished' },
        // 패턴 7: 재즈 코드
        { frequencies: [220, 277, 369, 554], duration: 1.0, volume: 0.25 * intensity, wave: 'sine', pattern: 'jazz' },
        // 패턴 8: 블루스 스케일
        { frequencies: [220, 246, 293, 369, 415], duration: 0.9, volume: 0.3 * intensity, wave: 'sawtooth', pattern: 'blues' },
        // 패턴 9: 오리엔탈 스케일
        { frequencies: [261, 294, 369, 415, 523], duration: 0.8, volume: 0.28 * intensity, wave: 'triangle', pattern: 'oriental' },
        // 패턴 10: 아라비안 스케일
        { frequencies: [220, 246, 311, 370, 466], duration: 0.7, volume: 0.32 * intensity, wave: 'sine', pattern: 'arabian' },
        // 패턴 11: 테크노 사운드
        { frequencies: [110, 220, 440, 880], duration: 0.5, volume: 0.4 * intensity, wave: 'square', pattern: 'techno' },
        // 패턴 12: 앰비언트 사운드
        { frequencies: [130, 195, 260, 390, 520], duration: 1.2, volume: 0.2 * intensity, wave: 'sine', pattern: 'ambient' }
      ]
      
      // 클릭 위치와 시간을 기반으로 패턴 선택 (매번 다르게)
      const patternIndex = (Date.now() + Math.floor(intensity * 100)) % soundPatterns.length
      const selectedPattern = soundPatterns[patternIndex]
      
      const frequencies = selectedPattern.frequencies
      const oscillators = []
      const gainNodes = []
      
      // 🚀 병렬 사운드 생성으로 즉각 반응 - 선택된 패턴 사용
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        const delay = index * Math.max(0.01, 0.02 / intensity) // 최소 지연으로 즉각 반응
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // 기본 주파수 설정
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        
        // 즉시 볼륨 시작 - 패턴별 설정 사용
        gainNode.gain.setValueAtTime(selectedPattern.volume * 0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(selectedPattern.volume, audioContext.currentTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + selectedPattern.duration)
        
        // 패턴별 웨이브 타입 설정
        oscillator.type = selectedPattern.wave
        
        // 패턴별 특별한 효과
        if (selectedPattern.pattern === 'ascending') {
          // 상승 패턴: 주파수가 점진적으로 올라감
          oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.currentTime + selectedPattern.duration * 0.8)
        } else if (selectedPattern.pattern === 'descending') {
          // 하강 패턴: 주파수가 점진적으로 내려감
          oscillator.frequency.exponentialRampToValueAtTime(freq * 0.7, audioContext.currentTime + selectedPattern.duration * 0.8)
        } else if (selectedPattern.pattern === 'techno') {
          // 테크노: 빠른 진동 효과
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          for (let i = 0; i < 5; i++) {
            const time = audioContext.currentTime + (i * 0.1)
            oscillator.frequency.setValueAtTime(freq * (1 + Math.sin(i) * 0.1), time)
          }
        }
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + selectedPattern.duration)
        
        oscillators.push(oscillator)
        gainNodes.push(gainNode)
      })
      
      // 패턴별 특별한 마무리 효과
      if (['major', 'minor', 'jazz', 'ambient'].includes(selectedPattern.pattern)) {
        setTimeout(() => {
          const resonanceOsc = audioContext.createOscillator()
          const resonanceGain = audioContext.createGain()
          
          resonanceOsc.connect(resonanceGain)
          resonanceGain.connect(audioContext.destination)
          
          // 패턴의 첫 번째 주파수의 옥타브 위
          const resonanceFreq = selectedPattern.frequencies[0] * 2
          resonanceOsc.frequency.setValueAtTime(resonanceFreq, audioContext.currentTime)
          resonanceGain.gain.setValueAtTime(selectedPattern.volume * 0.3, audioContext.currentTime)
          resonanceGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + selectedPattern.duration)
          
          resonanceOsc.type = 'sine'
          resonanceOsc.start(audioContext.currentTime)
          resonanceOsc.stop(audioContext.currentTime + selectedPattern.duration)
        }, Math.floor(selectedPattern.duration * 300))
      }
      
      // 현재 사운드 패턴 정보를 상태에 저장 (이미지 반응을 위해)
      setCurrentSoundPattern({
        pattern: selectedPattern,
        intensity: intensity,
        patternIndex: patternIndex,
        timestamp: Date.now()
      })
      setSoundTriggerTime(Date.now())
      
      console.log(`🎵 Pattern ${patternIndex + 1}: ${selectedPattern.pattern.toUpperCase()} sound played (intensity: ${intensity.toFixed(2)})`)
      
    } catch (error) {
      console.log('❌ Merge sound failed:', error)
    }
  }

  // 랜덤 소리 생성 함수들
  const playClickSound = (intensity = 1, imageIndex = 0) => {
    if (!audioContextRef.current) return

    const audioContext = audioContextRef.current
    
    // 오디오 컨텍스트가 suspended 상태면 resume
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    // 다양한 소리 타입
    const soundTypes = [
      // 타입 1: 반짝이는 소리 (이미지 변형에 어울림)
      () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        const baseFreq = 400 + (imageIndex * 100) + Math.random() * 300
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, audioContext.currentTime + 0.1)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, audioContext.currentTime + 0.3)
        
        gainNode.gain.setValueAtTime(0.3 * intensity, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        
        oscillator.type = 'sine'
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
      },
      
      // 타입 2: 버블 팝 소리
      () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        const freq = 200 + Math.random() * 400 + (imageIndex * 50)
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.3, audioContext.currentTime + 0.15)
        
        gainNode.gain.setValueAtTime(0.4 * intensity, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.type = 'triangle'
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      },
      
      // 타입 3: 마법 같은 소리
      () => {
        const oscillator1 = audioContext.createOscillator()
        const oscillator2 = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator1.connect(gainNode)
        oscillator2.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        const freq1 = 300 + (imageIndex * 80) + Math.random() * 200
        const freq2 = freq1 * 1.5
        
        oscillator1.frequency.setValueAtTime(freq1, audioContext.currentTime)
        oscillator1.frequency.exponentialRampToValueAtTime(freq1 * 3, audioContext.currentTime + 0.2)
        
        oscillator2.frequency.setValueAtTime(freq2, audioContext.currentTime)
        oscillator2.frequency.exponentialRampToValueAtTime(freq2 * 2, audioContext.currentTime + 0.25)
        
        gainNode.gain.setValueAtTime(0.2 * intensity, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator1.type = 'sawtooth'
        oscillator2.type = 'sine'
        
        oscillator1.start(audioContext.currentTime)
        oscillator2.start(audioContext.currentTime + 0.05)
        oscillator1.stop(audioContext.currentTime + 0.3)
        oscillator2.stop(audioContext.currentTime + 0.5)
      },
      
      // 타입 4: 종소리 같은 소리
      () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        const freq = 500 + (imageIndex * 120) + Math.random() * 300
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        
        gainNode.gain.setValueAtTime(0.3 * intensity, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)
        
        oscillator.type = 'sine'
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.8)
      }
    ]
    
    // 랜덤하게 소리 선택하여 재생
    const randomSound = soundTypes[Math.floor(Math.random() * soundTypes.length)]
    randomSound()
  }


  // 마우스 움직임 추적 - 초고성능 최적화
  useEffect(() => {
    let lastFrameTime = 0
    
    const handleMouseMove = (e) => {
      const newPosition = { x: e.clientX, y: e.clientY }
      
      // 즉시 커서 위치만 업데이트 (가장 중요한 반응성)
      setMousePosition(newPosition)
      
      // 고성능 RAF 쓰로틀링 (60fps 보장)
      const currentTime = performance.now()
      if (currentTime - lastFrameTime < 8) return // 8ms = 120fps 제한
      lastFrameTime = currentTime
      
      requestAnimationFrame(() => {
        const currentTime = Date.now()
        const deltaX = newPosition.x - lastMousePos.x
        const deltaY = newPosition.y - lastMousePos.y
        const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        setMouseSpeed(speed)
        setLastMousePos(newPosition)
        setLastMouseTime(currentTime)
        
        // 속도에 따른 모션 사운드 재생 - 초고속 반응
        if (!isRecreateMode && uploadedImages.length > 0 && speed > 0.1) { // 임계값 대폭 낮춤
          const now = performance.now() // Date.now() 대신 performance.now() 사용
          // 매우 빠른 반응 - 속도에 따라 사운드 빈도 조절
          const soundInterval = Math.max(15, 80 - speed * 3) // 기본 간격을 대폭 단축
          if (now - lastMotionSoundTimeRef.current >= soundInterval) {
            lastMotionSoundTimeRef.current = now
            playMotionSound(speed)
          }
        }

         // 이미지 생성 - recreate 모드가 아닐 때만 생성
         if (!isRecreateMode && !showImageUpload && uploadedImages.length > 0 && speed > 0.01) {
          const nowPerf = performance.now()
          // 매우 빠른 생성 간격 - 거의 실시간
          const speedMultiplier = Math.min(speed * 0.8, 8) // 속도 배율 증가
          const baseInterval = 3 // 기본 간격을 매우 짧게
          const adaptiveInterval = Math.max(1, baseInterval - speedMultiplier) // 최소 1ms까지 단축
          if (nowPerf - lastEffectTimeRef.current >= adaptiveInterval) {
            lastEffectTimeRef.current = nowPerf

            const randomIndex = Math.floor(Math.random() * uploadedImages.length)
            const selectedImage = uploadedImages[randomIndex]

            // 세로/가로 중 하나로 길게. 완전히 랜덤한 방향 선택
            const randomOrientation = Math.random() // 새로운 랜덤 값 생성
            const orientationIsVertical = randomOrientation < 0.5 // 50% 확률로 세로/가로 결정
            
            // 속도와 방향에 따른 길이 계산
            const baseElongation = 1 + Math.min(speed * 0.3, 15)
            const elongation = baseElongation + (Math.random() - 0.5) * 2 // ±1 정도의 변화
            
            // 굵기를 완전히 랜덤하게 - 골고루 분포하도록 개선
            const thicknessOptions = {
              ultraThin: { value: 0.15, weight: 15 },    // 초극세 (15% 확률)
              veryThin: { value: 0.25, weight: 20 },     // 극세 (20% 확률)
              thin: { value: 0.4, weight: 25 },          // 얇음 (25% 확률)
              medium: { value: 0.6, weight: 20 },        // 중간 (20% 확률)
              thick: { value: 0.8, weight: 12 },         // 두꺼움 (12% 확률)
              veryThick: { value: 1.0, weight: 6 },      // 매우 두꺼움 (6% 확률)
              ultraThick: { value: 1.3, weight: 2 }      // 초극세 (2% 확률)
            }
            
            // 가중치 기반 랜덤 선택
            const totalWeight = Object.values(thicknessOptions).reduce((sum, option) => sum + option.weight, 0)
            let randomWeight = Math.random() * totalWeight
            let selectedThickness = 0.4 // 기본값
            
            for (const [key, option] of Object.entries(thicknessOptions)) {
              randomWeight -= option.weight
              if (randomWeight <= 0) {
                selectedThickness = option.value
                break
              }
            }
            
            // 속도에 따른 굵기 조정 (빠를수록 더 극단적인 굵기 가능)
            const speedFactor = Math.min(speed / 15, 1)
            const speedAdjustment = 1 + (Math.random() - 0.5) * speedFactor * 0.6 // 속도에 따라 ±30% 변화
            
            // 방향에 따른 미세 조정 (마우스 이동 각도 고려)
            const directionVariation = Math.random() * 0.3 - 0.15 // ±15% 변화
            
            const finalThickness = Math.max(0.1, selectedThickness * speedAdjustment * (1 + directionVariation))

            const scaleX = orientationIsVertical ? finalThickness : elongation
            const scaleY = orientationIsVertical ? elongation : finalThickness

            setImageEffects(prev => {
              const newEffect = {
                id: currentTime + Math.random(),
                image: selectedImage,
                x: newPosition.x,
                y: newPosition.y,
                scaleX,
                scaleY,
                opacity: 0.85,
                permanent: true,
                speed,
                rotation: 0
              }

            // 이미지는 영구적으로 유지 (사라지지 않음)
            return [...prev, newEffect]
            })

          }
        }

        // 스파클 효과 최적화 (버벅임 완화: 개수/빈도/수명 조정)
        if (effectMode === 'sparkle' && speed > 7) { // 임계값 조금 더 높임
          setSparkles(prev => [...prev, {
            id: currentTime,
            x: newPosition.x + (Math.random() - 0.5) * 20,
            y: newPosition.y + (Math.random() - 0.5) * 20,
            size: 2 + Math.random() * 2,
            life: 0.9,
            decay: 0.2, // 더 빠른 소멸
            color: `hsl(${Math.random() * 360}, 80%, 70%)`,
            angle: Math.random() * Math.PI * 2,
            velocity: 1 + Math.random()
          }].slice(-6)) // 개수 더 제한
        }

        // 웨이브 효과 최적화 (버벅임 완화)
        if (effectMode === 'wave' && speed > 10) { // 임계값 더 높임
          setWaves(prev => [...prev, {
            id: currentTime,
            x: newPosition.x,
            y: newPosition.y,
            radius: 0,
            maxRadius: 20, // 크기 더 줄임
            opacity: 1,
            timestamp: currentTime
          }].slice(-2)) // 개수 더 제한
        }
        
        // 쓰로틀링 제거 - 더 이상 필요 없음
      })
    }

    const handleMouseDown = (e) => {
      setIsClicking(true)
      const clickData = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        button: e.button, // 0: 왼쪽, 1: 휠, 2: 오른쪽
        id: Math.random().toString(36).substr(2, 9)
      }
      setClickHistory(prev => [...prev, clickData].slice(-10))

      // recreate 모드에서 클릭 시 즉각적인 반응
      if (isRecreateMode && uploadedImages.length > 0) {
        // 클릭 강도 계산 (위치, 클릭 버튼, 타이밍)
        const clickX = e.clientX
        const clickY = e.clientY
        const timeBasedIntensity = (Date.now() % 1000) / 1000 // 시간에 따른 변화
        const positionIntensity = (clickX + clickY) % 100 / 50 // 위치에 따른 변화
        const buttonMultiplier = e.button === 0 ? 1 : e.button === 2 ? 1.5 : 0.8
        const clickIntensity = (1 + timeBasedIntensity + positionIntensity) * buttonMultiplier
        
        // 강도에 따른 클릭 타입 결정
        let clickType = 'light'
        if (clickIntensity >= 3) clickType = 'extreme'
        else if (clickIntensity >= 2.2) clickType = 'strong'
        else if (clickIntensity >= 1.5) clickType = 'normal'
        
        // 🚀 즉각적인 사운드 재생 (이미지 계산보다 먼저)
        playMergeSound(clickIntensity, clickType)
        
        // 주변 이미지 찾기 (사운드 이후에 처리)
        const clickRadius = 150
        const nearbyImages = imageEffects.filter(effect => {
          const distance = Math.sqrt(
            Math.pow(effect.x - clickX, 2) + Math.pow(effect.y - clickY, 2)
          )
          return distance <= clickRadius
        })

        if (nearbyImages.length > 0) {
          console.log(`🔮 Merging ${nearbyImages.length} nearby images with ${clickType} intensity (${clickIntensity.toFixed(2)})`)

          // 강도에 따른 새로운 합쳐진 이미지 생성
          const intensityScale = Math.min(clickIntensity * 0.5, 2) // 강도에 따른 크기 배율
          const intensityRotationSpeed = Math.min(clickIntensity * 0.8, 6) // 강도에 따른 회전 속도 (더 느리게)
          
          const mergedImage = {
            id: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            x: e.clientX,
            y: e.clientY,
            images: nearbyImages.map(img => img.image), // 합쳐진 이미지들의 배열
            rotation: 0,
            rotationSpeed: 0.5 + intensityRotationSpeed + Math.random() * 1, // 회전 속도를 대폭 느리게
            scale: 1.2 + intensityScale + Math.random() * 0.3, // 강도에 따른 크기
            opacity: Math.min(0.7 + clickIntensity * 0.1, 1), // 강도에 따른 투명도
            timestamp: Date.now(),
            permanent: true,
            intensity: clickIntensity, // 강도 저장
            clickType: clickType // 클릭 타입 저장
          }

          // 합쳐진 이미지 추가
          setMergedImages(prev => [...prev, mergedImage])

          // 합쳐진 이미지들을 기존 효과에서 제거
          setImageEffects(prev => 
            prev.filter(effect => !nearbyImages.some(nearby => nearby.id === effect.id))
          )
        } else {
          // 주변에 합칠 이미지가 없을 때도 새로운 패턴 생성
          console.log(`🎨 Creating new pattern with ${clickType} intensity (${clickIntensity.toFixed(2)})`)
          
          // 클릭 지점에 새로운 이미지 효과 생성 (패턴 구축)
          const patternImages = Array.from({ length: Math.min(Math.floor(clickIntensity * 2), 6) }, (_, i) => {
            const angle = (i / Math.floor(clickIntensity * 2)) * Math.PI * 2
            const distance = 50 + clickIntensity * 30
            const randomImage = uploadedImages[Math.floor(Math.random() * uploadedImages.length)]
            
            return {
              id: `pattern-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
              image: randomImage,
              x: clickX + Math.cos(angle) * distance,
              y: clickY + Math.sin(angle) * distance,
              scaleX: 0.8 + clickIntensity * 0.3,
              scaleY: 0.8 + clickIntensity * 0.3,
              opacity: 0.7 + clickIntensity * 0.2,
              permanent: true,
              speed: clickIntensity,
              rotation: angle * 180 / Math.PI,
              timestamp: Date.now()
            }
          })
          
          // 새로운 패턴 이미지들 추가
          setImageEffects(prev => [...prev, ...patternImages])
          
          // 기존 이미지들도 변형
          const transformRadius = 150 + clickIntensity * 50
          setImageEffects(prev => 
            prev.map(effect => {
              if (!effect.permanent || patternImages.some(p => p.id === effect.id)) return effect
              
              const dx = clickX - effect.x
              const dy = clickY - effect.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              if (distance <= transformRadius) {
                const influence = Math.max(0, (transformRadius - distance) / transformRadius)
                const transformStrength = influence * clickIntensity
                const angle = Math.atan2(dy, dx)
                
                return {
                  ...effect,
                  scaleX: Math.max(0.3, Math.min(4, effect.scaleX + transformStrength * 0.5)),
                  scaleY: Math.max(0.3, Math.min(4, effect.scaleY + transformStrength * 0.5)),
                  rotation: effect.rotation + angle * 15 * influence,
                  opacity: Math.max(0.5, Math.min(1, effect.opacity + influence * 0.2))
                }
              }
              return effect
            })
          )
        }
      } else {
        // 일반 모드에서는 기존 클릭 사운드
        if (uploadedImages.length > 0) {
          const buttonIntensity = e.button === 0 ? 0.7 : e.button === 2 ? 1.0 : 0.5 // 왼쪽/오른쪽/휠 클릭
          const intensity = buttonIntensity + Math.random() * 0.3
          const randomImageIndex = Math.floor(Math.random() * uploadedImages.length)
          playClickSound(intensity, randomImageIndex)
          console.log(`Playing ${e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle'} click sound`)
        }
      }

      // 클릭 시 강력한 리플 효과 (리플 모드이거나 전체 모드일 때) - recreate 모드에서는 비활성화
      if (!isRecreateMode && (effectMode === 'ripple' || effectMode === 'all')) {
        const rippleColors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b']
        const rippleCount = e.button === 0 ? 3 : e.button === 2 ? 5 : 2
        
        for (let i = 0; i < rippleCount; i++) {
          setTimeout(() => {
            setRipples(prev => [...prev, {
              id: Math.random().toString(36),
              x: e.clientX,
              y: e.clientY,
              radius: 0,
              maxRadius: 80 + i * 20,
              opacity: 1,
              color: rippleColors[Math.floor(Math.random() * rippleColors.length)],
              timestamp: Date.now(),
              delay: i * 100
            }])
          }, i * 100)
        }
      }

      // 클릭 시 폭발형 스파클 효과 (스파클 모드이거나 전체 모드일 때) - recreate 모드에서는 비활성화
      if (!isRecreateMode && (effectMode === 'sparkle' || effectMode === 'all')) {
        const sparkleCount = extremeMode ? 10 : 8
        const explosionSparkles = Array.from({ length: sparkleCount }, (_, i) => {
          const angle = (i / sparkleCount) * Math.PI * 2
          const distance = 30 + Math.random() * 50
          return {
            id: Math.random().toString(36),
            x: e.clientX + Math.cos(angle) * distance,
            y: e.clientY + Math.sin(angle) * distance,
            size: 3 + Math.random() * 5,
            life: 1,
            decay: 0.015 + Math.random() * 0.01,
            color: `hsl(${(e.clientX / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 360}, 90%, 70%)`,
            angle: angle,
            velocity: 2 + Math.random() * 3,
            gravity: 0.1
          }
        })
        setSparkles(prev => [...prev, ...explosionSparkles].slice(-30)) // 성능 최적화: 개수 제한
      }

      // 더블클릭 감지를 위한 특별 효과 (웨이브 모드이거나 전체 모드일 때) - recreate 모드에서는 비활성화
      const now = Date.now()
      const recentClicks = clickHistory.filter(click => now - click.timestamp < 500)
      if (!isRecreateMode && recentClicks.length > 0 && (effectMode === 'wave' || effectMode === 'all')) {
        // 더블클릭 시 특별한 웨이브 효과
        setWaves(prev => [...prev, {
          id: Math.random().toString(36),
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: 150,
          opacity: 1,
          timestamp: Date.now(),
          special: true
        }])
      }

      // 클릭 시 이미지 폭발 효과 (이미지 모드이거나 전체 모드일 때) - recreate 모드에서는 비활성화
      if (!isRecreateMode && !showImageUpload && uploadedImages.length > 0 && (effectMode === 'image' || effectMode === 'all')) {
        console.log(`Generating click image effects`)
        
        // 성능 최적화: 폭발 이미지 개수 제한
        const burstImageCount = extremeMode ? 8 : 6
        const burstImages = Array.from({ length: burstImageCount }, (_, i) => {
          const angle = (i / burstImageCount) * Math.PI * 2
          const distance = 30 + Math.random() * 150
          const randomImage = uploadedImages[Math.floor(Math.random() * uploadedImages.length)]
          
          return {
            id: Math.random().toString(36),
            image: randomImage,
            x: e.clientX + Math.cos(angle) * distance,
            y: e.clientY + Math.sin(angle) * distance,
            scale: 0.3 + Math.random() * 1.5, // 다양한 크기
            rotation: Math.random() * 360,
            rotationSpeed: 5 + Math.random() * 10,
            opacity: 0.6 + Math.random() * 0.4,
            permanent: true, // 영구적으로 유지
            velocityX: Math.cos(angle) * (3 + Math.random() * 5),
            velocityY: Math.sin(angle) * (3 + Math.random() * 5),
            timestamp: Date.now(),
            blendMode: ['multiply', 'screen', 'overlay', 'color-dodge'][Math.floor(Math.random() * 4)]
          }
        })
        
        // 중앙에 큰 이미지도 추가
        const centerImage = {
          id: Math.random().toString(36),
          image: uploadedImages[Math.floor(Math.random() * uploadedImages.length)],
          x: e.clientX,
          y: e.clientY,
          scale: 2 + Math.random(),
          rotation: Math.random() * 360,
          rotationSpeed: 15,
          opacity: 0.8,
          permanent: true, // 영구적으로 유지
          velocityX: 0,
          velocityY: 0,
          timestamp: Date.now(),
          blendMode: 'screen'
        }
        
        setImageEffects(prev => [...prev, ...burstImages, centerImage]) // 개수 제한 제거
      }
    }

    const handleMouseUp = () => {
      setIsClicking(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [uploadedImages, effectMode, lastMousePos, lastMouseTime, showImageUpload, isRecreateMode]) // recreate 모드도 반영

  // 모든 효과들의 애니메이션 업데이트 (초고성능 최적화)
  useEffect(() => {
    let animationId
    let lastTime = performance.now()
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime
      
      // 120fps로 제한 (8.33ms) - 더 부드러운 애니메이션
      if (deltaTime >= 8.33) {
        const now = Date.now()
        
        // 배치 업데이트로 성능 향상
        const updates = {
          trailPoints: [],
          sparkles: [],
          ripples: [],
          waves: [],
          imageEffects: []
        }
        
        // 트레일 포인트 정리 (더욱 간소화)
        setTrailPoints(prev => {
          updates.trailPoints = prev.filter(point => now - point.timestamp < 300) // 더 짧게
          return updates.trailPoints.slice(-5) // 최대 5개만
        })
        
        // 스파클 효과 간소화 (성능 향상)
        setSparkles(prev => {
          updates.sparkles = prev
            .map(sparkle => ({
              ...sparkle,
              x: sparkle.x + (sparkle.velocityX || Math.cos(sparkle.angle) * sparkle.velocity),
              y: sparkle.y + (sparkle.velocityY || Math.sin(sparkle.angle) * sparkle.velocity),
              life: sparkle.life - sparkle.decay * 1.5, // 더 빠른 소멸
              size: sparkle.size * 0.98 // 더 빠른 축소
            }))
            .filter(sparkle => sparkle.life > 0.2 && sparkle.size > 2)
          return updates.sparkles.slice(-6) // 최대 6개만
        })
        
        // 리플/웨이브 효과 대폭 간소화
        setRipples(prev => prev.filter(ripple => {
          const age = now - ripple.timestamp
          return age < 500 // 더욱 빠른 제거
        }).slice(-3)) // 최대 3개
        
        setWaves(prev => prev.filter(wave => {
          const age = now - wave.timestamp
          return age < 400 // 더욱 빠른 제거
        }).slice(-2)) // 최대 2개
        
        // recreate 모드에서는 마우스 움직임으로 이미지 변형하지 않음
        // 클릭할 때만 변형이 일어남
        
        // 배치된 이미지들의 사운드 반응 (recreate 모드에서만)
        if (isRecreateMode && currentSoundPattern && (now - soundTriggerTime < 1500)) {
          setImageEffects(prev => 
            prev.map(effect => {
              if (!effect.permanent) return effect
              
              const timeSinceSound = now - soundTriggerTime
              const reactionStrength = Math.max(0, 1 - (timeSinceSound / 1500))
              
              const pattern = currentSoundPattern.pattern
              const intensity = currentSoundPattern.intensity
              
              // 이미지별로 다른 반응 (위치 기반)
              const imageFreqIndex = Math.floor((effect.x + effect.y) % pattern.frequencies.length)
              const imageFreq = pattern.frequencies[imageFreqIndex]
              const normalizedFreq = (imageFreq - 200) / 600
              
              // 랜덤 움직임 (주파수에 따라)
              const randomMovement = {
                x: Math.sin(timeSinceSound * 0.02 + effect.x * 0.001) * normalizedFreq * 10 * reactionStrength,
                y: Math.cos(timeSinceSound * 0.02 + effect.y * 0.001) * (1 - normalizedFreq) * 8 * reactionStrength
              }
              
              // 크기 변화 (강도에 따라)
              const scaleReaction = 1 + Math.sin(timeSinceSound * 0.03 + effect.id.length) * intensity * 0.2 * reactionStrength
              
              return {
                ...effect,
                x: (effect.originalX || effect.x) + randomMovement.x,
                y: (effect.originalY || effect.y) + randomMovement.y,
                scaleX: (effect.originalScaleX || effect.scaleX) * scaleReaction,
                scaleY: (effect.originalScaleY || effect.scaleY) * scaleReaction,
                originalX: effect.originalX || effect.x,
                originalY: effect.originalY || effect.y,
                originalScaleX: effect.originalScaleX || effect.scaleX,
                originalScaleY: effect.originalScaleY || effect.scaleY
              }
            })
          )
        }

        // 합쳐진 이미지들의 회전 애니메이션 및 사운드 반응 (최적화)
        if (mergedImages.length > 0) {
          setMergedImages(prev => 
            prev.map(merged => {
              let updatedMerged = {
                ...merged,
                rotation: merged.rotation + merged.rotationSpeed
              }
              
              // 사운드 패턴에 따른 이미지 반응 (최근 1.5초 내 사운드에만 반응)
              if (currentSoundPattern && (now - soundTriggerTime < 1500)) {
                const timeSinceSound = now - soundTriggerTime
                const reactionStrength = Math.max(0, 1 - (timeSinceSound / 1500)) // 시간이 지날수록 약해짐
                
                // 패턴별 다른 반응
                const pattern = currentSoundPattern.pattern
                const intensity = currentSoundPattern.intensity
                
                // 음의 높낮이에 따른 움직임 (주파수 기반)
                const avgFrequency = pattern.frequencies.reduce((sum, freq) => sum + freq, 0) / pattern.frequencies.length
                const normalizedFreq = (avgFrequency - 200) / 600 // 200~800Hz 범위를 0~1로 정규화
                
                // 높은 음: 위로 움직임, 낮은 음: 아래로 움직임
                const verticalOffset = Math.sin(timeSinceSound * 0.01) * normalizedFreq * 20 * reactionStrength
                const horizontalOffset = Math.cos(timeSinceSound * 0.008) * (1 - normalizedFreq) * 15 * reactionStrength
                
                // 음의 강도에 따른 크기 변화
                const scaleVariation = 1 + Math.sin(timeSinceSound * 0.02) * intensity * 0.3 * reactionStrength
                
                // 패턴별 특별한 효과
                let specialEffect = 1
                if (pattern.pattern === 'ascending') {
                  specialEffect = 1 + Math.sin(timeSinceSound * 0.05) * 0.2 * reactionStrength
                } else if (pattern.pattern === 'descending') {
                  specialEffect = 1 - Math.sin(timeSinceSound * 0.05) * 0.1 * reactionStrength
                } else if (pattern.pattern === 'techno') {
                  specialEffect = 1 + Math.sin(timeSinceSound * 0.1) * 0.4 * reactionStrength
                }
                
                updatedMerged = {
                  ...updatedMerged,
                  x: merged.x + horizontalOffset,
                  y: merged.y + verticalOffset,
                  scale: (merged.scale || 1) * scaleVariation * specialEffect,
                  soundReaction: true // 사운드 반응 중임을 표시
                }
              }
              
              return updatedMerged
            })
          )
        }
        
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isRecreateMode, mousePosition.x, mousePosition.y, mergedImages.length, currentSoundPattern, soundTriggerTime])

  // 마우스 위치를 기반으로 색상 생성
  const getColorFromPosition = (x, y) => {
    if (typeof window === 'undefined') {
      return 'hsl(200, 50%, 60%)' // 기본값 (서버 렌더링 시)
    }
    const hue = (x / window.innerWidth) * 360
    const saturation = (y / window.innerHeight) * 100
    return `hsl(${hue}, ${saturation}%, 60%)`
  }

  // 클릭 강도에 따른 크기 계산
  const getClickSize = (clickAge) => {
    const maxAge = 2000 // 2초
    const normalizedAge = Math.max(0, 1 - (clickAge / maxAge))
    return 20 + (normalizedAge * 30) // 20px ~ 50px
  }

  // 이미지 업로드 처리
  const handleImageUpload = (event) => {
    console.log('File input changed:', event.target.files)
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) {
      console.log('No files selected')
      return
    }

    console.log(`Processing ${files.length} files`)
    
    files.forEach((file, index) => {
      console.log(`Processing file ${index + 1}: ${file.name}, type: ${file.type}`)
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          console.log(`File ${file.name} loaded successfully`)
          const imageData = {
            id: Math.random().toString(36).substr(2, 9),
            src: e.target.result,
            name: file.name,
            timestamp: Date.now(),
            size: file.size
          }
          
          setUploadedImages(prev => {
            const newImages = [...prev, imageData]
            const limitedImages = newImages.slice(-5) // 최대 5개 이미지
            console.log(`Updated images count: ${limitedImages.length}`)
            
            // 첫 번째 이미지가 업로드되면 즉시 이미지 효과 활성화
            if (limitedImages.length === 1) {
              console.log('첫 번째 이미지 업로드 완료! 이제 마우스를 움직이면 이미지가 나타납니다!')
            }
            
            return limitedImages
          })
        }
        
        reader.onerror = (error) => {
          console.error(`Error reading file ${file.name}:`, error)
        }
        
        reader.readAsDataURL(file)
      } else {
        console.warn(`File ${file.name} is not an image (type: ${file.type})`)
      }
    })
    
    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = ''
  }

  // 이미지 삭제
  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      if (filtered.length < 5) {
        setUploadCompleted(false)
        setExtremeMode(false)
      }
      return filtered
    })
  }

  // 모든 이미지 삭제
  const clearAllImages = () => {
    setUploadedImages([])
    setImageEffects([])
    setUploadCompleted(false)
    setExtremeMode(false)
  }

  // 업로드 완료 버튼 핸들러
  const handleUploadComplete = () => {
    if (uploadedImages.length >= 5) {
      setUploadCompleted(true)
      setExtremeMode(true)
      setEffectMode('sparkle')
      console.log('극단적 모드 활성화! 이제 마우스 속도에 따라 이미지가 극단적으로 변형됩니다!')
    }
  }

  return (
    <>
      <Head>
        <title>Mouse Interactive Visualization</title>
        <meta name="description" content="Interactive page that visually represents real-time mouse movements and clicks" />
      </Head>

      <div className="min-h-screen bg-black text-white overflow-hidden relative cursor-none">


        {/* 마우스 커서 대체 */}
        <div
          className="fixed w-6 h-6 rounded-full border-2 border-white pointer-events-none z-40"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
            backgroundColor: getColorFromPosition(mousePosition.x, mousePosition.y),
            transform: isClicking ? 'scale(1.5)' : 'scale(1)',
            boxShadow: isClicking ? '0 0 20px currentColor' : '0 0 10px currentColor',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease' // transform만 부드럽게, 위치는 즉시
          }}
        />

        {/* 마우스 트레일 효과 - 이미지가 있으면 이미지로, 없으면 기본 도형으로 */}
        {trailPoints.map((point, index) => {
          const age = Date.now() - point.timestamp
          const opacity = Math.max(0, 1 - (age / 1000)) // 더 빠른 페이드
          const size = Math.max(2, 6 + (point.speed || 0) * 0.3) * opacity
          const hasImages = uploadedImages.length > 0;
          const randomImage = hasImages ? uploadedImages[Math.floor(Math.random() * uploadedImages.length)] : null;
          
          // 트레일에서 속도 기반 극단적 변형
          const speed = point.speed || 0
          const horizontalStretch = 1 + speed * 0.05  // 속도에 따른 가로 늘어남
          const verticalCompress = Math.max(0.3, 1 - speed * 0.03)  // 속도에 따른 세로 압축
          const skewAngle = speed * 2  // 속도에 따른 기울임
          
          return (
            <div
              key={`${point.timestamp}-${index}`}
              className="fixed pointer-events-none"
              style={{
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                opacity: opacity * 0.9,
                zIndex: 30,
                transform: hasImages ? 
                  `rotate(${index * 20}deg) 
                   scale(${opacity}) 
                   scaleX(${horizontalStretch}) 
                   scaleY(${verticalCompress})
                   skewX(${skewAngle}deg)` : 
                  'none',
                filter: `blur(${(1 - opacity) * 1}px)`,
                borderRadius: hasImages ? '15%' : '50%',
                ...(hasImages ? {} : {
                  backgroundColor: getColorFromPosition(point.x, point.y)
                })
              }}
            >
              {hasImages && randomImage && (
                <img
                  src={randomImage.src}
                  alt={randomImage.name}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: 'inherit',
                    filter: `
                      hue-rotate(${index * 30 + speed * 5}deg) 
                      brightness(${0.6 + opacity * 0.8}) 
                      saturate(${1 + speed * 0.02})
                      contrast(${1 + speed * 0.01})
                    `,
                    mixBlendMode: speed > 10 ? 'screen' : 'soft-light'
                  }}
                  draggable={false}
                />
              )}
            </div>
          )
        })}

        {/* 스파클 효과 - 이미지가 있으면 이미지로, 없으면 기본 도형으로 */}
        {(effectMode === 'sparkle' || effectMode === 'all') && sparkles.map((sparkle) => {
          const hasImages = uploadedImages.length > 0;
          const randomImage = hasImages ? uploadedImages[Math.floor(Math.random() * uploadedImages.length)] : null;
          
          // 마우스 속도에 따른 극단적 변형 계산
          const velocityMagnitude = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y)
          const horizontalStretch = 1 + Math.abs(mouseVelocity.x) * 0.02 // 가로 늘어남
          const verticalStretch = 1 + Math.abs(mouseVelocity.y) * 0.02   // 세로 늘어남
          const skewX = mouseVelocity.x * 0.3  // 가로 기울임
          const skewY = mouseVelocity.y * 0.3  // 세로 기울임
          
          return (
            <div
              key={sparkle.id}
              className="fixed pointer-events-none"
              style={{
                left: sparkle.x - sparkle.size / 2,
                top: sparkle.y - sparkle.size / 2,
                width: sparkle.size,
                height: sparkle.size,
                opacity: sparkle.life,
                zIndex: 35,
                transform: `
                  rotate(${sparkle.angle * 180 / Math.PI}deg) 
                  scale(${0.8 + sparkle.life * 0.4}, ${0.8 + sparkle.life * 0.4})
                  scaleX(${horizontalStretch}) 
                  scaleY(${verticalStretch})
                  skewX(${skewX}deg) 
                  skewY(${skewY}deg)
                `,
                filter: `blur(${(1 - sparkle.life) * 1}px) hue-rotate(${sparkle.angle * 57 + velocityMagnitude}deg)`,
                borderRadius: hasImages ? '20%' : '50%',
                ...(hasImages ? {} : {
                  backgroundColor: sparkle.color,
                  boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.color}`
                })
              }}
            >
              {hasImages && randomImage && (
                <img
                  src={randomImage.src}
                  alt={randomImage.name}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: 'inherit',
                    filter: `
                      hue-rotate(${sparkle.angle * 57 + velocityMagnitude}deg) 
                      brightness(${0.7 + sparkle.life * 0.6}) 
                      saturate(${1.5 + velocityMagnitude * 0.01})
                      contrast(${1 + velocityMagnitude * 0.01})
                    `,
                    mixBlendMode: 'screen'
                  }}
                  draggable={false}
                />
              )}
            </div>
          )
        })}

        {/* 리플 효과 - 이미지가 있으면 이미지로, 없으면 기본 도형으로 */}
        {(effectMode === 'ripple' || effectMode === 'all') && ripples.map((ripple) => {
          const hasImages = uploadedImages.length > 0;
          const randomImage = hasImages ? uploadedImages[Math.floor(Math.random() * uploadedImages.length)] : null;
          
          if (hasImages && randomImage) {
            // 이미지로 리플 효과 - 확산되면서 크기가 커지는 이미지들
            const imageCount = Math.ceil(ripple.radius / 20); // 리플 크기에 따라 이미지 개수 결정
            return Array.from({ length: Math.min(imageCount, 8) }, (_, i) => {
              const angle = (i / imageCount) * Math.PI * 2;
              const distance = ripple.radius * 0.8;
              const imageSize = 30 + (ripple.radius / 10);
              
              return (
                <div
                  key={`${ripple.id}-${i}`}
                  className="fixed pointer-events-none"
                  style={{
                    left: ripple.x + Math.cos(angle) * distance - imageSize / 2,
                    top: ripple.y + Math.sin(angle) * distance - imageSize / 2,
                    width: imageSize,
                    height: imageSize,
                    opacity: ripple.opacity * 0.8,
                    zIndex: 32,
                    transform: `rotate(${angle * 180 / Math.PI}deg) scale(${ripple.opacity})`,
                    filter: `hue-rotate(${angle * 57}deg) blur(${(1 - ripple.opacity) * 2}px)`,
                    borderRadius: '30%'
                  }}
                >
                  <img
                    src={randomImage.src}
                    alt={randomImage.name}
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      filter: `brightness(${0.8 + ripple.opacity * 0.4}) contrast(1.2)`,
                      mixBlendMode: 'multiply'
                    }}
                    draggable={false}
                  />
                </div>
              );
            });
          } else {
            // 기본 리플 효과
            return (
              <div
                key={ripple.id}
                className="fixed pointer-events-none rounded-full border-2"
                style={{
                  left: ripple.x - ripple.radius,
                  top: ripple.y - ripple.radius,
                  width: ripple.radius * 2,
                  height: ripple.radius * 2,
                  borderColor: ripple.color,
                  opacity: ripple.opacity,
                  zIndex: 32,
                  boxShadow: `0 0 ${ripple.radius / 2}px ${ripple.color}`
                }}
              />
            );
          }
        })}

        {/* 웨이브 효과 - 이미지가 있으면 이미지로, 없으면 기본 도형으로 */}
        {(effectMode === 'wave' || effectMode === 'all') && waves.map((wave) => {
          const hasImages = uploadedImages.length > 0;
          
          if (hasImages) {
            // 이미지로 웨이브 효과 - 원형으로 배치된 이미지들이 웨이브처럼 확산
            const imageCount = wave.special ? 12 : 8;
            return Array.from({ length: imageCount }, (_, i) => {
              const angle = (i / imageCount) * Math.PI * 2;
              const distance = wave.radius * 0.9;
              const randomImage = uploadedImages[Math.floor(Math.random() * uploadedImages.length)];
              const imageSize = wave.special ? 40 + (wave.radius / 8) : 25 + (wave.radius / 12);
              
              return (
                <div
                  key={`${wave.id}-${i}`}
                  className="fixed pointer-events-none"
                  style={{
                    left: wave.x + Math.cos(angle) * distance - imageSize / 2,
                    top: wave.y + Math.sin(angle) * distance - imageSize / 2,
                    width: imageSize,
                    height: imageSize,
                    opacity: wave.opacity * 0.7,
                    zIndex: 28,
                    transform: `rotate(${angle * 180 / Math.PI + wave.radius}deg) scale(${wave.opacity * 1.2})`,
                    filter: `hue-rotate(${angle * 60}deg) blur(${(1 - wave.opacity) * 3}px)`,
                    borderRadius: wave.special ? '50%' : '25%'
                  }}
                >
                  <img
                    src={randomImage.src}
                    alt={randomImage.name}
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      filter: wave.special 
                        ? `brightness(1.2) contrast(1.4) saturate(1.8)` 
                        : `brightness(0.9) contrast(1.1) saturate(1.3)`,
                      mixBlendMode: wave.special ? 'color-dodge' : 'overlay'
                    }}
                    draggable={false}
                  />
                </div>
              );
            });
          } else {
            // 기본 웨이브 효과
            return (
              <div
                key={wave.id}
                className="fixed pointer-events-none rounded-full"
                style={{
                  left: wave.x - wave.radius,
                  top: wave.y - wave.radius,
                  width: wave.radius * 2,
                  height: wave.radius * 2,
                  border: wave.special ? '3px solid #ff006e' : '2px solid #06ffa5',
                  opacity: wave.opacity * 0.6,
                  zIndex: 28,
                  background: wave.special 
                    ? `radial-gradient(circle, rgba(255,0,110,0.2) 0%, transparent 70%)`
                    : `radial-gradient(circle, rgba(6,255,165,0.1) 0%, transparent 70%)`,
                  boxShadow: wave.special 
                    ? `0 0 ${wave.radius}px rgba(255,0,110,0.5)`
                    : `0 0 ${wave.radius / 2}px rgba(6,255,165,0.3)`
                }}
              />
            );
          }
        })}

        {/* 합쳐진 이미지들 - 강도에 따른 다양한 회전 그룹들 */}
        {mergedImages.map((merged) => {
          const totalImages = merged.images.length
          const baseSize = 120 * merged.scale // 강도에 따른 크기
          
          // 자연스러운 시각적 효과 (색상 제거)
          const naturalEffects = {
            light: { shadow: '0 2px 8px rgba(0, 0, 0, 0.2)' },
            normal: { shadow: '0 4px 12px rgba(0, 0, 0, 0.3)' },
            strong: { shadow: '0 6px 16px rgba(0, 0, 0, 0.4)' },
            extreme: { shadow: '0 8px 20px rgba(0, 0, 0, 0.5)' }
          }
          
          const currentEffect = naturalEffects[merged.clickType] || naturalEffects.normal
          
          return (
            <div
              key={merged.id}
              className="fixed pointer-events-none z-45"
              style={{
                left: merged.x - baseSize / 2,
                top: merged.y - baseSize / 2,
                width: baseSize,
                height: baseSize,
                opacity: merged.opacity,
                transform: `rotate(${merged.rotation}deg) scale(${1 + Math.sin(merged.rotation * 0.1) * 0.05})`, // 매우 미묘한 스케일 변화
                transition: 'opacity 0.3s ease',
                filter: `drop-shadow(${currentEffect.shadow})` // 자연스러운 그림자만
              }}
            >
              {merged.images.map((image, index) => {
                const angle = (index / totalImages) * Math.PI * 2
                const radius = baseSize * 0.35
                const imageSize = 60 + (merged.intensity * 10) // 강도에 따른 이미지 크기
                
                return (
                  <div
                    key={`${merged.id}-img-${index}`}
                    className="absolute"
                    style={{
                      left: baseSize / 2 + Math.cos(angle) * radius - imageSize / 2,
                      top: baseSize / 2 + Math.sin(angle) * radius - imageSize / 2,
                      width: imageSize,
                      height: imageSize,
                      transform: `rotate(${-merged.rotation}deg)` // 개별 이미지는 반대 방향으로 회전해서 똑바로 유지
                    }}
                  >
                    <img
                      src={image.src}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{
                        filter: `brightness(${1 + merged.intensity * 0.05}) contrast(${1 + merged.intensity * 0.05})`, // 자연스러운 밝기/대비만
                        borderRadius: '0px'
                      }}
                      draggable={false}
                    />
                  </div>
                )
              })}
              
              {/* 중앙 효과 제거 - 자연스러운 회전만 */}
            </div>
          )
        })}

        {/* 커서 따라다니는 이미지 - 고성능 최적화 */}
        {imageEffects.map((effect) => {
          // 화면 밖의 이미지는 렌더링하지 않음 (성능 향상)
          // 속도 기반 크기: 빠를수록 기본 사이즈 증가
          const baseSize = 28
          const speedFactor = Math.min((effect.speed || 0) * 0.25, 60)
          const size = baseSize + speedFactor
          const isVisible = effect.x > -size && effect.x < (typeof window !== 'undefined' ? window.innerWidth + size : 2000) &&
                           effect.y > -size && effect.y < (typeof window !== 'undefined' ? window.innerHeight + size : 2000)
          
          if (!isVisible) return null
          
          return (
            <div
              key={effect.id}
              className="fixed pointer-events-none z-40"
              style={{
                left: effect.x - size/2,
                top: effect.y - size/2,
                width: size,
                height: size,
                opacity: effect.opacity || 0.7,
                transform: `scale3d(${effect.scaleX || 1}, ${effect.scaleY || 1}, 1) rotate(${effect.rotation || 0}deg)`,
                transition: isRecreateMode ? 'transform 0.05s ease-out' : 'none',
                willChange: isRecreateMode ? 'transform' : 'auto',
                backfaceVisibility: 'hidden', // GPU 가속
                perspective: '1000px'
              }}
            >
              <img
                src={effect.image.src}
                alt=""
                className="w-full h-full object-cover"
                style={{
                  borderRadius: '0%',
                  imageRendering: 'crisp-edges'
                }}
                draggable={false}
                loading="eager"
              />
            </div>
          )
        })}

        {/* 클릭 효과 - 이미지가 있으면 이미지로, 없으면 기본 도형으로 (recreate 모드에서는 비활성화) */}
        {!isRecreateMode && clickHistory.map((click) => {
          const age = Date.now() - click.timestamp
          const size = getClickSize(age)
          const opacity = Math.max(0, 1 - (age / 2000))
          const hasImages = uploadedImages.length > 0;
          
          if (opacity <= 0) return null

          if (hasImages) {
            // 이미지로 클릭 효과 - 클릭 지점에 이미지가 확산 (극단적 변형)
            const randomImage = uploadedImages[Math.floor(Math.random() * uploadedImages.length)];
            const clickIntensity = (2000 - age) / 2000 // 클릭 강도 (시간에 따라 감소)
            const explosionScale = 1 + clickIntensity * 2 // 폭발적 확장
            const distortionX = 1 + clickIntensity * 1.5 // 가로 왜곡
            const distortionY = 1 + clickIntensity * 0.5 // 세로 왜곡
            const skewIntensity = clickIntensity * 30 // 기울임 강도
            
            return (
              <div
                key={click.id}
                className="fixed pointer-events-none"
                style={{
                  left: click.x - size / 2,
                  top: click.y - size / 2,
                  width: size,
                  height: size,
                  opacity: opacity,
                  zIndex: 35,
                  transform: `
                    rotate(${age * 0.5}deg) 
                    scale(${explosionScale}) 
                    scaleX(${distortionX}) 
                    scaleY(${distortionY})
                    skewX(${skewIntensity}deg) 
                    skewY(${-skewIntensity * 0.5}deg)
                  `,
                  filter: `blur(${(1 - opacity) * 1}px)`,
                  borderRadius: '40%'
                }}
              >
                <img
                  src={randomImage.src}
                  alt={randomImage.name}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: 'inherit',
                    filter: `
                      hue-rotate(${age * 0.3 + clickIntensity * 180}deg) 
                      brightness(${0.8 + opacity * 0.4 + clickIntensity * 0.5}) 
                      contrast(${1.3 + clickIntensity * 0.7})
                      saturate(${1 + clickIntensity * 2})
                    `,
                    mixBlendMode: click.button === 0 ? 'screen' : click.button === 2 ? 'overlay' : 'multiply'
                  }}
                  draggable={false}
                />
              </div>
            );
          } else {
            // 기본 클릭 효과
            return (
              <div
                key={click.id}
                className="fixed rounded-full pointer-events-none border-4"
                style={{
                  left: click.x - size / 2,
                  top: click.y - size / 2,
                  width: size,
                  height: size,
                  borderColor: click.button === 0 ? '#ff6b6b' : click.button === 2 ? '#4ecdc4' : '#ffe66d',
                  opacity: opacity,
                  zIndex: 35,
                  animation: 'pulse 0.5s ease-out'
                }}
              />
            );
          }
        })}

        {/* 배경 그라디언트 효과 */}
        {(effectMode === 'background' || effectMode === 'all') && (
          <div
            className="fixed inset-0 pointer-events-none transition-all duration-300"
            style={{
              opacity: 0.15 + Math.min(mouseSpeed * 0.01, 0.15),
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
                ${getColorFromPosition(mousePosition.x, mousePosition.y)} 0%, 
                rgba(${Math.floor(mousePosition.x / 10)}, ${Math.floor(mousePosition.y / 10)}, ${Math.floor((mousePosition.x + mousePosition.y) / 20)}, 0.3) 30%, 
                transparent 60%)`
            }}
          />
        )}

        {/* 동적 배경 오버레이 */}
        {isClicking && (effectMode === 'background' || effectMode === 'all') && (
          <div
            className="fixed inset-0 pointer-events-none animate-pulse"
            style={{
              background: `conic-gradient(from ${mousePosition.x}deg at ${mousePosition.x}px ${mousePosition.y}px, 
                rgba(255,0,110,0.1), rgba(131,56,236,0.1), rgba(58,134,255,0.1), 
                rgba(6,255,165,0.1), rgba(255,190,11,0.1), rgba(255,0,110,0.1))`
            }}
          />
        )}

        {/* 격자 배경 */}
        <div className="fixed inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Main Content Area - 이미지가 없을 때만 표시 */}
        {uploadedImages.length === 0 && (
          <div className="flex items-center justify-center min-h-screen p-8">
            <div className="text-center space-y-6 z-10 relative">
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                Move Your Mouse!
              </h2>
              <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
                Recreate your images!
              </p>
            </div>
          </div>
        )}

        {/* Recreate Button - 이미지가 있을 때만 표시 */}
        {uploadedImages.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setIsRecreateMode(!isRecreateMode)}
              className={`px-6 py-3 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isRecreateMode 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRecreateMode ? '🔄 RECREATING...' : '🎨 RECREATE'}
            </button>
          </div>
        )}

        {/* Image Upload Section - 이미지 5장 업로드 후에는 숨김 */}
        {uploadedImages.length < 5 && (
        <div className={`fixed bottom-4 left-4 right-4 z-50 bg-black bg-opacity-90 rounded-lg backdrop-blur-sm mx-auto border-2 border-gray-600 transition-all duration-300 ${
          isExpanded ? 'max-w-6xl p-4' : 'max-w-2xl p-3'
        }`}>
          <div className={`flex items-center mb-2 ${uploadedImages.length > 0 ? 'justify-between' : 'justify-center'}`}>
            <h3 className={`font-bold ${isExpanded ? 'text-lg' : 'text-md'}`}>Choose your five favorite image</h3>
            {uploadedImages.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-300 transform hover:scale-105"
                >
                  {isExpanded ? '🔽 Collapse' : '🔼 Expand'}
                </button>
                <button
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-300 transform hover:scale-105"
                >
                  {showImageUpload ? '❌ Hide' : '👁️ Show'}
                </button>
              </div>
            )}
          </div>

          {showImageUpload && (
            <div className={`${isExpanded ? 'space-y-4' : 'space-y-2'}`}>
              {/* File Upload Area */}
              <div className={`rounded-lg text-center bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 ${
                isExpanded ? 'p-8' : 'p-4'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload-input"
                />
                <div className={`${isExpanded ? 'space-y-4' : 'space-y-2'}`}>
                  <button
                    onClick={() => {
                      console.log('Upload button clicked')
                      fileInputRef.current?.click()
                    }}
                    className={`bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition duration-300 transform hover:scale-105 shadow-lg ${
                      isExpanded ? 'py-4 px-8 text-base' : 'py-2 px-4 text-sm'
                    }`}
                  >
                    SELECT FIVE IMAGES
                  </button>
                  {isExpanded && (
                    <>
                      <p className="text-sm text-gray-300 font-semibold">
                        Click the button above to choose your images!
                      </p>
                      <p className="text-xs text-gray-400">
                        Supported formats: JPG, PNG, GIF, WebP
                      </p>
                    </>
                  )}
                </div>
              </div>


              {/* Uploaded Images Display */}
              {uploadedImages.length > 0 && (
                <div className={`bg-green-900 bg-opacity-30 rounded-lg border border-green-600 ${
                  isExpanded ? 'p-4' : 'p-2'
                }`}>
                  <div className={`flex items-center justify-between ${isExpanded ? 'mb-3' : 'mb-2'}`}>
                    <h4 className={`font-semibold text-green-300 ${isExpanded ? 'text-md' : 'text-sm'}`}>
                      ✅ Images ({uploadedImages.length}/5)
                    </h4>
                    <div className="flex gap-2">
                      {uploadedImages.length >= 5 && !uploadCompleted && (
                        <button
                          onClick={handleUploadComplete}
                          className={`bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300 transform hover:scale-105 shadow-lg pulse-animation ${
                            isExpanded ? 'py-2 px-4 text-sm' : 'py-1 px-2 text-xs'
                          }`}
                        >
                          🚀 Complete!
                        </button>
                      )}
                      <button
                        onClick={() => {
                          console.log('Clearing all images')
                          clearAllImages()
                        }}
                        className={`bg-red-600 hover:bg-red-700 text-white font-bold rounded transition duration-300 transform hover:scale-105 ${
                          isExpanded ? 'py-1 px-3 text-sm' : 'py-1 px-2 text-xs'
                        }`}
                      >
                        🗑️ {isExpanded ? 'Clear All' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.src}
                            alt={image.name}
                            className="w-full h-24 object-cover rounded-lg border-2 border-green-400 shadow-lg"
                            onLoad={() => console.log(`Image ${image.name} rendered successfully`)}
                            onError={() => console.error(`Error rendering image ${image.name}`)}
                          />
                          <button
                            onClick={() => {
                              console.log(`Removing image: ${image.name}`)
                              removeImage(image.id)
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-70 rounded px-1">
                            <p className="text-xs text-white truncate">{image.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-1 overflow-x-auto">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative flex-shrink-0">
                          <img
                            src={image.src}
                            alt={image.name}
                            className="w-12 h-12 object-cover rounded border border-green-400"
                            onLoad={() => console.log(`Image ${image.name} rendered successfully`)}
                            onError={() => console.error(`Error rendering image ${image.name}`)}
                          />
                          <button
                            onClick={() => {
                              console.log(`Removing image: ${image.name}`)
                              removeImage(image.id)
                            }}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Instructions - 확대 모드에서만 표시 */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-green-900 bg-opacity-50 rounded-lg border border-green-600">
                    {uploadCompleted && extremeMode ? (
                      <div>
                        <p className="text-sm text-gray-200 mb-2">
                          🚀 <strong>극단적 모드 활성화!</strong> 마우스 속도에 따라 이미지가 극단적으로 변형됩니다!
                        </p>
                        <div className="text-xs text-gray-100 space-y-1">
                          <div>💨 <strong>빠른 움직임:</strong> 이미지 크기 15배까지 확대, 극단적 왜곡</div>
                          <div>🌪️ <strong>방향 변화:</strong> 이미지 기울임과 늘어남 3배 강화</div>
                          <div>🔥 <strong>속도 증가:</strong> 회전 속도와 변형 강도 극대화</div>
                          <div>✨ <strong>모든 효과:</strong> 마우스만 움직여도 화려한 효과 폭발!</div>
                        </div>
                      </div>
                    ) : uploadedImages.length >= 5 ? (
                      <div>
                        <p className="text-sm text-gray-200 mb-2">
                          ⚡ <strong>준비 완료!</strong> 업로드 완료 버튼을 눌러 극단적 모드를 활성화하세요!
                        </p>
                        <p className="text-xs text-gray-100">
                          극단적 모드에서는 마우스 움직임에 따라 이미지가 극도로 변형됩니다!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-green-200 mb-2">
                          🎉 <strong>Images Loaded!</strong> All effects are now your images!
                        </p>
                        <div className="text-xs text-green-100 space-y-1">
                          <div>✨ <strong>Sparkles:</strong> Fast movement = your images sparkling</div>
                          <div>🌊 <strong>Ripples:</strong> Clicks = your images rippling outward</div>
                          <div>⚡ <strong>Waves:</strong> Fast movement = your images in wave patterns</div>
                          <div>🎯 <strong>Trails:</strong> Movement = your images following mouse</div>
                          <div>💥 <strong>Clicks:</strong> Your images exploding and transforming</div>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* CSS 애니메이션 - GPU 가속 최적화 */}
        <style jsx>{`
          * {
            -webkit-transform: translateZ(0);
            -moz-transform: translateZ(0);
            -ms-transform: translateZ(0);
            -o-transform: translateZ(0);
            transform: translateZ(0);
          }
          
          @keyframes pulse {
            0% {
              transform: scale3d(0.5, 0.5, 1);
              opacity: 1;
            }
            100% {
              transform: scale3d(1, 1, 1);
              opacity: 0.7;
            }
          }

          @keyframes pulse-animation {
            0%, 100% {
              transform: scale3d(1, 1, 1);
              box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
            }
            50% {
              transform: scale3d(1.05, 1.05, 1);
              box-shadow: 0 0 0 10px rgba(251, 191, 36, 0);
            }
          }

          .pulse-animation {
            animation: pulse-animation 2s infinite;
            will-change: transform, box-shadow;
          }
          
          img {
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          
          .fixed {
            will-change: transform, opacity;
            contain: layout style paint;
          }
        `}</style>
      </div>
    </>
  )
}

// 에러 경계로 감싼 컴포넌트
const WrappedComponent = () => (
  <ErrorBoundary>
    <MouseInteractiveComponent />
  </ErrorBoundary>
)

// 클라이언트 사이드에서만 렌더링되도록 동적 import 사용
const MouseInteractive = dynamic(() => Promise.resolve(WrappedComponent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
        <div className="text-xl">⚡ Loading Mouse Control...</div>
        <div className="text-sm mt-2 opacity-60">잠시만 기다려주세요...</div>
      </div>
    </div>
  )
})

export default MouseInteractive
