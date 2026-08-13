import React, {useRef} from 'react'

export default function AudioSynth(){
  const ctxRef = useRef(null)
  function ping(){
    if(!ctxRef.current) ctxRef.current = new (window.AudioContext||window.webkitAudioContext)()
    const ctx = ctxRef.current
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.value = 0
    o.connect(g); g.connect(ctx.destination)
    const now = ctx.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.12, now+0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now+0.8)
    o.start(now); o.stop(now+1)
  }
  return (
    <div className="p-3 rounded bg-slate-900 border border-slate-800">
      <h4 className="text-sm font-medium">Sonido Táctico</h4>
      <div className="mt-2">
        <button onClick={ping} className="bg-tactical-green px-3 py-1 rounded text-slate-900 text-sm">Ping</button>
      </div>
    </div>
  )
}
