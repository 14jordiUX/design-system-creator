// El flujo completo ya montado: lleva el estado y el paso de una pantalla a otra. Solo tienes que pasarle
// las llamadas a tu servidor. Si prefieres otra navegación (rutas, por ejemplo), usa las pantallas sueltas.
"use client"
import * as React from "react"
import { AuthLayout } from "./auth-layout"
import { SignInScreen, type SignInValues } from "./sign-in"
import { RecoverPasswordScreen } from "./recover-password"
import { CheckEmailScreen } from "./check-email"
import { VerifyCodeScreen } from "./verify-code"
import { WelcomeScreen } from "./welcome"

export type SignInResult = { ok: true; needsCode?: boolean; user?: { name: string; avatarUrl?: string; news?: number } } | { ok: false; error: "wrongPassword" | (string & {}) }
export type CodeResult = { ok: true; user: { name: string; avatarUrl?: string; news?: number } } | { ok: false; error: string }

type Step = "signIn" | "recover" | "checkEmail" | "code" | "welcome"

export function LoginFlow({ signIn, sendRecoveryLink, verifyCode, resendCode, signInWithPasskey, onCreateAccount, onContinue, onSignOut, brand }: {
  /** Comprueba email y contraseña. Si la cuenta pide segundo paso, devuelve { ok: true, needsCode: true } */
  signIn: (values: SignInValues) => Promise<SignInResult>
  sendRecoveryLink: (email: string) => Promise<void>
  verifyCode: (code: string) => Promise<CodeResult>
  resendCode: () => Promise<void>
  signInWithPasskey?: () => Promise<SignInResult>
  onCreateAccount?: () => void
  /** «Ir al inicio» en la bienvenida */
  onContinue: () => void
  onSignOut: () => void
  brand?: React.ReactNode
}) {
  const [step, setStep] = React.useState<Step>("signIn")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; avatarUrl?: string; news?: number }>({ name: "" })

  const run = async <T,>(fn: () => Promise<T>) => {
    setPending(true); setError(null)
    try { return await fn() } finally { setPending(false) }
  }
  const afterSignIn = (r: SignInResult) => {
    if (!r.ok) return setError(r.error)
    if (r.needsCode) return setStep("code")
    if (r.user) setUser(r.user)
    setStep("welcome")
  }
  const go = (s: Step) => { setError(null); setStep(s) }

  return (
    <AuthLayout brand={brand}>
      {step === "signIn" && (
        <SignInScreen defaultEmail={email} error={error} pending={pending}
          onSubmit={async (v) => { setEmail(v.email); afterSignIn(await run(() => signIn(v))) }}
          onForgotPassword={() => go("recover")}
          onPasskey={signInWithPasskey ? async () => afterSignIn(await run(signInWithPasskey)) : undefined}
          onCreateAccount={onCreateAccount} />
      )}
      {step === "recover" && (
        <RecoverPasswordScreen defaultEmail={email} pending={pending} onBack={() => go("signIn")}
          onSubmit={async (e) => { setEmail(e); await run(() => sendRecoveryLink(e)); go("checkEmail") }} />
      )}
      {step === "checkEmail" && <CheckEmailScreen onBackToSignIn={() => go("signIn")} onNotReceived={() => go("recover")} />}
      {step === "code" && (
        <VerifyCodeScreen email={email} error={error} pending={pending} onBack={() => go("signIn")}
          onResend={() => run(resendCode)}
          onComplete={async (code) => {
            const r = await run(() => verifyCode(code))
            if (!r.ok) return setError(r.error)
            setUser(r.user); setStep("welcome")
          }} />
      )}
      {step === "welcome" && <WelcomeScreen {...user} onContinue={onContinue} onSignOut={() => { go("signIn"); onSignOut() }} />}
    </AuthLayout>
  )
}
