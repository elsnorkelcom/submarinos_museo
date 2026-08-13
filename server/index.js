const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const Papa = require('papaparse')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000

// Proxy endpoint to fetch Google Sheets Points tab as CSV and return JSON
app.get('/api/sheet/fetch', async (req,res)=>{
  const raw = req.query.url
  if(!raw) return res.status(400).json({error:'url query required'})
  try{
    // Accept either a Google Sheets URL or sheet ID
    let base = raw
    // If user passed full sheet url, try to extract /d/<id>/
    const m = raw.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if(m){ base = `https://docs.google.com/spreadsheets/d/${m[1]}` }
    const csvUrl = base.replace(/\/?$/, '') + `/gviz/tq?tqx=out:csv&sheet=Points`
    const r = await fetch(csvUrl)
    if(!r.ok) return res.status(502).json({error:'failed to fetch sheet'})
    const csv = await r.text()
    const parsed = Papa.parse(csv, {header:true, dynamicTyping:true})
    const data = parsed.data.map(row=>{
      // Normalize keys to expected column names and coerce lat/long
      const Latitude = parseFloat(row['Latitude']) || parseFloat(row['latitude']) || null
      const Longitude = parseFloat(row['Longitude']) || parseFloat(row['longitude']) || null
      return {...row, Latitude, Longitude}
    })
    res.json(data)
  }catch(err){
    console.error(err)
    res.status(500).json({error:'internal error'})
  }
})

// Intelligence dossier stub
app.post('/api/intelligence/dossier', (req,res)=>{
  const item = req.body.item || {}
  // TODO: integrate @google/genai using GENAI_KEY from env
  const briefing = `Briefing (stub) for ${item.Name || 'unknown'}:\nSummary: quick automated briefing stub.`
  res.json({briefing})
})

app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`))
