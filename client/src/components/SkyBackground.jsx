import { useEffect, useState } from 'react'

const clouds = [
  { w: 160, top: '12%', left: '-4%',  dur: '30s', delay: '0s',  opacity: 0.055 },
  { w: 200, top: '25%', left: '72%',  dur: '38s', delay: '5s',  opacity: 0.045 },
  { w: 120, top: '58%', left: '8%',   dur: '34s', delay: '9s',  opacity: 0.040 },
  { w: 170, top: '70%', left: '82%',  dur: '26s', delay: '3s',  opacity: 0.050 },
  { w: 140, top: '85%', left: '40%',  dur: '32s', delay: '7s',  opacity: 0.045 },
]

const sparkles = [
  { s:2,   top:'6%',  left:'8%',  d:'0s'   }, { s:1.5, top:'14%', left:'32%', d:'1.1s' },
  { s:2,   top:'4%',  left:'56%', d:'0.5s' }, { s:1.5, top:'11%', left:'78%', d:'2s'   },
  { s:2,   top:'19%', left:'92%', d:'0.8s' }, { s:1,   top:'38%', left:'4%',  d:'1.5s' },
  { s:1.5, top:'48%', left:'62%', d:'0.4s' }, { s:2,   top:'74%', left:'44%', d:'1.9s' },
  { s:1,   top:'82%', left:'15%', d:'2.4s' }, { s:1.5, top:'88%', left:'80%', d:'0.9s' },
]

export default function SkyBackground() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [planeX, setPlaneX] = useState(-80)

  // Global mouse parallax
  useEffect(() => {
    const onMove = (e) => {
      setMouse({
        x: ((e.clientX) / window.innerWidth  - 0.5) * 2,
        y: ((e.clientY) / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Plane flies across (takes 12s) and waits 2s before repeating (14s total)
  useEffect(() => {
    const launch = () => {
      setPlaneX(-100)
      setTimeout(() => setPlaneX('110%'), 50)
    }
    launch()
    const id = setInterval(launch, 14000)
    return () => clearInterval(id)
  }, [])

  const fast = { transform: `translate(${mouse.x*24}px,${mouse.y*16}px)`, transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes cloudDrift {
          0%   { transform: translateX(0);     }
          100% { transform: translateX(110px); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0.15; transform:scale(1);   }
          50%     { opacity:1;    transform:scale(1.6); }
        }
        @keyframes planeAcross {
          0%   { left: -80px; }
          100% { left: 110%;  }
        }
        @keyframes auroraShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}</style>

      {/* Aurora layer */}
      <div aria-hidden style={{
        position:'absolute', inset:0, zIndex:0,
        background:'linear-gradient(135deg, var(--aurora-1) 0%, var(--aurora-2) 50%, var(--aurora-3) 100%)',
        backgroundSize:'400% 400%',
        animation:'auroraShift 14s ease infinite',
      }}/>

      {/* Drifting clouds */}
      {clouds.map((c,i) => (
        <div key={i} aria-hidden style={{
          position:'absolute', top:c.top, left:c.left,
          width:c.w, height:c.w*0.42,
          borderRadius:'50%', background:'rgba(255,255,255,0.9)',
          filter:'blur(36px)', opacity:c.opacity,
          animation:`cloudDrift ${c.dur} ease-in-out ${c.delay} infinite alternate`,
          ...fast,
        }}/>
      ))}

      {/* Star sparkles */}
      <div style={{ opacity: 'var(--sparkle-opacity)' }}>
        {sparkles.map((s,i) => (
          <div key={i} aria-hidden style={{
            position:'absolute', top:s.top, left:s.left,
            width:s.s, height:s.s, borderRadius:'50%',
            background:'#fff',
            boxShadow:`0 0 ${s.s*4}px rgba(255,255,255,0.9)`,
            animation:`sparkle ${2.5+i*0.3}s ease-in-out ${s.d} infinite`,
          }}/>
        ))}
      </div>

      {/* Flying plane */}
      <div aria-hidden style={{
        position:'absolute', top:'14%',
        left: planeX,
        fontSize:'clamp(1rem,2vw,1.4rem)',
        opacity:0.4,
        animation: planeX === '110%' ? 'planeAcross 12s linear forwards' : 'none',
        filter:'drop-shadow(0 0 6px rgba(245,166,35,0.4))',
      }}>✈</div>

      {/* Cursor glow */}
      <div aria-hidden style={{
        position:'absolute', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 60%)',
        top:'50%', left:'50%',
        transform:`translate(calc(-50% + ${mouse.x*80}px), calc(-50% + ${mouse.y*60}px))`,
        transition:'transform 0.4s cubic-bezier(.4,0,.2,1)',
      }}/>
    </div>
  )
}
