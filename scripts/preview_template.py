"""Plantilla de preview.html (la usa generate.py)."""
import json

def render(data, css, name):
    html = TEMPLATE
    return (html.replace("__CSS__", css).replace("__DATA__", json.dumps(data, ensure_ascii=False))
            .replace("__NAME__", name))


TEMPLATE = """<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__NAME__ · Vista previa</title>
<style>
__CSS__
* { box-sizing: border-box; }
body { margin: 0; background: var(--color-bg-default); color: var(--color-text-default);
  font-family: var(--font-family-sans); font-size: var(--font-size-md); line-height: var(--font-line-height-normal);
  transition: background var(--motion-duration-default), color var(--motion-duration-default); }
.layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
nav { position: sticky; top: 0; height: 100vh; padding: var(--space-inset-lg); border-right: 1px solid var(--color-border-default); background: var(--color-bg-subtle); }
nav a { display: block; padding: var(--space-1-5) var(--space-2); border-radius: var(--radius-control); color: var(--color-text-muted); text-decoration: none; font-size: var(--font-size-sm); }
nav a:hover { background: var(--color-bg-action-ghost-hover); color: var(--color-text-default); }
nav h1 { font-size: var(--font-size-md); margin: 0 0 var(--space-4); }
main { padding: var(--space-10) var(--space-12); max-width: 1100px; }
section { margin-bottom: var(--space-section); }
h2.sec { font-size: var(--font-size-2xl); margin: 0 0 var(--space-2); }
p.lead { color: var(--color-text-muted); margin: 0 0 var(--space-6); }
h3.sub { font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: var(--font-letter-spacing-wide); color: var(--color-text-muted); margin: var(--space-6) 0 var(--space-3); }
.scale { display: grid; grid-template-columns: repeat(11, 1fr); gap: 4px; margin-bottom: var(--space-3); }
.sw { height: 56px; border-radius: var(--radius-sm); }
.swl { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; font-family: var(--font-family-mono); }
.scale-name { font-weight: 600; font-size: var(--font-size-sm); margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
td, th { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border-default); vertical-align: middle; }
th { color: var(--color-text-muted); font-weight: 500; }
code { font-family: var(--font-family-mono); font-size: 12px; }
.chip { display: inline-block; width: 28px; height: 28px; border-radius: var(--radius-sm); border: 1px solid var(--color-border-default); vertical-align: middle; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-gap-md); }
.card { background: var(--color-surface-card); border: 1px solid var(--color-border-default); border-radius: var(--radius-card); padding: var(--space-inset-lg); }
.btn { font: inherit; font-size: var(--font-size-sm); font-weight: 500; height: var(--control-height-md); padding: 0 var(--space-inset-md); border-radius: var(--radius-control); border: 1px solid transparent; cursor: pointer; transition: background var(--motion-duration-micro) var(--motion-easing-default); }
.btn:focus-visible { outline: var(--control-focus-ring-width) solid var(--color-border-focus); outline-offset: 2px; }
.btn-primary { background: var(--color-bg-action-primary-default); color: var(--color-text-on-action-primary); }
.btn-primary:hover { background: var(--color-bg-action-primary-hover); }
.btn-secondary { background: var(--color-bg-action-secondary-default); color: var(--color-text-on-action-secondary); }
.btn-secondary:hover { background: var(--color-bg-action-secondary-hover); }
.btn-ghost { background: transparent; color: var(--color-text-on-action-ghost); }
.btn-ghost:hover { background: var(--color-bg-action-ghost-hover); }
.btn-outline { background: transparent; color: var(--color-text-default); border-color: var(--color-border-strong); }
.btn-danger { background: var(--color-bg-feedback-danger-default); color: var(--color-text-on-feedback-danger); }
.btn:disabled { background: var(--color-bg-action-disabled); color: var(--color-text-on-action-disabled); cursor: not-allowed; }
.input { font: inherit; font-size: var(--font-size-sm); height: var(--control-height-md); padding: 0 var(--space-3); border-radius: var(--radius-control); border: 1px solid var(--color-border-input); background: var(--color-bg-default); color: var(--color-text-default); width: 100%; }
.input::placeholder { color: var(--color-text-subtle); }
.input:focus { outline: var(--control-focus-ring-width) solid var(--color-border-focus); outline-offset: 1px; }
.row { display: flex; gap: var(--space-gap-sm); flex-wrap: wrap; align-items: center; }
.badge { display: inline-flex; align-items: center; height: 22px; padding: 0 var(--space-inset-sm); border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: 500; }
.alert { padding: var(--space-3) var(--space-4); border-radius: var(--radius-card); border: 1px solid; font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
.toggle { position: fixed; top: var(--space-4); right: var(--space-4); z-index: 10; }
.typo-row { display: flex; gap: var(--space-6); align-items: baseline; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-default); }
.typo-row code { width: 170px; flex: none; color: var(--color-text-muted); }
.bar { height: 16px; background: var(--color-bg-action-primary-subtle); border: 1px solid var(--color-border-focus); border-radius: 2px; }
.elev { height: 90px; background: var(--color-surface-card); border-radius: var(--radius-card); display: grid; place-items: center; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.dialog { background: var(--color-surface-popover); border-radius: var(--radius-overlay); box-shadow: var(--elevation-modal); padding: var(--space-inset-xl); max-width: 420px; border: 1px solid var(--color-border-default); }
</style></head>
<body>
<button class="btn btn-outline toggle" onclick="document.documentElement.classList.toggle('dark')">Claro / Oscuro</button>
<div class="layout">
<nav><h1>__NAME__</h1>
<a href="#intro">Introducción</a><a href="#primitivos">Colores primitivos</a><a href="#semanticos">Colores semánticos</a>
<a href="#tipografia">Tipografía</a><a href="#espaciado">Espaciado</a><a href="#radios">Radios y elevación</a><a href="#componentes">Componentes de muestra</a></nav>
<main>
<section id="intro"><h2 class="sec">__NAME__</h2>
<p class="lead">Tokens genéricos en formato W3C (DTCG), en dos capas: <b>primitivos</b> (valores en bruto: escalas de color, tamaños, espaciado) y <b>semánticos</b> (para qué sirve cada valor: fondo, texto, acción principal, error…). Los componentes solo usan semánticos, así que cambiar de marca o pasar a modo oscuro es cambiar los semánticos, sin tocar componentes. Pulsa «Claro / Oscuro» arriba a la derecha.</p></section>

<section id="primitivos"><h2 class="sec">Colores primitivos</h2>
<p class="lead">Escalas de 50 a 950. <b>brand</b> es la que se cambia en cada sistema nuevo; el resto son neutros y colores de estado.</p><div id="scales"></div></section>

<section id="semanticos"><h2 class="sec">Colores semánticos</h2>
<p class="lead">Cada rol apunta a un primitivo distinto en claro y en oscuro. Todos los pares texto/fondo cumplen contraste WCAG AA (4.5:1).</p>
<table><thead><tr><th>Token</th><th>Claro</th><th>Oscuro</th></tr></thead><tbody id="sem"></tbody></table></section>

<section id="tipografia"><h2 class="sec">Tipografía</h2><p class="lead">Estilos compuestos (familia, tamaño, peso, interlineado y tracking).</p><div id="typo"></div></section>

<section id="espaciado"><h2 class="sec">Espaciado</h2><p class="lead">Escala base de 4px.</p><div id="space"></div></section>

<section id="radios"><h2 class="sec">Radios y elevación</h2>
<div class="grid" id="radius"></div><h3 class="sub">Elevación</h3><div class="grid" id="elev"></div></section>

<section id="componentes"><h2 class="sec">Componentes de muestra</h2>
<p class="lead">Ejemplos hechos solo con tokens semánticos, para ver cómo se comporta el sistema.</p>
<h3 class="sub">Botones</h3>
<div class="row"><button class="btn btn-primary">Primario</button><button class="btn btn-secondary">Secundario</button><button class="btn btn-outline">Contorno</button><button class="btn btn-ghost">Fantasma</button><button class="btn btn-danger">Eliminar</button><button class="btn" disabled>Deshabilitado</button></div>
<h3 class="sub">Badges</h3><div class="row" id="badges"></div>
<h3 class="sub">Alertas</h3><div id="alerts"></div>
<h3 class="sub">Formulario en tarjeta</h3>
<div class="grid" style="grid-template-columns:1fr 1fr"><div class="card">
<div class="text-heading-h4" style="margin-bottom:var(--space-1)">Crear cuenta</div>
<div class="text-body-sm" style="color:var(--color-text-muted);margin-bottom:var(--space-4)">Introduce tus datos para empezar.</div>
<label class="text-label-md">Email</label><input class="input" placeholder="tu@email.com" style="margin:var(--space-1-5) 0 var(--space-4)">
<label class="text-label-md">Contraseña</label><input class="input" type="password" placeholder="••••••••" style="margin:var(--space-1-5) 0 var(--space-5)">
<button class="btn btn-primary" style="width:100%">Continuar</button></div>
<div class="dialog"><div class="text-heading-h4">¿Eliminar proyecto?</div>
<p class="text-body-sm" style="color:var(--color-text-muted)">Esta acción no se puede deshacer.</p>
<div class="row" style="justify-content:flex-end"><button class="btn btn-ghost">Cancelar</button><button class="btn btn-danger">Eliminar</button></div></div></div>
</section>
</main></div>
<script>
const D = __DATA__;
const $ = id => document.getElementById(id);
for (const [name, steps] of Object.entries(D.scales)) {
  $('scales').insertAdjacentHTML('beforeend', `<div class="scale-name">${name}</div><div class="scale">${steps.map(([s,v]) =>
    `<div><div class="sw" style="background:${v}"></div><div class="swl">${s}<br>${v}</div></div>`).join('')}</div>`);
}
const ref = r => typeof r === 'string' && r.startsWith('{') ? r.slice(1,-1).replace('color.','') : r;
for (const k of Object.keys(D.light)) {
  $('sem').insertAdjacentHTML('beforeend', `<tr><td><code>${k}</code></td>
  <td><span class="chip" style="background:${D.light[k]}"></span> <code>${ref(D.lightRefs[k])}</code></td>
  <td><span class="chip" style="background:${D.dark[k]}"></span> <code>${ref(D.darkRefs[k])}</code></td></tr>`);
}
for (const p of D.typography) {
  const cls = 'text-' + p.replace('typography.','').replaceAll('.','-');
  $('typo').insertAdjacentHTML('beforeend', `<div class="typo-row"><code>${p.replace('typography.','')}</code><span class="${cls}">El veloz murciélago hindú</span></div>`);
}
for (const [p, v] of D.space) {
  $('space').insertAdjacentHTML('beforeend', `<div class="typo-row" style="align-items:center"><code>${p} · ${v}</code><div class="bar" style="width:${v}"></div></div>`);
}
for (const [p, v] of D.radius) {
  $('radius').insertAdjacentHTML('beforeend', `<div><div class="elev" style="border:1px solid var(--color-border-strong);border-radius:${v}">${v}</div><div class="swl">${p}</div></div>`);
}
for (const p of D.elevation) {
  $('elev').insertAdjacentHTML('beforeend', `<div><div class="elev" style="box-shadow:var(--${p.replaceAll('.','-')})">${p.replace('elevation.','')}</div></div>`);
}
const fb = {success:'Éxito', warning:'Aviso', danger:'Error', info:'Info'};
for (const [k, label] of Object.entries(fb)) {
  const v = () => `var(--color-text-feedback-${k})`;
  const bg = n => `var(--color-bg-feedback-${k}-${n})`;
  $('badges').insertAdjacentHTML('beforeend', `<span class="badge" style="background:${bg('default')};color:var(--color-text-on-feedback-${k})">${label}</span><span class="badge" style="background:${bg('subtle')};color:${v('text')};border:1px solid var(--color-border-feedback-${k}-subtle)">${label}</span>`);
  $('alerts').insertAdjacentHTML('beforeend', `<div class="alert" style="background:${bg('subtle')};color:${v('text')};border-color:var(--color-border-feedback-${k}-subtle)"><b>${label}.</b> Mensaje de ejemplo usando los tokens de feedback.</div>`);
}
</script></body></html>"""
