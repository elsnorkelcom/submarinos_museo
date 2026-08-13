import React from 'react'

export default function DossierModal({item, onClose}){
  if(!item) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-11/12 max-w-3xl p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{item.Name} — {item.Class}</h3>
          <button onClick={onClose} className="text-slate-400">Cerrar</button>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <img src={item.Image} alt="photo" className="w-full h-48 object-cover rounded" />
            <p className="text-sm text-slate-300 mt-2" dangerouslySetInnerHTML={{__html: item.Description||''}} />
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <div><strong>Ubicación:</strong> {item.Location}</div>
            <div><strong>Dirección:</strong> {item['Address found']}</div>
            <div><strong>Año botadura:</strong> {item['Launch year']}</div>
            <div><strong>Contacto:</strong> {item.Email}</div>
            <div className="pt-2"><a href={item.URL} target="_blank" className="text-tactical-green">Abrir recurso</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}
