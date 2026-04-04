'use client'

import { useState } from 'react'

type PanelRowType =
  | { id: string; type: 'main-switch'; label: string; status: 'on' | 'off' }
  | { id: string; type: 'breakers'; label: string; items: number[] }
  | { id: string; type: 'aux-panel'; label: string; text: string }
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
  { id: 'r16', type: 'breakers', label: 'Linea R', items: [1, 0, 1, 1, 1, 1] },
  { id: 'r17', type: 'breakers', label: 'Linea S', items: [1, 1, 0, 0, 1, 1] },
  { id: 'blank-5', type: 'blank' },
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
  ['r12', 'r13', 'r14', 'r15', 'r16', 'r17', 'blank-5', 'blank-6'],
  ['r18', 'r19', 'aux-panel', 'blank-7', 'blank-8'],
]

const columnWidths = ['w-[210px]', 'w-[210px]', 'w-[210px]', 'w-[210px]']

const logs = [
  '10:42 - Interruttore 1 → ON',
  '10:40 - Linea C → livello 62%',
  '10:37 - Quadro BT Linea 1 → heartbeat ok',
  '10:34 - Allarme storico reset',
]

type RowState = { status: 'on' | 'off' } | { items: number[] }
type StatesMap = Record<string, RowState>

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
  const [selectedId, setSelectedId] = useState<string | null>('main-switch')

  const rowMap = Object.fromEntries(initialRows.map((r) => [r.id, r]))

  function toggleMainSwitch(id: string) {
    setStates((prev) => {
      const current = prev[id] as { status: 'on' | 'off' }
      return { ...prev, [id]: { status: current.status === 'on' ? 'off' : 'on' } }
    })
    setSelectedId(id)
  }

  function toggleBreaker(rowId: string, idx: number) {
    setStates((prev) => {
      const current = prev[rowId] as { items: number[] }
      const newItems = [...current.items]
      newItems[idx] = newItems[idx] ? 0 : 1
      return { ...prev, [rowId]: { items: newItems } }
    })
    setSelectedId(rowId)
  }

  function getSelectedInfo() {
    if (!selectedId) return null
    const row = rowMap[selectedId]
    if (!row || row.type === 'blank') return null
    const state = states[selectedId]

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
        status: active > 0 ? 'PARZIALE' : 'OFF',
        detail: `${active} / ${s.items.length} attivi`,
      }
    }
    if (row.type === 'aux-panel') {
      return { name: row.label, type: 'Pannello ausiliario', status: 'INFO', detail: null }
    }
    return null
  }

  const selected = getSelectedInfo()

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-zinc-800 bg-slate-900 text-white">
          <div className="border-b border-slate-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold">
                AT
              </div>
              <div>
                <p className="text-xl font-semibold leading-tight">Analog Twin</p>
                <p className="text-sm text-slate-300">Control Dashboard</p>
              </div>
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
              <SidebarItem label="Allarmi" />
              <SidebarItem label="Test / Simulazione" />
              <SidebarItem label="Settings" />
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">QUADRO BT - LINEA 1</h1>
                <span className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-white">STATUS: OK</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">Updated 2s ago</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium">LIVE</button>
              <button className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-500">SIMULATION</button>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </header>

          <div className="grid h-[calc(100vh-85px)] grid-cols-[1fr_340px] gap-0">
            <section className="overflow-auto p-8">
              <div className="rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Replica semplificata</p>
                    <h2 className="mt-1 text-xl font-semibold">Front view quadro elettrico</h2>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
                    Interazione componenti attiva
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
                                onSelect={() => setSelectedId(id)}
                                onToggleMainSwitch={() => toggleMainSwitch(id)}
                                onToggleBreaker={(idx) => toggleBreaker(id, idx)}
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
                  {logs.map((log) => (
                    <div key={log} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="border-l border-zinc-200 bg-white p-6">
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
                      />
                      {selected.detail && <InfoRow label="Dettaglio" value={selected.detail} />}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        ON
                      </button>
                      <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">
                        OFF
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-zinc-400">Nessun componente selezionato</p>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Metriche rapide</p>
                <div className="mt-4 grid gap-3">
                  <MiniMetric label="Interruttori attivi" value="18 / 24" />
                  <MiniMetric label="Allarmi attivi" value="1" />
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

type SidebarItemProps = { label: string; active?: boolean }

function SidebarItem({ label, active = false }: SidebarItemProps) {
  return (
    <button
      className={`flex w-full items-center rounded-xl px-4 py-3 text-left transition ${
        active ? 'bg-slate-800 font-semibold text-white' : 'text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      {label}
    </button>
  )
}

function SidebarSubItem({ label, active = false }: SidebarItemProps) {
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
  onSelect,
  onToggleMainSwitch,
  onToggleBreaker,
}: {
  row: PanelRowType
  state: RowState | undefined
  isSelected: boolean
  onSelect: () => void
  onToggleMainSwitch: () => void
  onToggleBreaker: (idx: number) => void
}) {
  const selectedRing = isSelected ? 'ring-2 ring-blue-500' : ''

  if (row.type === 'main-switch') {
    const s = state as { status: 'on' | 'off' }
    return (
      <button
        onClick={onToggleMainSwitch}
        className={`mb-4 flex h-24 w-full items-center justify-center rounded-md border border-zinc-500 bg-white transition hover:shadow-md ${selectedRing}`}
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
    )
  }

  if (row.type === 'breakers') {
    const s = state as { items: number[] }
    return (
      <div
        onClick={onSelect}
        className={`mb-4 block w-full rounded-md border border-zinc-500 bg-white px-3 py-2 cursor-pointer transition hover:shadow-md ${selectedRing}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{row.label}</span>
        </div>
        <div className="flex gap-1">
          {s.items.map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onToggleBreaker(idx) }}
              className="flex h-8 flex-1 items-center justify-center rounded-sm border border-zinc-400 bg-zinc-50 transition hover:border-blue-400"
            >
              <div className={`h-5 w-3 rounded-sm transition ${item ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (row.type === 'aux-panel') {
    return (
      <button
        onClick={onSelect}
        className={`mb-4 flex h-80 w-full items-center justify-center rounded-md border-2 border-red-400 bg-white p-4 text-center transition hover:shadow-md ${selectedRing}`}
      >
        <div className="whitespace-pre-line text-lg font-medium leading-tight tracking-wide text-red-500 [writing-mode:vertical-rl] [text-orientation:mixed]">
          {row.text}
        </div>
      </button>
    )
  }

  return <div className="mb-4 h-24 rounded-md border border-zinc-300 bg-[#f5f5f5]" />
}

function InfoRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold ${good ? 'text-emerald-600' : 'text-zinc-900'}`}>{value}</span>
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
