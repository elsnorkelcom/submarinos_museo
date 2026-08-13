import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function tacticalIcon(iconUrl){
  if(!iconUrl) return null
  return L.icon({
    iconUrl,
    iconSize:[36,36],
    className:'rounded-full border border-[--tactical-green]'
  })
}

export default function MapView({points=[], onSelect}){
  const center = points.length? [points[0].Latitude||0, points[0].Longitude||0] : [20,0]
  return (
    <MapContainer center={center} zoom={2} className="leaflet-container">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png" />
      {points.map((p,idx)=>{
        const icon = p['Icon URL'] ? tacticalIcon(p['Icon URL']) : undefined
        return (
          <Marker key={idx} position={[p.Latitude, p.Longitude]} icon={icon} eventHandlers={{click:()=>onSelect(p)}}>
            <Popup>
              <div className="w-64">
                <strong>{p.Name}</strong>
                <div className="text-xs text-slate-400">{p.Location} — {p.Country}</div>
                <img src={p.Image} alt="thumb" className="mt-2 w-full h-28 object-cover" />
                <div className="mt-1"><a className="text-sm text-tactical-green" href={p.URL} target="_blank">Ficha completa</a></div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
