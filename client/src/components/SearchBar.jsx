import React, {useState} from 'react'

export default function SearchBar({onSearch}){
  const [q,setQ] = useState('')
  return (
    <div className="flex items-center gap-2">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar submarino, museo, ciudad..." className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded w-64 text-sm" />
      <button onClick={()=>onSearch(q)} className="bg-tacticalGreen px-3 py-1 rounded text-slate-900 text-sm">Buscar</button>
    </div>
  )
}
