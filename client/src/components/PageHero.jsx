import { useEffect, useRef, useState } from 'react'

// Letter-by-letter floating animation
function FloatLetters({ text, baseDelay = 0, gradient = false }) {
  return (
    <>
      {text.split('').map((ch, i) => {
        const floatAnim = `letterFloat 3.5s ease-in-out ${(baseDelay + i * 0.07).toFixed(2)}s infinite alternate`
        const shimmerAnim = `shimmerText 3s linear infinite`
        
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: gradient ? `${floatAnim}, ${shimmerAnim}` : floatAnim,
              whiteSpace: ch === ' ' ? 'pre' : undefined,
              ...(gradient ? {
                background: 'linear-gradient(90deg, #f5a623 0%, #ffd166 35%, #ffbe4d 65%, #f5a623 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% auto',
              } : {})
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        )
      })}
    </>
  )
}



/**
 * Reusable sky-themed page hero
 * Props:
 *   line1      – white text line   (e.g. "Find Your")
 *   line2      – accent/gold line  (e.g. "Perfect Stay")
 *   subtitle   – subtitle text
 *   badge      – small pill text   (optional)
 *   icon       – emoji icon        (default ✈)
 */
export default function PageHero({
  line1    = 'The Sky Is',
  line2    = 'Your Runway',
  subtitle = '',
  badge    = 'Book smarter · Fly better',
  icon     = '✈',
  inlineTitle = false,
}) {
  const sectionRef = useRef(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [planeX, setPlaneX] = useState(-80)

  // Mouse parallax
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      setMouse({
        x: ((e.clientX - r.left) / r.width  - 0.5) * 2,
        y: ((e.clientY - r.top)  / r.height - 0.5) * 2,
      })
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])



  const slow   = { transform: `translate(${mouse.x*7}px,${mouse.y*4}px)`,   transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)' }
  const medium = { transform: `translate(${mouse.x*14}px,${mouse.y*9}px)`,  transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)' }
  const fast   = { transform: `translate(${mouse.x*24}px,${mouse.y*16}px)`, transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)' }

  return (
    <>
      <style>{`
        @keyframes letterFloat {
          0%   { transform: translateY(0px)   rotate(0deg);   }
          50%  { transform: translateY(-5px) rotate(0.8deg); }
          100% { transform: translateY(-10px) rotate(-0.5deg);}
        }

        @keyframes shimmerText {
          0%   { background-position: 0%   center; }
          100% { background-position: 200% center; }
        }
        @keyframes badgeFloat {
          0%,100% { transform:translateY(0);   box-shadow:0 4px 16px rgba(245,166,35,0.15); }
          50%     { transform:translateY(-5px); box-shadow:0 10px 28px rgba(245,166,35,0.28);}
        }
      `}</style>

      <section
        ref={sectionRef}
        className="relative z-10 text-center overflow-hidden"
        style={{ padding: 'clamp(1.5rem, 4vh, 2.5rem) 0 0' }}
        onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      >
        
        {/* Background flight animation passing between badge and headline */}
        <div 
          className="absolute pointer-events-none z-1"
          style={{
            top: 'clamp(4.5rem, 10vh, 6rem)',
            left: planeX,
            fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
            color: 'rgba(255,255,255,0.1)',
            transition: planeX === -100 ? 'none' : 'left 12s linear',
            filter: 'blur(1px)',
            opacity: 0.6,
          }}
        >
          ✈
        </div>

        <div className="container-main" style={{ position:'relative', zIndex:2 }}>

          {/* Badge */}
          {badge && (
            <div
              className="anim-1 inline-flex items-center gap-2 font-semibold rounded-full"
              style={{
                marginBottom: 'clamp(2.5rem, 5vh, 3.5rem)', // Added space for plane to pass
                background:'rgba(245,166,35,0.08)',
                border:'1px solid rgba(245,166,35,0.25)',
                color:'var(--color-accent)',
                fontSize:'clamp(0.6rem, 1.2vw, 0.72rem)',
                padding:'5px 14px',
                letterSpacing:'0.08em',
                animation:'badgeFloat 4s ease-in-out infinite',
                ...slow,
              }}
            >
              <span style={{ fontSize:8, opacity:0.7 }}>✦</span>
              {badge}
            </div>
          )}

          {/* Headline */}
          <h1
            className="anim-2 font-syne font-extrabold"
            style={{
              fontSize:'clamp(1.8rem, 6.5vw, 4.5rem)',
              letterSpacing:'-0.03em',
              lineHeight:1.1,
              textAlign:'center',
              marginBottom:'0.4rem',
              ...medium,
            }}
          >
            {/* Line 1 — white */}
            {line1 && (
              <span style={{ 
                display: inlineTitle ? 'inline-block' : 'block', 
                textAlign: 'center', 
                color: 'var(--text-primary)', 
                marginRight: inlineTitle ? '0.3em' : '0', 
                marginBottom: inlineTitle ? '0' : '0.15em' 
              }}>
                <FloatLetters text={line1} baseDelay={0} />
              </span>
            )}

            {/* Line 2 — shimmer gold */}
            <span style={{
              display: inlineTitle ? 'inline-block' : 'block', textAlign: 'center',
            }}>
              <FloatLetters text={line2} baseDelay={line1 ? 0.55 : 0} gradient />
            </span>
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              className="anim-3 text-text-muted"
              style={{
                fontSize:'clamp(0.8rem, 1.6vw, 0.95rem)',
                lineHeight:1.6,
                maxWidth:'clamp(280px, 80vw, 720px)',
                width:'100%', display:'block',
                textAlign:'center',
                margin:'0.5rem auto 1.5rem',
                animation:'subtitleFloat 5s ease-in-out 1.2s infinite',
                ...slow,
              }}
            >
              {subtitle}
            </p>
          )}

        </div>
      </section>
    </>
  )
}
