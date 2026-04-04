'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'analogtwin_recipients'

export default function SettingsPage() {
  const [recipients, setRecipients] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host: string | null; from: string | null } | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setRecipients(JSON.parse(stored))

    fetch('/api/smtp-status')
      .then((r) => r.json())
      .then(setSmtpStatus)
  }, [])

  function saveRecipients(next: string[]) {
    setRecipients(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('Email non valida')
      return
    }
    if (recipients.includes(email)) {
      setEmailError('Email già presente')
      return
    }
    saveRecipients([...recipients, email])
    setNewEmail('')
    setEmailError('')
  }

  function removeEmail(email: string) {
    saveRecipients(recipients.filter((r) => r !== email))
  }

  async function sendTestEmail() {
    if (recipients.length === 0) {
      setTestError('Aggiungi almeno un destinatario prima di testare.')
      return
    }
    setTestStatus('sending')
    setTestError('')
    try {
      const res = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
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
        const data = await res.json()
        throw new Error(data.error ?? 'Errore sconosciuto')
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
              <SidebarLink href="/" label="Quadri elettrici" />
              <SidebarLink href="/" label="Dashboard" />
              <SidebarLink href="/" label="Allarmi" />
              <SidebarLink href="/settings" label="Settings" active />
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-10 max-w-3xl">
          <h1 className="text-3xl font-semibold mb-1">Settings</h1>
          <p className="text-sm text-zinc-500 mb-10">Configurazione notifiche e SMTP</p>

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
                {recipients.map((email) => (
                  <li key={email} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <span className="text-sm text-zinc-800">{email}</span>
                    <button
                      onClick={() => removeEmail(email)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Rimuovi
                    </button>
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
