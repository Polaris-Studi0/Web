"use strict";

const initialOrders = [
  {id:"REY-1048",time:"4:12",period:"p. m.",ago:"hace 32 min",status:"preparing",products:[{qty:1,name:"Juego de ollas Royal 7 piezas"},{qty:1,name:"Set de cucharones x6"}],short:"OL",total:"$214.800",payment:"Transferencia",branch:"Robledo Aures",zone:"Robledo, Medellín",customer:"Laura M.",phone:"••• ••• 4821",note:"Entregar en portería. Confirmar por WhatsApp al llegar."},
  {id:"REY-1047",time:"3:56",period:"p. m.",ago:"hace 48 min",status:"ready",products:[{qty:1,name:"Licuadora Samurai 2 litros"},{qty:1,name:"Set de vasos x6"}],short:"LC",total:"$179.800",payment:"Transferencia",branch:"Robledo Diamante - Calle 80",zone:"Bello, Antioquia",customer:"Andrés R.",phone:"••• ••• 1074",note:"Pedido verificado y empacado.",courier:{name:"Carlos Ramírez",plate:"KDP 42F",eta:"Llega en 12 min"}},
  {id:"REY-1046",time:"3:31",period:"p. m.",ago:"hace 1 h 13 min",status:"preparing",products:[{qty:2,name:"Set de organizadores x4"},{qty:1,name:"Ganchos multiuso x12"},{qty:1,name:"Canasta rectangular mediana"}],short:"OR",total:"$112.700",payment:"Transferencia",branch:"Santa Cruz",zone:"Aranjuez, Medellín",customer:"Camila P.",phone:"••• ••• 6380",note:"Revisar que los dos sets sean del mismo color."},
  {id:"REY-1045",time:"2:48",period:"p. m.",ago:"hace 1 h 56 min",status:"ready",products:[{qty:1,name:"Freidora de aire 4,5 litros"},{qty:1,name:"Papel para freidora x100"}],short:"AF",total:"$298.900",payment:"Addi",branch:"La 80",zone:"Laureles, Medellín",customer:"Natalia G.",phone:"••• ••• 2146",note:"Crédito aprobado. Pedido listo en caja.",courier:null},
  {id:"REY-1044",time:"2:12",period:"p. m.",ago:"hace 2 h 32 min",status:"dispatched",products:[{qty:1,name:"Ventilador de pedestal 16 pulgadas"},{qty:1,name:"Extensión eléctrica 3 metros"}],short:"VN",total:"$159.800",payment:"Sistecrédito",branch:"Campo Valdez",zone:"Manrique, Medellín",customer:"Julián S.",phone:"••• ••• 9012",note:"Pedido entregado al domiciliario.",courier:{name:"Mateo Gómez",plate:"FZX 19H"},completedAt:"3:10 p. m."},
  {id:"REY-1043",time:"1:47",period:"p. m.",ago:"hace 2 h 57 min",status:"ready",products:[{qty:1,name:"Vajilla Corona 4 puestos"},{qty:1,name:"Cubiertos 24 piezas"},{qty:1,name:"Jarra de vidrio 1,5 litros"}],short:"VJ",total:"$218.700",payment:"Transferencia",branch:"Floresta",zone:"La América, Medellín",customer:"María E.",phone:"••• ••• 5598",note:"Proteger la vajilla con material adicional.",courier:{name:"Juan Esteban López",plate:"DWL 73G",eta:"Llega en 6 min"}},
  {id:"REY-1042",time:"12:58",period:"p. m.",ago:"hace 3 h 46 min",status:"preparing",products:[{qty:1,name:"Combo de aseo para el hogar"},{qty:1,name:"Balde plástico 12 litros"},{qty:2,name:"Paño de microfibra"}],short:"AS",total:"$86.500",payment:"Efectivo",branch:"San Antonio de Prado",zone:"San Antonio de Prado",customer:"Felipe C.",phone:"••• ••• 3207",note:"Pago realizado y confirmado en la sede."}
];

const storageKey = "el-rey-dashboard-demo-v2";
let orders = JSON.parse(localStorage.getItem(storageKey) || "null") || cloneInitialOrders();
let activeStatus = "all";
let activeView = "active";
let selectedOrder = null;
let lastChange = null;

const list = document.querySelector("#ordersList");
const search = document.querySelector("#orderSearch");
const branch = document.querySelector("#branchSelect");
const toast = document.querySelector("#toast");
const statusText = {preparing:"En preparación",ready:"Pendiente por despacho",dispatched:"Despachado"};

function cloneInitialOrders(){ return initialOrders.map(order => ({...order,products:order.products.map(product => ({...product})),courier:order.courier ? {...order.courier} : null})); }
function saveOrders(){ localStorage.setItem(storageKey, JSON.stringify(orders)); }
function productSearchText(order){ return order.products.map(product => product.name).join(" "); }
function itemCount(order){ return order.products.reduce((total, product) => total + product.qty, 0); }

function filteredOrders(){
  const term = search.value.trim().toLowerCase();
  return orders.filter(order => {
    const matchesBranch = branch.value === "all" || order.branch === branch.value;
    const matchesStatus = activeStatus === "all" || order.status === activeStatus;
    const matchesView = activeView === "ready" ? order.status === "ready" : activeView === "dispatched" ? order.status === "dispatched" : order.status !== "dispatched";
    const haystack = `${order.id} ${productSearchText(order)} ${order.branch} ${order.customer}`.toLowerCase();
    return matchesBranch && matchesStatus && matchesView && (!term || haystack.includes(term));
  });
}

function courierCard(order){
  if(order.status === "dispatched" && order.courier) return `<div class="courier-data complete"><span>DOMICILIARIO</span><strong>${order.courier.name}</strong><b>Placa ${order.courier.plate}</b></div>`;
  if(order.status !== "ready") return `<div class="courier-data muted"><span>SIGUIENTE PASO</span><strong>Terminar preparación</strong><b>Se notificará al coordinador</b></div>`;
  if(!order.courier) return `<div class="courier-data waiting"><span>DOMICILIARIO</span><strong>Por asignar</strong><b>Te avisaremos en este panel</b></div>`;
  return `<div class="courier-data assigned"><span>DOMICILIARIO ASIGNADO</span><strong>${order.courier.name}</strong><b>Placa ${order.courier.plate} · ${order.courier.eta}</b></div>`;
}

function orderAction(order){
  if(order.status === "dispatched") return `<div class="done-mark"><span>✓</span><b>Despachado</b><small>${order.completedAt}</small></div>`;
  if(order.status === "preparing") return `<button class="dispatch-button" data-advance="${order.id}">Listo para despacho <span>→</span></button>`;
  if(!order.courier) return `<button class="dispatch-button waiting-button" disabled>Esperando domiciliario <span>···</span></button>`;
  return `<button class="dispatch-button" data-advance="${order.id}">Entregado al domiciliario <span>→</span></button>`;
}

function orderTemplate(order){
  const products = order.products.map(product => `<li><b>${product.qty}×</b>${product.name}</li>`).join("");
  return `<article class="order-card ${order.status === "ready" ? "priority" : ""}" data-order-id="${order.id}">
    <button class="product-thumb" data-detail="${order.id}" aria-label="Ver detalle del pedido ${order.id}"><span>${order.short}</span><i>${itemCount(order)} PRODUCTOS</i></button>
    <div class="order-time"><span>HOY</span><strong>${order.time}</strong><small>${order.period} · ${order.ago}</small></div>
    <div class="order-product"><span class="status ${order.status}"><i></i>${statusText[order.status]}</span><p>#${order.id} · DOMICILIO</p><ul class="card-products">${products}</ul><div class="order-meta"><span>${order.total}</span><span>${order.payment}</span></div></div>
    <div class="order-destination"><span>ENTREGA</span><strong>${order.zone}</strong>${courierCard(order)}<button data-detail="${order.id}">Ver detalle</button></div>
    ${orderAction(order)}
  </article>`;
}

function updateCounts(){
  const preparing = orders.filter(order => order.status === "preparing").length;
  const ready = orders.filter(order => order.status === "ready").length;
  const dispatched = 17 + orders.filter(order => order.status === "dispatched").length;
  document.querySelector("#preparingCount").textContent = preparing;
  document.querySelector("#readyCount").textContent = ready;
  document.querySelector("#dispatchedCount").textContent = dispatched;
  document.querySelector("#navActiveCount").textContent = preparing + ready;
  document.querySelector("#navReadyCount").textContent = ready;
}

function render(){
  const visible = filteredOrders();
  list.innerHTML = visible.map(orderTemplate).join("");
  document.querySelector("#visibleCount").textContent = visible.length;
  document.querySelector("#emptyState").hidden = visible.length !== 0;
  const titles = {active:["COLA EN TIEMPO REAL","Pedidos activos"],ready:["LISTOS EN SEDE","Pendientes por despacho"],dispatched:["TRAZABILIDAD DEL DÍA","Historial de movimientos"]};
  document.querySelector("#queueLabel").textContent = titles[activeView][0];
  document.querySelector("#ordersTitle").childNodes[0].nodeValue = `${titles[activeView][1]} `;
  updateCounts();
}

function setView(view){
  activeView = view;
  activeStatus = view === "ready" ? "ready" : view === "dispatched" ? "dispatched" : "all";
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll("[data-status-filter]").forEach(button => button.classList.toggle("active", button.dataset.statusFilter === activeStatus));
  render();
}

function detailProducts(order){ return order.products.map(product => `<div><b>${product.qty}×</b><span>${product.name}</span></div>`).join(""); }

function timelineTemplate(order){
  const ready = order.status === "ready" || order.status === "dispatched";
  const done = order.status === "dispatched";
  return `<div class="timeline"><h3>Trazabilidad</h3>
    <div class="complete"><i></i><p><b>Pedido confirmado</b><small>${order.time} ${order.period}</small></p></div>
    <div class="complete"><i></i><p><b>En preparación en la sede</b><small>${ready ? "Productos alistados" : "En proceso"}</small></p></div>
    <div class="${ready ? "complete" : ""}"><i></i><p><b>Pendiente por despacho</b><small>${ready ? (order.courier ? "Domiciliario asignado" : "Esperando asignación") : "Pendiente"}</small></p></div>
    <div class="${done ? "complete" : ""}"><i></i><p><b>Entregado al domiciliario</b><small>${done ? order.completedAt : "Pendiente"}</small></p></div>
  </div>`;
}

function openDetails(id){
  const order = orders.find(item => item.id === id);
  selectedOrder = order;
  document.querySelector("#detailTitle").textContent = `#${order.id}`;
  document.querySelector("#detailContent").innerHTML = `<div class="detail-product detail-product-multi"><span>${order.short}</span><div><small>${itemCount(order)} PRODUCTOS</small><h3>Contenido del pedido</h3><div class="detail-product-list">${detailProducts(order)}</div><p>Total · ${order.total}</p></div></div>
    <dl><div><dt>Estado</dt><dd><span class="status ${order.status}"><i></i>${statusText[order.status]}</span></dd></div><div><dt>Sede</dt><dd>${order.branch}</dd></div><div><dt>Medio de pago</dt><dd>${order.payment}</dd></div><div><dt>Cliente</dt><dd>${order.customer}<small>${order.phone}</small></dd></div><div><dt>Destino</dt><dd>${order.zone}</dd></div>${order.courier ? `<div><dt>Domiciliario</dt><dd>${order.courier.name}<small>Placa ${order.courier.plate}${order.courier.eta ? ` · ${order.courier.eta}` : ""}</small></dd></div>` : ""}</dl>
    <div class="order-note"><small>INDICACIONES</small><p>${order.note}</p></div>${timelineTemplate(order)}${order.status !== "dispatched" && (order.status === "preparing" || order.courier) ? `<button class="drawer-action" data-advance="${order.id}">${order.status === "preparing" ? "Listo para despacho" : "Entregado al domiciliario"}<span>→</span></button>` : ""}`;
  document.querySelector("#detailDrawer").classList.add("open");
  document.querySelector("#detailDrawer").setAttribute("aria-hidden","false");
  document.body.classList.add("overlay-open");
  document.querySelector(".drawer-close").focus();
}

function closeDrawer(){ document.querySelector("#detailDrawer").classList.remove("open");document.querySelector("#detailDrawer").setAttribute("aria-hidden","true");document.body.classList.remove("overlay-open"); }

function openAdvance(id){
  selectedOrder = orders.find(item => item.id === id);
  const preparing = selectedOrder.status === "preparing";
  document.querySelector("#dispatchTitle").textContent = preparing ? "Pedido listo para despacho" : "Entregar al domiciliario";
  document.querySelector("#dispatchCopy").textContent = preparing ? "Confirma que todos los productos están separados y empacados. El pedido pasará a la cola de despacho y se notificará al coordinador." : "Confirma que entregaste el pedido completo al domiciliario que aparece asignado.";
  document.querySelector("#courierConfirm").hidden = preparing;
  if(!preparing && selectedOrder.courier){document.querySelector("#confirmCourierName").textContent=selectedOrder.courier.name;document.querySelector("#confirmCourierPlate").textContent=`Placa ${selectedOrder.courier.plate}`;}
  document.querySelector("#confirmDispatch").innerHTML = `${preparing ? "Confirmar pedido listo" : "Confirmar entrega"} <span>→</span>`;
  closeDrawer();
  document.querySelector("#dispatchModal").classList.add("open");
  document.querySelector("#dispatchModal").setAttribute("aria-hidden","false");
  document.body.classList.add("overlay-open");
  document.querySelector("#confirmDispatch").focus();
}

function closeModal(){ document.querySelector("#dispatchModal").classList.remove("open");document.querySelector("#dispatchModal").setAttribute("aria-hidden","true");document.body.classList.remove("overlay-open"); }
function showToast(message){toast.querySelector("span").textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),5000);}

document.addEventListener("click", event => {
  const detail = event.target.closest("[data-detail]");
  const advance = event.target.closest("[data-advance]");
  const view = event.target.closest("[data-view]");
  if(detail) openDetails(detail.dataset.detail);
  if(advance) openAdvance(advance.dataset.advance);
  if(view) setView(view.dataset.view);
  if(event.target.closest("[data-close-drawer]")) closeDrawer();
  if(event.target.closest("[data-close-modal]")) closeModal();
});

document.querySelectorAll("[data-status-filter]").forEach(button => button.addEventListener("click", () => {
  activeStatus = button.dataset.statusFilter;
  if(activeStatus === "ready") activeView = "ready";
  if(activeStatus === "preparing") activeView = "active";
  if(activeStatus === "dispatched") activeView = "dispatched";
  document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === activeView));
  document.querySelectorAll("[data-status-filter]").forEach(item => item.classList.toggle("active", item === button));
  render();
}));

search.addEventListener("input", render);
branch.addEventListener("change", render);
document.querySelector("#confirmDispatch").addEventListener("click", () => {
  const index = orders.findIndex(order => order.id === selectedOrder.id);
  lastChange = structuredClone(orders[index]);
  if(orders[index].status === "preparing"){
    orders[index] = {...orders[index],status:"ready",courier:null};
    showToast(`#${selectedOrder.id} quedó pendiente por despacho.`);
  }else{
    orders[index] = {...orders[index],status:"dispatched",completedAt:"4:44 p. m."};
    showToast(`#${selectedOrder.id} fue entregado al domiciliario.`);
  }
  saveOrders();closeModal();render();
});

document.querySelector("#undoAction").addEventListener("click", () => {if(!lastChange)return;const index=orders.findIndex(order=>order.id===lastChange.id);orders[index]=lastChange;lastChange=null;saveOrders();render();toast.classList.remove("show");});
document.querySelector("#clearFilters").addEventListener("click", () => {search.value="";branch.value="all";setView("active");});
document.querySelector("#resetDemo").addEventListener("click", () => {orders=cloneInitialOrders();saveOrders();search.value="";branch.value="all";setView("active");showToast("La demostración volvió a su estado inicial.");});
document.querySelector("#syncButton").addEventListener("click", () => showToast("Pedidos actualizados hace un momento."));
document.addEventListener("keydown", event => {if(event.key==="Escape"){closeDrawer();closeModal();}});

render();
