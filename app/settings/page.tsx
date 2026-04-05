'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function SettingsPage() {
  const [recipients, setRecipients] = useState<{ id: number; email: string }[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host: string | null; from: string | null } | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('recipients').select('*').order('id').then(({ data }) => {
      if (data) setRecipients(data)
    })
    fetch('/api/smtp-status').then((r) => r.json()).then(setSmtpStatus)
  }, [])

  async function addEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setEmailError('Email non valida'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('recipients').insert({ email }).select().single()
    if (error) { setEmailError(error.message); return }
    setRecipients((prev) => [...prev, data])
    setNewEmail('')
    setEmailError('')
  }

  async function removeEmail(id: number) {
    const supabase = createClient()
    await supabase.from('recipients').delete().eq('id', id)
    setRecipients((prev) => prev.filter((r) => r.id !== id))
  }

  async function sendTestEmail() {
    if (recipients.length === 0) {
      setTestError('Aggiungi almeno un destinatario prima di testare.')
      return
    }
    const emailList = recipients.map((r) => r.email)
    setTestStatus('sending')
    setTestError('')
    try {
      const res = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: emailList,
          subject: '[AnalogTwin] Test notifica allarme',
          body: `
            <div style="font-family:sans-serif;max-width:480px">
              <h2 style="color:#18181b">AnalogTwin – Test notifica</h2>
              <p>Questo è un messaggio di test per verificare la configurazione SMTP.</p>
              <p style="color:#71717a;font-size:13px">Se ricevi questo messaggio, la configurazione è corretta.</p>
            </div>
          `,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = 'Errore sconosciuto'
        try { message = JSON.parse(text).error ?? message } catch { message = text || message }
        throw new Error(message)
      }
      setTestStatus('ok')
    } catch (e) {
      setTestStatus('error')
      setTestError(e instanceof Error ? e.message : 'Errore durante l\'invio')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="flex min-h-screen">

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          border-r border-zinc-800 bg-slate-900 text-white
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="border-b border-slate-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold">AT</div>
                <div>
                  <p className="text-xl font-semibold leading-tight">Analog Twin</p>
                  <p className="text-sm text-slate-300">Control Dashboard</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
          </div>

          <nav className="px-4 py-6">
            <div className="space-y-2 text-[15px]">
              <SidebarLink href="/" label="Quadri elettrici" />
              <SidebarLink href="/" label="Dashboard" />
              <SidebarLink href="/" label="Allarmi" />
              <SidebarLink href="/settings" label="Settings" active />
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 sm:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
          </header>

          <div className="p-4 sm:p-10 max-w-3xl">
          <p className="text-sm text-zinc-500 mb-8">Configurazione notifiche e SMTP</p>

          {/* SMTP status */}
          <section className="mb-8 rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1">Configurazione SMTP</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Modifica le variabili d&apos;ambiente in <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">.env.local</code> per configurare il server di posta.
            </p>

            {smtpStatus === null ? (
              <p className="text-sm text-zinc-400">Caricamento...</p>
            ) : smtpStatus.configured ? (
              <div className="space-y-2">
                <StatusRow label="Stato" value="Configurato" good />
                <StatusRow label="Host" value={smtpStatus.host ?? '—'} />
                <StatusRow label="Mittente" value={smtpStatus.from ?? '—'} />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                SMTP non configurato. Imposta <code className="font-mono">SMTP_HOST</code>, <code className="font-mono">SMTP_USER</code> e <code className="font-mono">SMTP_PASS</code> in <code className="font-mono">.env.local</code>.
              </div>
            )}
          </section>

          {/* Recipients */}
          <section className="mb-8 rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1">Destinatari allarmi</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Tutti gli allarmi attivi verranno inviati a questi indirizzi.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                placeholder="nome@esempio.com"
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={addEmail}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition"
              >
                Aggiungi
              </button>
            </div>

            {emailError && <p className="mb-3 text-xs text-red-500">{emailError}</p>}

            {recipients.length === 0 ? (
              <p className="text-sm text-zinc-400">Nessun destinatario configurato.</p>
            ) : (
              <ul className="space-y-2">
                {recipients.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <span className="text-sm text-zinc-800">{r.email}</span>
                    <button onClick={() => removeEmail(r.id)} className="text-xs text-red-500 hover:text-red-700">Rimuovi</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Test email */}
          <section className="rounded-2xl border border-zinc-300 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1">Test notifica</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Invia un&apos;email di test a tutti i destinatari configurati.
            </p>

            <button
              onClick={sendTestEmail}
              disabled={testStatus === 'sending'}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {testStatus === 'sending' ? 'Invio in corso...' : 'Invia email di test'}
            </button>

            {testStatus === 'ok' && (
              <p className="mt-3 text-sm text-emerald-600">Email inviata correttamente.</p>
            )}
            {testStatus === 'error' && (
              <p className="mt-3 text-sm text-red-500">{testError}</p>
            )}
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center rounded-xl px-4 py-3 text-left transition ${
        active ? 'bg-slate-800 font-semibold text-white' : 'text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      {label}
    </Link>
  )
}

function StatusRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold ${good ? 'text-emerald-600' : 'text-zinc-900'}`}>{value}</span>
    </div>
  )
}
