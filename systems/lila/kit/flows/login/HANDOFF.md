# Flujo «Iniciar sesión» · ficha de entrega

**Estado:** validado · 2026-11-09
**Probado en:** el prototipo de la web (Prototipos → Iniciar sesión). Las pantallas de aquí son las mismas, sin datos de prueba ni navegación simulada.

## Instalar

En un proyecto con shadcn/ui y el tema del sistema:

```bash
npx shadcn@latest add https://14jordiux.github.io/design-system-creator/r/lila/flow-login.json
```

Trae las pantallas a `src/components/flows/login/`, los componentes que usan (de shadcn/ui y propios) y el tema.
Si no usas el comando, descarga el .zip desde la web y copia la carpeta; los componentes salen del kit del sistema.

## Cómo se usa

Lo más rápido es el flujo ya montado: solo le pasas las llamadas a tu servidor.

```tsx
import { LoginFlow } from "@/components/flows/login"

<LoginFlow
  signIn={async ({ email, password, remember }) => {
    const r = await api.signIn(email, password, remember)
    if (r.status === 401) return { ok: false, error: "wrongPassword" }
    return { ok: true, needsCode: r.twoFactor, user: r.user }
  }}
  sendRecoveryLink={(email) => api.sendRecovery(email)}
  verifyCode={async (code) => {
    const r = await api.verify(code)
    return r.ok ? { ok: true, user: r.user } : { ok: false, error: "Ese código no es válido. Prueba otra vez." }
  }}
  resendCode={() => api.resendCode()}
  onContinue={() => router.push("/")}
  onSignOut={() => api.signOut()}
/>
```

Si la app usa rutas (una URL por pantalla), usa las pantallas sueltas dentro de `<AuthLayout>` y navega tú.

## Recorrido

```
Entrar ──(contraseña mal)──▶ Entrar con aviso de error
  │  └─(¿La has olvidado?)──▶ Recuperar contraseña ──(Enviar enlace)──▶ Revisa tu correo
  │                                  ▲                                     │  ├─ Volver a entrar ─▶ Entrar
  │                                  └────────── No me ha llegado ─────────┘
  ├─(cuenta con segundo paso)──▶ Código de verificación ──(código bien)──▶ Bienvenida
  └─(sin segundo paso)──────────────────────────────────────────────────▶ Bienvenida ──(Cerrar sesión)─▶ Entrar
```

## Pantallas

| Archivo | Componente | Qué recibe | Qué avisa |
| --- | --- | --- | --- |
| `sign-in.tsx` | `SignInScreen` | `error` (`"wrongPassword"` o un texto), `pending`, `defaultEmail` | `onSubmit({ email, password, remember })`, `onForgotPassword`, `onPasskey`, `onCreateAccount` |
| `recover-password.tsx` | `RecoverPasswordScreen` | `pending`, `defaultEmail`, `linkMinutes` (30) | `onSubmit(email)`, `onBack` |
| `check-email.tsx` | `CheckEmailScreen` | — | `onBackToSignIn`, `onNotReceived` |
| `verify-code.tsx` | `VerifyCodeScreen` | `email`, `error`, `pending` | `onComplete(code)` (al escribir la 6.ª cifra), `onResend`, `onBack` |
| `welcome.tsx` | `WelcomeScreen` | `name`, `avatarUrl`, `news` | `onContinue`, `onSignOut` |
| `auth-layout.tsx` | `AuthLayout` | `brand` (por defecto `<Brand />`) | — |
| `login-flow.tsx` | `LoginFlow` | las llamadas al servidor | — |

Los botones opcionales (llave de acceso, crear cuenta, ¿la has olvidado?) solo salen si pasas su función.

## Estados y errores

- **Email vacío / con mal formato:** lo comprueba la pantalla al enviar. Textos: «Escribe tu email.» / «Este email no parece correcto.»
- **Contraseña vacía:** «Escribe tu contraseña.»
- **Contraseña incorrecta (servidor):** `error="wrongPassword"` → aviso rojo «La contraseña no es correcta · Vuelve a intentarlo o recupérala si no la recuerdas.» y el campo en rojo.
- **Otro error del servidor:** `error="texto"` → aviso «No hemos podido entrar» con ese texto.
- **Cargando:** `pending` → botones desactivados y un indicador en «Entrar» / «Enviar enlace».
- **Código incorrecto:** `error` en `VerifyCodeScreen`; se quita en cuanto se vuelve a escribir.
- **Recuperar contraseña:** responde siempre «Revisa tu correo», exista o no la cuenta (no reveles si un email está registrado).

## Lo que tiene que conectar el desarrollo

1. Las llamadas al servidor: entrar, enviar enlace de recuperación, comprobar y reenviar código, cerrar sesión.
2. Llave de acceso (WebAuthn), si la usáis. Si no, no pases `onPasskey`.
3. «Recordarme»: llega en `onSubmit`; decide cuánto dura la sesión.
4. Límite de intentos y bloqueo temporal (en el servidor; la pantalla muestra el texto que devuelvas en `error`).
5. La página de «Crear cuenta» y la de crear una nueva contraseña (a la que lleva el enlace del correo): no forman parte de este flujo.
6. Tu logo: `<LoginFlow brand={<Brand name="…" icon={<Logo />} />} />`.

## Componentes que usa

- shadcn/ui (con el estilo del sistema): alert, avatar, badge, button, card, checkbox, field, input, input-group, input-otp, spinner.
- Propios del sistema: brand, password-input, back-button, code-input, icon-badge.

Todo sale de tokens del sistema: no hay colores, tamaños ni espacios escritos a mano. Si cambias de sistema, cambia solo.

## Accesibilidad

- Cada campo tiene su etiqueta; los errores se anuncian con `role="alert"` (FieldError) y el campo lleva `aria-invalid`.
- El código tiene una etiqueta oculta («Código de verificación») y el foco entra solo.
- El botón del ojo dice «Ver contraseña» / «Ocultar contraseña».
