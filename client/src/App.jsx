import React, {useState, useEffect} from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import DossierModal from './components/DossierModal'
import AudioSynth from './components/AudioSynth'

export default function App(){
  const [points, setPoints] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    const sheetUrl = localStorage.getItem('sheet_url')
    if(sheetUrl){
      fetch(`/api/sheet/fetch?url=${encodeURIComponent(sheetUrl)}`)
        .then(r=>r.json())
        .then(data=>setPoints(data))
        .catch(()=>console.warn('sheet fetch failed'))
    }
  },[])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="p-4 flex items-center justify-between border-b border-slate-800">
        <h1 className="text-lg font-semibold">Portal Submarinos — Consola Táctica</h1>
        <div className="flex gap-2 items-center">
          <SearchBar onSearch={()=>{}} />
        </div>
      </header>
      <main className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <section className="lg:col-span-3 h-[72vh] rounded-lg overflow-hidden border border-slate-800">
          <MapView points={points} onSelect={setSelected} />
        </section>
        <aside className="lg:col-span-1 space-y-4">
          <div className="p-3 rounded bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-medium">HUD</h2>
            <p className="text-xs text-slate-400">Unidades visibles: {points.length}</p>
          </div>
          <AudioSynth />
        </aside>
      </main>
      {selected && <DossierModal item={selected} onClose={()=>setSelected(null)} />}
    </div>
  )
}
