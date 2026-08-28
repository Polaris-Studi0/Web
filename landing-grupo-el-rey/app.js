"use strict";

const CONFIG = {
  // Reemplaza estos dos valores antes de publicar.
  whatsappNumber: "57XXXXXXXXXX",
  instagramUrl: "https://instagram.com/TU_INSTAGRAM",
  osrmBaseUrl: "https://router.project-osrm.org",
  routeTimeoutMs: 12000
};

const ACCESS_CONFIG = {
  sessionKey: "polaris_el_rey_demo_access",
  salt: "polaris-demo-v1",
  credentialHash: "2c3738d9c700f19c8cca9243d6c5f3b1ef8cc1a3132256f6356b10e8e0943566"
};

// Coordenadas iniciales aproximadas para el cálculo. Conviene validarlas en sitio antes de publicar.
const LOCATIONS = [
  {id:"robledo-aures", name:"Robledo Aures", address:"Calle 77BB #83-10", city:"Medellín", lat:6.28290, lng:-75.59096},
  {id:"robledo-diamante-calle-80", name:"Robledo Diamante · Calle 80", address:"Calle 80 #94-56", city:"Medellín", lat:6.29330, lng:-75.60360},
  {id:"santa-cruz", name:"Santa Cruz", address:"Carrera 86 #80A-04", city:"Medellín", lat:6.30020, lng:-75.55040},
  {id:"san-gabriel-itagui", name:"San Gabriel Itagüí", address:"Calle 36 #69-54, Villas de San Antonio", city:"Itagüí", lat:6.18140, lng:-75.62150},
  {id:"robledo-diamante-diagonal-85", name:"Robledo Diamante · Diagonal 85", address:"Diagonal 85 #79-59", city:"Medellín", lat:6.28416, lng:-75.58533},
  {id:"floresta", name:"Floresta", address:"Carrera 48 #80-66", city:"Medellín", lat:6.29462, lng:-75.55347},
  {id:"la-80", name:"La 80", address:"Carrera 80 #50-69", city:"Medellín", lat:6.26110, lng:-75.59980},
  {id:"la-estrella", name:"La Estrella", address:"Carrera 61 #77 Sur-97", city:"La Estrella", lat:6.13290, lng:-75.64460},
  {id:"campo-valdez", name:"Campo Valdez", address:"Carrera 49 #98A-28, Moscú I", city:"Medellín", lat:6.30230, lng:-75.55520},
  {id:"san-antonio-prado", name:"San Antonio de Prado", address:"Calle 42 Sur #77-7, San Antonio de Prado", city:"Medellín", lat:6.18363, lng:-75.65296}
];

const $ = selector => document.querySelector(selector);
const modal = $("#locationsModal");
const routePanel = $("#routePanel");
let lastFocusedElement = null;

function mapsUrl(location) {
  const destination = `${location.address}, ${location.city}, Antioquia, Colombia`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function messageFor(location, method = "MANUAL") {
  const greeting = location
    ? `Hola, quiero comunicarme con la sede ${location.name}.`
    : "Hola, necesito información general de Almacenes El Rey.";
  const locationTag = location ? location.id : "general";
  return `${greeting}\n\n[ORIGEN:WEB] [SEDE:${locationTag}] [METODO_SELECCION:${method}]`;
}

function openWhatsApp(location = null, method = "MANUAL") {
  const number = CONFIG.whatsappNumber.replace(/\D/g, "");
  if (!number || CONFIG.whatsappNumber.includes("X")) {
    showToast("Falta configurar el número único de WhatsApp en app.js");
    return;
  }
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(messageFor(location, method))}`, "_blank", "noopener,noreferrer");
}

function renderLocations() {
  const options = LOCATIONS.map(location => `<option value="${location.id}">${escapeHtml(location.name)} — ${escapeHtml(location.address)}</option>`).join("");
  $("#locationSelect").insertAdjacentHTML("beforeend", options);
  $("#modalLocationSelect").insertAdjacentHTML("beforeend", options);
  $("#locationsGrid").innerHTML = LOCATIONS.map(location => `
    <article class="location-card">
      <span class="pin" aria-hidden="true">⌖</span>
      <div><h3>${escapeHtml(location.name)}</h3><p>${escapeHtml(location.address)}, ${escapeHtml(location.city)}</p></div>
      <div class="card-actions">
        <button class="wa" data-location="${location.id}">WhatsApp</button>
        <a href="${mapsUrl(location)}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
      </div>
    </article>`).join("");
}

function initializeScrollEffects() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = [
    [".quick-choice > div", "reveal reveal-left"],
    [".location-form", "reveal reveal-right"],
    [".section-heading", "reveal"],
    [".social-band > div", "reveal reveal-left"],
    [".social-band .button", "reveal reveal-right"],
    ["footer > *", "reveal"]
  ];

  revealTargets.forEach(([selector, classes]) => {
    document.querySelectorAll(selector).forEach(element => element.classList.add(...classes.split(" ")));
  });

  document.querySelectorAll(".location-card").forEach((card, index) => {
    card.classList.add("reveal");
    card.style.setProperty("--reveal-delay", `${(index % 2) * 90}ms`);
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {threshold:0.12, rootMargin:"0px 0px -7% 0px"});
    document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
  }

  const header = document.querySelector(".site-header");
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, {passive:true});
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hashAccessCredentials(username, password) {
  const value = `${ACCESS_CONFIG.salt}|${username}|${password}`;
  const data = new TextEncoder().encode(value);
  return bytesToHex(await crypto.subtle.digest("SHA-256", data));
}

function unlockDemo() {
  document.body.querySelectorAll(":scope > [data-access-protected]").forEach(element => {
    element.removeAttribute("inert");
    element.removeAttribute("data-access-protected");
  });
  document.body.classList.remove("demo-locked");
  document.documentElement.classList.remove("demo-locked-root");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#fbbb2e");
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", "light");
  window.setTimeout(() => {
    const gate = document.querySelector("#accessGate");
    if (gate) gate.hidden = true;
  }, 380);
}

function initializeAccessGate() {
  const gate = document.querySelector("#accessGate");
  const form = document.querySelector("#accessForm");
  const userInput = document.querySelector("#accessUser");
  const passwordInput = document.querySelector("#accessPassword");
  const toggleButton = document.querySelector("#togglePassword");
  const error = document.querySelector("#accessError");

  if (!gate || !form) return;
  if (sessionStorage.getItem(ACCESS_CONFIG.sessionKey) === ACCESS_CONFIG.credentialHash) {
    gate.hidden = true;
    document.body.classList.remove("demo-locked");
    document.documentElement.classList.remove("demo-locked-root");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#fbbb2e");
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", "light");
    return;
  }

  [...document.body.children].forEach(element => {
    if (element === gate || element.tagName === "SCRIPT") return;
    element.setAttribute("inert", "");
    element.setAttribute("data-access-protected", "");
  });

  toggleButton.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    toggleButton.textContent = showing ? "VER" : "OCULTAR";
    toggleButton.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    passwordInput.focus();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    error.textContent = "";
    const submit = form.querySelector(".access-submit");
    submit.disabled = true;
    submit.querySelector("span").textContent = "Verificando…";

    try {
      const hash = await hashAccessCredentials(userInput.value.trim(), passwordInput.value);
      if (hash !== ACCESS_CONFIG.credentialHash) {
        throw new Error("Credenciales incorrectas");
      }
      sessionStorage.setItem(ACCESS_CONFIG.sessionKey, ACCESS_CONFIG.credentialHash);
      passwordInput.value = "";
      unlockDemo();
    } catch (accessError) {
      error.textContent = "Usuario o contraseña incorrectos. Intenta nuevamente.";
      passwordInput.value = "";
      passwordInput.focus();
      form.classList.remove("is-invalid");
      void form.offsetWidth;
      form.classList.add("is-invalid");
      window.setTimeout(() => form.classList.remove("is-invalid"), 400);
    } finally {
      submit.disabled = false;
      submit.querySelector("span").textContent = "Entrar al demo";
    }
  });

  window.setTimeout(() => userInput.focus(), 50);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#modalLocationSelect").focus(), 0);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocusedElement) lastFocusedElement.focus();
}

function findLocation(id) { return LOCATIONS.find(location => location.id === id); }

function locateUser() {
  closeModal();
  if (!navigator.geolocation) return showRouteError("Tu navegador no permite obtener la ubicación.");
  routePanel.hidden = false;
  routePanel.innerHTML = `<div class="route-box route-status"><span class="spinner"></span><div><strong>Buscando tu mejor ruta…</strong><br><small>Estamos comparando las 10 sedes por tiempo de viaje.</small></div></div>`;
  routePanel.scrollIntoView({behavior:"smooth", block:"center"});
  navigator.geolocation.getCurrentPosition(
    position => calculateRoutes(position.coords.latitude, position.coords.longitude),
    error => showRouteError(geolocationError(error)),
    {enableHighAccuracy:false, timeout:10000, maximumAge:300000}
  );
}

function geolocationError(error) {
  if (error.code === 1) return "No recibimos permiso para usar tu ubicación. Puedes elegir una sede manualmente.";
  if (error.code === 3) return "La ubicación tardó demasiado. Intenta de nuevo o elige una sede.";
  return "No pudimos obtener tu ubicación. Puedes elegir una sede manualmente.";
}

async function calculateRoutes(lat, lng) {
  try {
    const coordinates = [`${lng},${lat}`, ...LOCATIONS.map(item => `${item.lng},${item.lat}`)].join(";");
    const destinations = LOCATIONS.map((_, index) => index + 1).join(";");
    const url = `${CONFIG.osrmBaseUrl}/table/v1/driving/${coordinates}?sources=0&destinations=${destinations}&annotations=duration,distance`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.routeTimeoutMs);
    const response = await fetch(url, {signal:controller.signal});
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.code !== "Ok" || !data.durations?.[0]) throw new Error("Respuesta de rutas inválida");
    const results = LOCATIONS.map((location, index) => ({...location, duration:data.durations[0][index], distance:data.distances?.[0]?.[index]}))
      .filter(item => Number.isFinite(item.duration)).sort((a,b) => a.duration - b.duration);
    if (!results.length) throw new Error("No hay rutas disponibles");
    renderRouteResults(results.slice(0, 3), false);
  } catch (error) {
    console.warn("OSRM no disponible; usando distancia aproximada.", error);
    const results = LOCATIONS.map(location => ({...location, distance:haversine(lat,lng,location.lat,location.lng), duration:null}))
      .sort((a,b) => a.distance - b.distance);
    renderRouteResults(results.slice(0, 3), true);
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const rad = value => value * Math.PI / 180, earth = 6371000;
  const dLat=rad(lat2-lat1), dLng=rad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLng/2)**2;
  return 2*earth*Math.asin(Math.sqrt(a));
}

function renderRouteResults(results, approximate) {
  const best = results[0];
  routePanel.innerHTML = `<div class="route-box">
    <p class="eyebrow red">${approximate ? "SEDE MÁS CERCANA · APROXIMADO" : "MEJOR RUTA EN CARRO"}</p>
    <div class="route-result-head"><div><h2>${escapeHtml(best.name)}</h2><p>${escapeHtml(best.address)}, ${escapeHtml(best.city)}</p></div>
      <div class="route-metrics">${Number.isFinite(best.duration)?`<div class="metric"><strong>${formatDuration(best.duration)}</strong><small>tiempo estimado</small></div>`:""}<div class="metric"><strong>${formatDistance(best.distance)}</strong><small>${approximate?"en línea recta":"por carretera"}</small></div></div></div>
    ${approximate?`<p><small>El servicio de rutas no respondió; ordenamos por cercanía aproximada. Confirma el trayecto en el mapa.</small></p>`:""}
    <div class="route-actions"><button class="button button-primary" data-location="${best.id}" data-method="CERCANIA_RUTA">Hablar con esta sede</button><a class="button button-outline" href="${mapsUrl(best)}" target="_blank" rel="noopener noreferrer">Cómo llegar</a></div>
    <div class="alternatives"><strong>Otras opciones cercanas</strong>${results.slice(1).map(item=>`<div class="alternative"><span>${escapeHtml(item.name)}<br><small>${escapeHtml(item.address)}</small></span><span><strong>${Number.isFinite(item.duration)?formatDuration(item.duration):formatDistance(item.distance)}</strong><br><button class="text-link" data-location="${item.id}" data-method="CERCANIA_RUTA">Contactar</button></span></div>`).join("")}</div>
  </div>`;
}

function showRouteError(message) {
  routePanel.hidden = false;
  routePanel.innerHTML = `<div class="route-box"><p class="eyebrow red">NO PUDIMOS UBICARTE</p><h2>Elige una sede manualmente</h2><p>${escapeHtml(message)}</p><button class="button button-dark" data-action="open-locations">Ver opciones</button></div>`;
  routePanel.scrollIntoView({behavior:"smooth", block:"center"});
}

function formatDuration(seconds) { const minutes=Math.max(1,Math.round(seconds/60)); return minutes<60?`${minutes} min`:`${Math.floor(minutes/60)} h ${minutes%60} min`; }
function formatDistance(metres) { return metres<1000?`${Math.round(metres)} m`:`${(metres/1000).toFixed(1)} km`; }
let toastTimer;
function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),3500); }

document.addEventListener("click", event => {
  const actionElement = event.target.closest("[data-action]");
  const locationElement = event.target.closest("[data-location]");
  if (locationElement) openWhatsApp(findLocation(locationElement.dataset.location), locationElement.dataset.method || "MANUAL");
  if (!actionElement) return;
  const actions = {"open-locations":openModal,"close-modal":closeModal,"locate":locateUser,"general":()=>openWhatsApp(null,"GENERAL"),"modal-location":()=>{const location=findLocation($("#modalLocationSelect").value); if(location){closeModal();openWhatsApp(location,"MANUAL");}else showToast("Selecciona una sede.");}};
  actions[actionElement.dataset.action]?.();
});

$("#locationForm").addEventListener("submit", event => { event.preventDefault(); const location=findLocation($("#locationSelect").value); if(location) openWhatsApp(location,"MANUAL"); else showToast("Selecciona una sede."); });
document.addEventListener("keydown", event => { if(event.key === "Escape" && modal.classList.contains("open")) closeModal(); });
$("#instagramLink").addEventListener("click", event => { if(CONFIG.instagramUrl.includes("TU_INSTAGRAM")){event.preventDefault();showToast("Falta configurar el usuario de Instagram en app.js");} });
$("#instagramLink").href = CONFIG.instagramUrl;
renderLocations();
initializeScrollEffects();
initializeAccessGate();
