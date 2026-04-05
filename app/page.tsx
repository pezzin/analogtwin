'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type PanelRowType =
  | { id: string; type: 'main-switch'; label: string; status: 'on' | 'off' }
  | { id: string; type: 'breakers'; label: string; items: number[] }
  | { id: string; type: 'aux-panel'; label: string; text: string }
  | { id: string; type: 'gauge'; label: string; unit: string; min: number; max: number; value: number }
  | { id: string; type: 'blank' }

const initialRows: PanelRowType[] = [
  { id: 'main-switch', type: 'main-switch', label: 'Generale Q1', status: 'on' },
  { id: 'r1', type: 'breakers', label: 'Linea A', items: [1, 1, 0, 1, 1, 0] },
  { id: 'r2', type: 'breakers', label: 'Linea B', items: [1, 0, 1, 1, 0, 1] },
  { id: 'r3', type: 'breakers', label: 'Linea C', items: [1, 1, 1, 0, 1, 0] },
  { id: 'r4', type: 'breakers', label: 'Linea D', items: [0, 1, 1, 1, 0, 1] },
  { id: 'r5', type: 'breakers', label: 'Linea E', items: [1, 1, 0, 1, 1, 1] },
  { id: 'blank-1', type: 'blank' },
  { id: 'blank-2', type: 'blank' },
  { id: 'r6', type: 'breakers', label: 'Linea F', items: [1, 1, 0, 0, 1, 1] },
  { id: 'r7', type: 'breakers', label: 'Linea G', items: [1, 0, 1, 0, 1, 1] },
  { id: 'r8', type: 'breakers', label: 'Linea H', items: [1, 1, 1, 1, 0, 0] },
  { id: 'r9', type: 'breakers', label: 'Linea I', items: [1, 0, 1, 1, 1, 0] },
  { id: 'r10', type: 'breakers', label: 'Linea L', items: [0, 1, 0, 1, 1, 1] },
  { id: 'r11', type: 'breakers', label: 'Linea M', items: [1, 1, 0, 1, 0, 1] },
  { id: 'blank-3', type: 'blank' },
  { id: 'blank-4', type: 'blank' },
  { id: 'r12', type: 'breakers', label: 'Linea N', items: [1, 1, 0, 1, 1, 1] },
  { id: 'r13', type: 'breakers', label: 'Linea O', items: [1, 0, 1, 1, 0, 1] },
  { id: 'r14', type: 'breakers', label: 'Linea P', items: [1, 1, 1, 0, 1, 1] },
  { id: 'r15', type: 'breakers', label: 'Linea Q', items: [0, 1, 1, 1, 1, 0] },
  { id: 'gauge-1', type: 'gauge', label: 'Amperometro', unit: 'A', min: 0, max: 500, value: 340 },
  { id: 'gauge-2', type: 'gauge', label: 'Voltmetro', unit: 'V', min: 0, max: 480, value: 398 },
  { id: 'blank-6', type: 'blank' },
  { id: 'r18', type: 'breakers', label: 'Linea T', items: [1, 1, 1, 1, 0, 0] },
  { id: 'r19', type: 'breakers', label: 'Linea U', items: [1, 1, 0, 1, 1, 0] },
  {
    id: 'aux-panel',
    type: 'aux-panel',
    label: 'Circuito ausiliari',
    text: 'CIRCUITO AUSILIARI\nAPPARECCHIATURE\nIMPIANTO DI REGOLAZIONE\nE GESTIONE MANUALE',
  },
  { id: 'blank-7', type: 'blank' },
  { id: 'blank-8', type: 'blank' },
]

const columns = [
  ['main-switch', 'r1', 'r2', 'r3', 'r4', 'r5', 'blank-1', 'blank-2'],
  ['r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'blank-3', 'blank-4'],
  ['r12', 'r13', 'r14', 'r15', 'gauge-1', 'gauge-2', 'blank-6'],
  ['r18', 'r19', 'aux-panel', 'blank-7', 'blank-8'],
]

const columnWidths = ['w-[210px]', 'w-[210px]', 'w-[210px]', 'w-[210px]']

const initialLogs = [
  '10:42 - Interruttore 1 → ON',
  '10:40 - Linea C → livello 62%',
  '10:37 - Quadro BT Linea 1 → heartbeat ok',
  '10:34 - Allarme storico reset',
]

type RowState = { status: 'on' | 'off' } | { items: number[] } | { value: number }
type StatesMap = Record<string, RowState>

type GaugeAlert = { condition: 'above' | 'below'; threshold: number }

function buildInitialStates(rows: PanelRowType[]): StatesMap {
  const map: StatesMap = {}
  for (const row of rows) {
    if (row.type === 'main-switch') map[row.id] = { status: row.status }
    if (row.type === 'breakers') map[row.id] = { items: [...row.items] }
  }
  return map
}

export default function AnalogTwinDashboard() {
  const [states, setStates] = useState<StatesMap>(() => buildInitialStates(initialRows))
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [popupId, setPopupId] = useState<string | null>(null)
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set())
  const [gaugeAlerts, setGaugeAlerts] = useState<Record<string, GaugeAlert>>({})
  const [liveImageOpen, setLiveImageOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>(initialLogs)
  const firedAlerts = useRef<Set<string>>(new Set())

  const rowMap = Object.fromEntries(initialRows.map((r) => [r.id, r]))

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      // Latest reading per component
      const { data: readingRows } = await supabase
        .from('readings')
        .select('component_id, value')
        .order('captured_at', { ascending: false })
        .limit(200)

      const map: StatesMap = {}
      for (const row of readingRows ?? []) {
        if (!map[row.component_id]) map[row.component_id] = row.value
      }
      setStates(map)

      // Alert configs
      const { data: alertRows } = await supabase
        .from('alert_configs')
        .select('*')
        .eq('enabled', true)

      const newAlertedIds = new Set<string>()
      const newGaugeAlerts: Record<string, GaugeAlert> = {}
      for (const row of alertRows ?? []) {
        if (row.type === 'on-change') newAlertedIds.add(row.component_id)
        if (row.type === 'threshold') newGaugeAlerts[row.component_id] = { condition: row.condition, threshold: row.threshold }
      }
      setAlertedIds(newAlertedIds)
      setGaugeAlerts(newGaugeAlerts)
      setLoading(false)
    }

    loadData()

    // Realtime: update state when a new reading arrives
    const channel = supabase
      .channel('readings-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, (payload) => {
        const { component_id, value } = payload.new as { component_id: string; value: RowState }
        setStates((prev) => ({ ...prev, [component_id]: value }))
        const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const row = rowMap[component_id]
        if (row && row.type !== 'blank') {
          setLogs((prev) => [`${now} - ${row.label ?? component_id} → aggiornato`, ...prev].slice(0, 20))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function openPopup(id: string) {
    setSelectedId(id)
    setPopupId(id)
  }

  async function toggleAlert(id: string) {
    const supabase = createClient()
    const isActive = alertedIds.has(id)
    if (isActive) {
      setAlertedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      await supabase.from('alert_configs').delete().eq('component_id', id).eq('type', 'on-change')
    } else {
      setAlertedIds((prev) => new Set([...prev, id]))
      await supabase.from('alert_configs').upsert({ component_id: id, type: 'on-change', enabled: true })
    }
  }

  async function setGaugeAlert(id: string, alert: GaugeAlert | null) {
    const supabase = createClient()
    if (alert === null) {
      setGaugeAlerts((prev) => { const next = { ...prev }; delete next[id]; return next })
      await supabase.from('alert_configs').delete().eq('component_id', id).eq('type', 'threshold')
    } else {
      setGaugeAlerts((prev) => ({ ...prev, [id]: alert }))
      await supabase.from('alert_configs').upsert({
        component_id: id, type: 'threshold',
        condition: alert.condition, threshold: alert.threshold, enabled: true,
      })
    }
  }

  function isGaugeInViolation(id: string): boolean {
    const row = rowMap[id]
    const alert = gaugeAlerts[id]
    if (!alert || !row || row.type !== 'gauge') return false
    const state = states[id] as { value: number } | undefined
    const currentValue = state?.value ?? row.value
    return alert.condition === 'above' ? currentValue > alert.threshold : currentValue < alert.threshold
  }

  function getComponentInfo(id: string) {
    const row = rowMap[id]
    if (!row || row.type === 'blank') return null
    const state = states[id]

    if (row.type === 'main-switch') {
      const s = state as { status: 'on' | 'off' }
      return { name: row.label, type: 'Interruttore generale', status: s.status.toUpperCase(), detail: null }
    }
    if (row.type === 'breakers') {
      const s = state as { items: number[] }
      const active = s.items.filter(Boolean).length
      return {
        name: row.label,
        type: 'Gruppo interruttori',
        status: active === s.items.length ? 'ON' : active === 0 ? 'OFF' : 'PARZIALE',
        detail: `${active} / ${s.items.length} attivi`,
      }
    }
    if (row.type === 'aux-panel') {
      return { name: row.label, type: 'Pannello ausiliario', status: 'INFO', detail: null }
    }
    if (row.type === 'gauge') {
      const gaugeState = state as { value: number } | undefined
      const currentValue = gaugeState?.value ?? row.value
      const pct = Math.round(((currentValue - row.min) / (row.max - row.min)) * 100)
      return {
        name: row.label,
        type: 'Misuratore analogico',
        status: `${currentValue} ${row.unit}`,
        detail: `Livello: ${pct}%`,
      }
    }
    return null
  }

  const selected = selectedId ? getComponentInfo(selectedId) : null
  const activeAlerts = alertedIds.size + Object.keys(gaugeAlerts).length
  const activeViolations = Object.keys(gaugeAlerts).filter(isGaugeInViolation).length

  useEffect(() => {
    async function checkAndFire() {
      // Collect ids to fire and mark them synchronously BEFORE any await
      // This prevents race conditions when the effect runs twice concurrently
      const toFire: string[] = []
      Object.keys(gaugeAlerts).forEach((id) => {
        const violating = isGaugeInViolation(id)
        if (violating && !firedAlerts.current.has(id)) {
          firedAlerts.current.add(id) // mark immediately, before any await
          toFire.push(id)
        } else if (!violating) {
          firedAlerts.current.delete(id) // reset so it can fire again next time
        }
      })

      if (toFire.length === 0) return

      // Now do async work
      const supabase = createClient()
      const { data: recipientRows } = await supabase.from('recipients').select('email')
      const recipients = (recipientRows ?? []).map((r: { email: string }) => r.email)
      if (recipients.length === 0) return

      for (const id of toFire) {
        const row = rowMap[id] as { type: 'gauge'; label: string; unit: string; value: number }
        const alert = gaugeAlerts[id]
        const liveState = states[id] as { value: number } | undefined
        const currentValue = liveState?.value ?? row.value
        const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        setLogs((prev) => [`${now} - ALLARME: ${row.label} → ${currentValue} ${row.unit}`, ...prev].slice(0, 20))

        supabase.from('alert_history').insert({
          component_id: id,
          value: { value: currentValue, unit: row.unit },
          condition: alert.condition,
          threshold: alert.threshold,
          notified_emails: recipients,
        }).then()

        fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients,
            subject: `[AnalogTwin] Allarme: ${row.label} soglia superata`,
            body: `
              <div style="font-family:sans-serif;max-width:480px">
                <h2 style="color:#dc2626">⚠ Allarme AnalogTwin</h2>
                <p><strong>${row.label}</strong> ha superato la soglia configurata.</p>
                <table style="width:100%;border-collapse:collapse;margin-top:16px">
                  <tr><td style="padding:8px;color:#71717a">Componente</td><td style="padding:8px;font-weight:600">${row.label}</td></tr>
                  <tr style="background:#f4f4f5"><td style="padding:8px;color:#71717a">Valore attuale</td><td style="padding:8px;font-weight:600">${currentValue} ${row.unit}</td></tr>
                  <tr><td style="padding:8px;color:#71717a">Condizione</td><td style="padding:8px;font-weight:600">${alert.condition === 'above' ? 'Sopra' : 'Sotto'} ${alert.threshold} ${row.unit}</td></tr>
                  <tr style="background:#f4f4f5"><td style="padding:8px;color:#71717a">Orario</td><td style="padding:8px;font-weight:600">${now}</td></tr>
                </table>
                <p style="margin-top:16px;color:#71717a;font-size:13px">Accedi alla dashboard per maggiori dettagli.</p>
              </div>
            `,
          }),
        }).then((res) => {
          if (!res.ok) res.text().then((t) => console.error('Alert send failed:', t))
        }).catch((e) => console.error('Alert fetch error:', e))
      }
    }
    checkAndFire()
  }, [gaugeAlerts, rowMap, states])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        <p className="text-sm text-zinc-500">Caricamento dati dal DB...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Live image modal */}
      {liveImageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLiveImageOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Camera live</p>
                <p className="mt-1 text-lg font-semibold text-white">Quadro BT – Linea 1</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Aggiornato 42s fa
                </span>
                <button
                  onClick={() => setLiveImageOpen(false)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  Chiudi
                </button>
              </div>
            </div>

            {/* Camera image */}
            <div className="relative h-[220px] sm:h-[400px] w-full overflow-hidden rounded-xl bg-zinc-800">
              <img
                src="/foto_quadro_stanza.png"
                alt="Live camera feed"
                className="h-full w-full object-cover"
              />
              {/* Camera overlay */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400 opacity-70">
                  CAM-01 • AI VISION ACTIVE
                </div>
                <div className="absolute top-3 right-3 h-3 w-3 rounded-full border border-red-500 bg-red-500 opacity-80 animate-pulse" />
                <div className="absolute top-6 left-6 h-5 w-5 border-t-2 border-l-2 border-emerald-500 opacity-50" />
                <div className="absolute top-6 right-6 h-5 w-5 border-t-2 border-r-2 border-emerald-500 opacity-50" />
                <div className="absolute bottom-6 left-6 h-5 w-5 border-b-2 border-l-2 border-emerald-500 opacity-50" />
                <div className="absolute bottom-6 right-6 h-5 w-5 border-b-2 border-r-2 border-emerald-500 opacity-50" />
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Immagine acquisita ogni 60s dalla camera HD. L&apos;AI analizza lo stato degli interruttori e aggiorna il DB in tempo reale.
            </p>
          </div>
        </div>
      )}

      {/* Component popup */}
      {popupId && (() => {
        const info = getComponentInfo(popupId)
        if (!info) return null
        const hasAlert = alertedIds.has(popupId)
        const popupRow = rowMap[popupId]
        const isGauge = popupRow?.type === 'gauge'
        const gaugeAlert = gaugeAlerts[popupId]
        const inViolation = isGaugeInViolation(popupId)
        return (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
            onClick={() => setPopupId(null)}
          >
            <div
              className="w-80 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{info.type}</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">{info.name}</h3>
                </div>
                <button
                  onClick={() => setPopupId(null)}
                  className="text-zinc-400 hover:text-zinc-700 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <span className="text-sm text-zinc-500">Stato</span>
                  <span className={`text-sm font-bold ${
                    info.status === 'ON' ? 'text-emerald-600' :
                    info.status === 'OFF' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>{info.status}</span>
                </div>
                {info.detail && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <span className="text-sm text-zinc-500">Dettaglio</span>
                    <span className="text-sm font-semibold text-zinc-900">{info.detail}</span>
                  </div>
                )}
                {inViolation && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <span className="text-sm font-semibold text-red-600">⚠ Soglia superata</span>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-4">
                {isGauge ? (
                  <GaugeAlertConfig
                    row={popupRow as { type: 'gauge'; unit: string; min: number; max: number; value: number }}
                    alert={gaugeAlert ?? null}
                    onChange={(a) => setGaugeAlert(popupId, a)}
                  />
                ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Allarme variazione stato</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {hasAlert ? 'Notifica attiva se lo stato cambia' : 'Nessuna notifica configurata'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleAlert(popupId)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      hasAlert ? 'bg-emerald-500' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        hasAlert ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex min-h-screen">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:block
          border-r border-zinc-800 bg-slate-900 text-white
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="border-b border-slate-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold">
                  AT
                </div>
                <div>
                  <p className="text-xl font-semibold leading-tight">Analog Twin</p>
                  <p className="text-sm text-slate-300">Control Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          <nav className="px-4 py-6">
            <div className="space-y-2 text-[15px]">
              <SidebarItem label="Stabilimenti" />
              <SidebarItem label="Quadri elettrici" active />
            </div>

            <div className="mt-4 space-y-2 border-l border-slate-700 pl-4">
              <SidebarSubItem label="Quadro 01" active />
              <SidebarSubItem label="Quadro 02" />
              <SidebarSubItem label="Quadro 03" />
            </div>

            <div className="mt-8 space-y-2 text-[15px]">
              <SidebarItem label="Dashboard" />
              <SidebarItem label="Allarmi" badge={activeAlerts > 0 ? activeAlerts : undefined} />
              <SidebarItem label="Test / Simulazione" />
              <Link href="/settings" className="flex w-full items-center rounded-xl px-4 py-3 text-left text-[15px] text-slate-200 hover:bg-slate-800/60 transition">Settings</Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-hidden">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-8 py-4 sm:py-5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-3xl font-semibold tracking-tight truncate">QUADRO BT - LINEA 1</h1>
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-xs sm:text-sm font-semibold text-white flex-shrink-0">OK</span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm text-zinc-500">Updated 2s ago</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setLiveImageOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 transition"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="hidden sm:inline">Check live image</span>
                <span className="sm:hidden">Live</span>
              </button>
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">Online</span>
              </div>
            </div>
          </header>

          <div className="flex flex-col lg:grid lg:h-[calc(100vh-73px)] lg:grid-cols-[1fr_340px] gap-0 overflow-y-auto lg:overflow-hidden">
            <section className="overflow-auto p-4 sm:p-8">
              <div className="rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Replica semplificata</p>
                    <h2 className="mt-1 text-xl font-semibold">Front view quadro elettrico</h2>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
                    Sola lettura · clicca per dettagli
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-300 bg-zinc-100 p-6">
                  <div className="mx-auto flex min-w-[1040px] items-stretch gap-4">
                    {columns.map((colIds, colIndex) => (
                      <div
                        key={colIndex}
                        className={`${columnWidths[colIndex]} relative rounded-b-xl border border-zinc-500 bg-[#ececec] shadow-inner`}
                      >
                        <div className="flex h-9 items-center justify-center border-b border-zinc-600 bg-emerald-600 text-sm font-semibold text-white">
                          PrismaSET
                        </div>

                        <div className="border-x border-zinc-400 px-4 py-4">
                          {colIds.map((id) => {
                            const row = rowMap[id]
                            const state = states[id]
                            return (
                              <PanelRow
                                key={id}
                                row={row}
                                state={state}
                                isSelected={selectedId === id}
                                hasAlert={alertedIds.has(id) || !!gaugeAlerts[id]}
                                inViolation={isGaugeInViolation(id)}
                                onOpen={() => openPopup(id)}
                              />
                            )
                          })}
                        </div>

                        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                          Sezione {colIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-8 border-b border-zinc-200 pb-3 text-sm font-medium text-zinc-500">
                  <button className="border-b-2 border-zinc-900 pb-2 text-zinc-900">Event Log</button>
                  <button className="pb-2">Key Metrics</button>
                  <button className="pb-2">Components Status</button>
                </div>

                <div className="grid gap-3 text-sm text-zinc-700">
                  {logs.map((log, i) => (
                    <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="border-t lg:border-t-0 lg:border-l border-zinc-200 bg-white p-4 sm:p-6 overflow-y-auto">
              <div className="rounded-2xl border border-zinc-300 bg-zinc-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Componente selezionato</p>
                {selected ? (
                  <>
                    <h3 className="mt-2 text-2xl font-semibold">{selected.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{selected.type}</p>

                    <div className="mt-6 space-y-3">
                      <InfoRow
                        label="Stato"
                        value={selected.status}
                        good={selected.status === 'ON' || selected.status === 'PARZIALE'}
                        bad={selected.status === 'OFF'}
                      />
                      {selected.detail && <InfoRow label="Dettaglio" value={selected.detail} />}
                      <InfoRow
                        label="Allarme"
                        value={selectedId && alertedIds.has(selectedId) ? 'Attivo' : 'Non configurato'}
                        good={!!(selectedId && alertedIds.has(selectedId))}
                      />
                    </div>

                    <button
                      onClick={() => selectedId && setPopupId(selectedId)}
                      className="mt-5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                    >
                      Gestisci allarme
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-zinc-400">Clicca un componente sul quadro per vedere i dettagli.</p>
                )}
              </div>

              {activeAlerts > 0 && (
                <div className={`mt-5 rounded-2xl border p-5 shadow-sm ${activeViolations > 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <p className={`text-sm font-semibold ${activeViolations > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                    {activeViolations > 0 ? `⚠ ${activeViolations} soglia superata` : activeAlerts > 1 ? `${activeAlerts} allarmi configurati` : `${activeAlerts} allarme configurato`}
                  </p>
                  <div className="mt-3 space-y-2">
                    {Array.from(alertedIds).map((id) => {
                      const info = getComponentInfo(id)
                      if (!info) return null
                      return (
                        <div key={id} className="flex items-center justify-between rounded-lg bg-white border border-amber-100 px-3 py-2">
                          <span className="text-sm text-zinc-700">{info.name}</span>
                          <button onClick={() => toggleAlert(id)} className="text-xs text-amber-600 hover:text-amber-800">Rimuovi</button>
                        </div>
                      )
                    })}
                    {Object.entries(gaugeAlerts).map(([id, alert]) => {
                      const info = getComponentInfo(id)
                      if (!info) return null
                      const violation = isGaugeInViolation(id)
                      return (
                        <div key={id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${violation ? 'bg-red-50 border-red-200' : 'bg-white border-amber-100'}`}>
                          <div>
                            <span className="text-sm text-zinc-700">{info.name}</span>
                            <p className="text-xs text-zinc-400">{alert.condition === 'above' ? 'Sopra' : 'Sotto'} {alert.threshold} {(rowMap[id] as { unit?: string }).unit ?? ''}</p>
                          </div>
                          <button onClick={() => setGaugeAlert(id, null)} className="text-xs text-amber-600 hover:text-amber-800">Rimuovi</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Metriche rapide</p>
                <div className="mt-4 grid gap-3">
                  <MiniMetric label="Interruttori attivi" value="18 / 24" />
                  <MiniMetric label="Allarmi configurati" value={String(activeAlerts)} />
                  <MiniMetric label="Connessione" value="Stabile" />
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

type SidebarItemProps = { label: string; active?: boolean; badge?: number }

function SidebarItem({ label, active = false, badge }: SidebarItemProps) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
        active ? 'bg-slate-800 font-semibold text-white' : 'text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      {label}
      {badge !== undefined && (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
      )}
    </button>
  )
}

function SidebarSubItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        active ? 'bg-slate-700 font-semibold text-white' : 'text-slate-300 hover:bg-slate-800/60'
      }`}
    >
      <span className="text-slate-400">•</span>
      {label}
    </button>
  )
}

function PanelRow({
  row,
  state,
  isSelected,
  hasAlert,
  inViolation,
  onOpen,
}: {
  row: PanelRowType
  state: RowState | undefined
  isSelected: boolean
  hasAlert: boolean
  inViolation: boolean
  onOpen: () => void
}) {
  const ring = isSelected ? 'ring-2 ring-blue-500' : ''
  const alertDot = hasAlert ? (
    <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white ${inViolation ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
  ) : null

  if (row.type === 'main-switch') {
    const s = state as { status: 'on' | 'off' }
    return (
      <div className="relative mb-4">
        {alertDot}
        <button
          onClick={onOpen}
          className={`flex h-24 w-full items-center justify-center rounded-md border border-zinc-500 bg-white transition hover:shadow-md ${ring}`}
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-10 rounded-full border-2 border-zinc-700 bg-zinc-100 p-1">
              <div className={`mx-auto h-6 w-6 rounded-full ${s.status === 'on' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Generale</p>
              <p className="font-semibold text-zinc-900">{row.label}</p>
              <p className={`text-xs font-bold ${s.status === 'on' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {s.status.toUpperCase()}
              </p>
            </div>
          </div>
        </button>
      </div>
    )
  }

  if (row.type === 'breakers') {
    const s = state as { items: number[] }
    return (
      <div className="relative mb-4">
        {alertDot}
        <button
          onClick={onOpen}
          className={`block w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-left transition hover:shadow-md ${ring}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{row.label}</span>
          </div>
          <div className="flex gap-1">
            {s.items.map((item, idx) => (
              <div key={idx} className="flex h-8 flex-1 items-center justify-center rounded-sm border border-zinc-400 bg-zinc-50">
                <div className={`h-5 w-3 rounded-sm ${item ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
              </div>
            ))}
          </div>
        </button>
      </div>
    )
  }

  if (row.type === 'aux-panel') {
    return (
      <div className="relative mb-4">
        {alertDot}
        <button
          onClick={onOpen}
          className={`flex h-80 w-full items-center justify-center rounded-md border-2 border-red-400 bg-white p-4 text-center transition hover:shadow-md ${ring}`}
        >
          <div className="whitespace-pre-line text-lg font-medium leading-tight tracking-wide text-red-500 [writing-mode:vertical-rl] [text-orientation:mixed]">
            {row.text}
          </div>
        </button>
      </div>
    )
  }

  if (row.type === 'gauge') {
    return (
      <div className="relative mb-4">
        {alertDot}
        <button
          onClick={onOpen}
          className={`block w-full rounded-md border border-zinc-500 bg-[#1e1e1e] px-2 py-2 text-left transition hover:shadow-md ${ring}`}
        >
          <AnalogGauge value={(state as { value: number } | undefined)?.value ?? row.value} min={row.min} max={row.max} unit={row.unit} />
        </button>
      </div>
    )
  }

  return <div className="mb-4 h-24 rounded-md border border-zinc-300 bg-[#f5f5f5]" />
}

function InfoRow({ label, value, good = false, bad = false }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold ${good ? 'text-emerald-600' : bad ? 'text-red-500' : 'text-zinc-900'}`}>{value}</span>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  )
}

function GaugeAlertConfig({
  row,
  alert,
  onChange,
}: {
  row: { unit: string; min: number; max: number; value: number }
  alert: GaugeAlert | null
  onChange: (a: GaugeAlert | null) => void
}) {
  const [condition, setCondition] = useState<'above' | 'below'>(alert?.condition ?? 'above')
  const [threshold, setThreshold] = useState<string>(alert ? String(alert.threshold) : '')

  function save() {
    const v = parseFloat(threshold)
    if (!isNaN(v)) onChange({ condition, threshold: v })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-zinc-900">Allarme soglia</p>
        {alert && (
          <button onClick={() => onChange(null)} className="text-xs text-red-500 hover:text-red-700">Rimuovi</button>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        {(['above', 'below'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCondition(c)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${condition === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
          >
            {c === 'above' ? 'Sopra soglia' : 'Sotto soglia'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder={`Valore in ${row.unit}`}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={save}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Salva
        </button>
      </div>
      {alert && (
        <p className="mt-2 text-xs text-zinc-400">
          Allarme attivo se valore {alert.condition === 'above' ? 'supera' : 'scende sotto'} {alert.threshold} {row.unit}
        </p>
      )}
    </div>
  )
}

function AnalogGauge({ value, min, max, unit }: { value: number; min: number; max: number; unit: string }) {
  const cx = 80
  const cy = 90
  const r = 58

  const startAngle = 215
  const endAngle = 325
  const totalArc = endAngle - startAngle

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const needleAngleDeg = startAngle + ratio * totalArc
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180
  const needleLen = r - 12
  const needleX = cx + needleLen * Math.cos(needleAngleRad)
  const needleY = cy + needleLen * Math.sin(needleAngleRad)

  const arcR = r - 3

  function polarX(angleDeg: number, radius: number) {
    return cx + radius * Math.cos((angleDeg * Math.PI) / 180)
  }
  function polarY(angleDeg: number, radius: number) {
    return cy + radius * Math.sin((angleDeg * Math.PI) / 180)
  }
  function arcPath(radius: number, aDeg: number, bDeg: number) {
    const x1 = polarX(aDeg, radius)
    const y1 = polarY(aDeg, radius)
    const x2 = polarX(bDeg, radius)
    const y2 = polarY(bDeg, radius)
    const large = bDeg - aDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const redZoneStart = startAngle + 0.8 * totalArc

  const majorTicks = [0, 1, 2, 3, 4, 5].map((i) => {
    const t = i / 5
    const angleDeg = startAngle + t * totalArc
    const label = Math.round(min + t * (max - min))
    const isRed = label >= min + 0.8 * (max - min)
    return { angleDeg, label, isRed, t }
  })

  const minorAngles = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.9].map(
    (t) => startAngle + t * totalArc
  )

  return (
    <svg viewBox="0 0 160 130" width="100%" style={{ display: 'block' }}>
      {/* Outer bezel */}
      <rect x="1" y="1" width="158" height="128" rx="5" fill="#1a1a1a" stroke="#111" strokeWidth="1" />
      {/* Inner bezel ring */}
      <circle cx={cx} cy={cy} r={r + 6} fill="#2d2d2d" />
      {/* Dial face */}
      <circle cx={cx} cy={cy} r={r + 2} fill="#f0ede6" />

      {/* Red zone arc */}
      <path d={arcPath(arcR, redZoneStart, endAngle)} stroke="#dc2626" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Main scale arc */}
      <path d={arcPath(arcR, startAngle, redZoneStart)} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Minor tick marks */}
      {minorAngles.map((angleDeg, i) => (
        <line
          key={i}
          x1={polarX(angleDeg, arcR - 1)}
          y1={polarY(angleDeg, arcR - 1)}
          x2={polarX(angleDeg, arcR - 8)}
          y2={polarY(angleDeg, arcR - 8)}
          stroke={angleDeg >= redZoneStart ? '#dc2626' : '#444'}
          strokeWidth="1"
        />
      ))}

      {/* Major tick marks and labels */}
      {majorTicks.map(({ angleDeg, label, isRed }, i) => (
        <g key={i}>
          <line
            x1={polarX(angleDeg, arcR - 1)}
            y1={polarY(angleDeg, arcR - 1)}
            x2={polarX(angleDeg, arcR - 14)}
            y2={polarY(angleDeg, arcR - 14)}
            stroke={isRed ? '#dc2626' : '#1a1a1a'}
            strokeWidth="1.5"
          />
          <text
            x={polarX(angleDeg, arcR - 24)}
            y={polarY(angleDeg, arcR - 24) + 2.5}
            textAnchor="middle"
            fontSize="7"
            fill={isRed ? '#dc2626' : '#222'}
            fontFamily="sans-serif"
            fontWeight="500"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Unit label */}
      <text x={cx} y={cy - 24} textAnchor="middle" fontSize="15" fontWeight="bold" fill="#111" fontFamily="sans-serif">
        {unit}
      </text>

      {/* Needle shadow */}
      <line x1={cx + 1} y1={cy + 1} x2={needleX + 1} y2={needleY + 1} stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
      {/* Pivot */}
      <circle cx={cx} cy={cy} r="5" fill="#2a2a2a" />
      <circle cx={cx} cy={cy} r="2.5" fill="#888" />

      {/* Bottom info bar */}
      <rect x="1" y="121" width="158" height="8" rx="0" fill="#111" />
      <text x={cx - 15} y="127" fontSize="5" fill="#666" fontFamily="monospace">CE</text>
      <text x={cx + 2} y="127" fontSize="5" fill="#555" fontFamily="monospace">Q~15L • 50/60Hz</text>
    </svg>
  )
}
