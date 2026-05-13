import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function JobApply() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '8rem 0 6rem', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container-main text-center" style={{ maxWidth: 600 }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
            ⚠️
          </div>
          <h1 className="font-syne text-3xl font-bold mb-4">Position Closed</h1>
          <p className="text-text-muted text-lg mb-2">
            We're sorry, but the position you are looking for ({jobId}) is no longer accepting applications.
          </p>
          <p className="text-text-muted mb-8 text-sm">
            This job listing has expired or the role has already been filled. Please check our Careers page for other exciting opportunities.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate(-1)} className="btn-ghost px-6 py-3">← Go Back</button>
            <button onClick={() => navigate('/careers')} className="btn-accent px-6 py-3 shadow-lg" style={{ color: '#0a1628' }}>View Open Jobs</button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
