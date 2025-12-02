//=============================
//proyecto final de teoria de la computacion
//Cynthia aguilar
//Brayan maldonado
//============================
let pantalla = "AFD";
let estados = [];
let trans = [];
let estadoInicial = null;
let alfabetoUsuario = [];
let alfabetoPila = [];
let pila = [];
let cabezalMT = 0;
let cintaMT = [];
let estadoMT = "q0";

// control interfaz
let arrastrando = null;
let modoEdicion = "agregar";
let selOrigen = null;
let alertMostrado = false;

// testing
let palabraTest = "";
let caminoEstados = [];
let caminoTranses = [];
let pasoActual = 0;
let enAnimacion = false;
let testAceptado = false;

// gramáticas
let gramatica = {};
let derivacion = [];

//para MT
let reglasMT    = {};   // tabla: [estado][letra] = {nEst, esc, mov}
let historialMT = [];  
let pasosMT        = [];   // [{cinta, cabezal, estado}, ...]
let pasoIndex      = 0;
let animando       = false;
let ultimoCambio   = 0;
let velocidadMS    = 400;  // ms entre pasos
let animandoMT  = false;
let ultCambioMT = 0;
let velMT       = 300;  // ms entre pasos

// ==========================================================
//   botones HTML
// ==========================================================
function cambiarModo(m) {
  pantalla = m;
  reiniciarTodo();
}

function efectoGlow() {
  if (pasoActual < caminoEstados.length) {
    pasoActual++;
    setTimeout(() => efectoGlow(), 600);
  } else {
    enAnimacion = false;
    // Solo mostrar alert si no se ha mostrado antes
    if (!alertMostrado) {
      alertMostrado = true;
      alert(testAceptado ? "✅ Aceptada" : "❌ Rechazada");
    }
  }
}

function reiniciarTodo() {
  estados = [];
  trans = [];
  estadoInicial = null;
  alfabetoUsuario = [];
  alfabetoPila = [];
  pila = [];
  cintaMT = [];
  cabezalMT = 0;
  estadoMT = "q0";
  gramatica = {};
  derivacion = [];
  caminoEstados = [];
  caminoTranses = [];
  pasoActual = 0;
  enAnimacion = false;
  testAceptado = false;
  alertMostrado = false; 
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight - 60);
  canvas.parent("lienzo");
  textFont("monospace");
  textAlign(LEFT, TOP);
  textSize(14);
}

function draw() {
  background(12, 12, 30);
  dibujarLateral();
  switch (pantalla) {
    case "AFD":
      dibujarAFD();
      break;
    case "GR":
      dibujarGR();
      break;
    case "GLC":
      dibujarGLC();
      break;
    case "AP":
      dibujarAP();
      break;
    case "MT":
       if (animandoMT && pasosMT.length > 0) {
      if (millis() - ultCambioMT > velMT) {
        pasoIndex++;
        ultCambioMT = millis();
        if (pasoIndex >= pasosMT.length) {
          animandoMT = false;
          let acepta = pasosMT[pasosMT.length-1].estado === "qA";
          alert(acepta ? "✅ Palíndromo aceptado" : "❌ Rechazado");
        }
      }
    }
    // volcar config actual
    if (pasosMT.length > 0) {
      let cfg = pasosMT[constrain(pasoIndex, 0, pasosMT.length-1)];
      cintaMT   = cfg.cinta;
      cabezalMT = cfg.cabezal;
      estadoMT  = cfg.estado;
    }
    dibujarMT();
  }
  if (enAnimacion) efectoGlow();
}

// ==========================================================
//  AFD – DIBUJO + CONTROL
// ==========================================================
function dibujarAFD() {
  // flechas
  for (let t of trans) {
    let activa = caminoTranses.includes(t) && pasoActual > caminoTranses.indexOf(t);
    t.dibujar(activa);
  }
  // estados
  for (let e of estados) {
    let activo = caminoEstados.includes(e) && pasoActual >= caminoEstados.indexOf(e);
    e.dibujar(activo);
  }
  // info
  fill(0, 255, 255);
  textSize(14);
  text("Modo AFD – Click botones o atajos:", 20, 30);
  text("A: agregar  B:borrar  M:mover  T:transición  F:finalizar  P:probar", 20, 50);
}

class Estado {
  constructor(x, y, nombre) {
    this.x = x;
    this.y = y;
    this.nombre = nombre;
    this.final = false;
    this.radio = 30;
  }
  dibujar(activo) {
    push();
    strokeWeight(activo ? 5 : 2);
    stroke(activo ? color(0, 255, 0) : color(0, 200, 200));
    fill(activo ? color(0, 255, 0, 80) : color(12, 12, 30));
    ellipse(this.x, this.y, this.radio * 2);
    if (this.final) {
      noFill();
      ellipse(this.x, this.y, this.radio * 2 - 12);
    }
    if (this === estadoInicial) {
      line(this.x - 40, this.y, this.x - this.radio, this.y);
      triangle(this.x - this.radio, this.y, this.x - this.radio - 8, this.y - 5, this.x - this.radio - 8, this.y + 5);
    }
    fill(0, 255, 255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text(this.nombre, this.x, this.y);
    pop();
  }
  adentro(mx, my) {
    return dist(mx, my, this.x, this.y) < this.radio;
  }
}


class Transicion {
  constructor(desde, hasta, simb) {
    this.desde = desde;
    this.hasta = hasta;
    this.simb = simb;
  }
  
  dibujar(activa) {
    push();
    stroke(activa ? color(0, 255, 0) : color(0, 200, 200));
    strokeWeight(activa ? 4 : 2);

    if (this.desde === this.hasta) {
      // CORRECCIÓN: Calcular offset correctamente
      let selfs = trans.filter(t => t.desde === this.desde && t.hasta === this.hasta);
      let idx = selfs.indexOf(this);
      let total = selfs.length;
      
      // Si solo hay uno, offset = 0; si hay varios, distribuir
      let off = total === 1 ? 0 : map(idx, 0, total - 1, -25, 25);
      
      let cx = this.desde.x + off;
      let cy = this.desde.y - 50;
      noFill();
      arc(cx, cy, 60, 60, -PI * 0.75, PI * 0.75);
      
      // Flecha
      let ang = PI * 0.75;
      let tx = cx + 30 * cos(ang);
      let ty = cy + 30 * sin(ang);
      triangle(
        tx, ty, 
        tx - 8 * cos(ang - PI / 6), ty - 8 * sin(ang - PI / 6), 
        tx - 8 * cos(ang + PI / 6), ty - 8 * sin(ang + PI / 6)
      );
      
      // Etiqueta
      fill(activa ? color(0, 255, 0) : color(0, 200, 200));
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text(this.simb, cx, cy - 25);
      pop();
      return;
    }

    // Transiciones normales (sin cambios)
    let dx = this.hasta.x - this.desde.x;
    let dy = this.hasta.y - this.desde.y;
    let ang = atan2(dy, dx);
    let x1 = this.desde.x + cos(ang) * this.desde.radio;
    let y1 = this.desde.y + sin(ang) * this.desde.radio;
    let x2 = this.hasta.x - cos(ang) * this.hasta.radio;
    let y2 = this.hasta.y - sin(ang) * this.hasta.radio;
    line(x1, y1, x2, y2);
    triangle(
      x2, y2, 
      x2 - 10 * cos(ang - PI / 6), y2 - 10 * sin(ang - PI / 6), 
      x2 - 10 * cos(ang + PI / 6), y2 - 10 * sin(ang + PI / 6)
    );
    fill(activa ? color(0, 255, 0) : color(0, 200, 200));
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.simb, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
    pop();
  }
}

// ==========================================================
//  MOUSE + TECLAS
// ==========================================================
function mousePressed() {
  if (mouseX > width - 300) return; // lateral
  if (pantalla === "AFD" || pantalla === "AP") {
    let clicado = estados.find(e => e.adentro(mouseX, mouseY));
    if (modoEdicion === "agregar") {
      if (!clicado) {
        let e = new Estado(mouseX, mouseY, "q" + estados.length);
        estados.push(e); if (!estadoInicial) estadoInicial = e;
      } else arrastrando = clicado;
    } else if (modoEdicion === "borrar") {
      if (clicado) {
        trans = trans.filter(t => t.desde !== clicado && t.hasta !== clicado);
        if (clicado === estadoInicial) estadoInicial = null;
        estados = estados.filter(e => e !== clicado);
      }
    } else if (modoEdicion === "trans") {
      if (!selOrigen) selOrigen = clicado;
      else {
        if (pantalla === "AP") ingresarTransAP();   // ← nueva línea
        else {
          let sim = prompt("Símbolo (ε = e):");
          if (sim || sim === "") trans.push(new Transicion(selOrigen, clicado, sim));
        }
        selOrigen = null;
      }
    } else if (modoEdicion === "mover") {
      arrastrando = clicado;
    }
  }
}

function mouseDragged() {
  if (arrastrando) {
    arrastrando.x = mouseX;
    arrastrando.y = mouseY;
  }
}

function mouseReleased() {
  arrastrando = null;
}

function doubleClicked() {
  if (pantalla !== "AFD" && pantalla !== "AP") return;
  let clicado = estados.find(e => e.adentro(mouseX, mouseY));
  if (clicado) clicado.final = !clicado.final;
}

//=====================================================
// aqui es la fkin funcion que se me pierde a cada rato
//=====================================================
function keyPressed() {
  // ---------- AFD ----------
  if (pantalla === "AFD") {
    if (key === 'a' || key === 'A') modoEdicion = "agregar";
    if (key === 'b' || key === 'B') modoEdicion = "borrar";
    if (key === 'm' || key === 'M') modoEdicion = "mover";
    if (key === 't' || key === 'T') modoEdicion = "trans";
    if (key === 'f' || key === 'F') finalizarAFD();
    if (key === 'p' || key === 'P') probarPalabraAFD();
  }
  // ---------- AP ----------
  if (pantalla === "AP") {
    if (key === 'a' || key === 'A') modoEdicion = "agregar";
    if (key === 'b' || key === 'B') modoEdicion = "borrar";
    if (key === 'm' || key === 'M') modoEdicion = "mover";
    if (key === 't' || key === 'T') modoEdicion = "trans"; 
    if (key === 'f' || key === 'F') finalizarAP();
    if (key === 'p' || key === 'P') probarPalabraAP();
  }
  
  // ---------- GR ----------
  if (pantalla === "GR") {
    if (key === 'g' || key === 'G') ingresarGR();
    if (key === 'd' || key === 'D') derivarGR();
    if (key === 'v' || key === 'V') verificarGR();
  }
  
  // ---------- GLC ----------
  if (pantalla === "GLC") {
    if (key === 'g' || key === 'G') ingresarGLC();
    if (key === 'd' || key === 'D') derivarGLC();
    if (key === 'v' || key === 'V') verificarGLC();
  }
  
  // ---------- MT ----------
  if (pantalla === "MT") {
    if (key === 'g' || key === 'G') ingresarMT();
    if (key === 'v' || key === 'V') verificarPalindromoMT();
    if (key === 'p' || key === 'P') animandoMT = !animandoMT;
    if (key === 'r' || key === 'R') {
      pasoIndex = 0; ultCambioMT = millis(); animandoMT = true;}
  }
  
  // ---------- GLOBAL ----------
  if (key === 'r' || key === 'R') reiniciarTodo();
  
  // Esc para cancelar selección de transición
  if (keyCode === ESCAPE) {
    selOrigen = null;
    modoEdicion = "mover";
  }
}

// ==========================================================
//  AFD – ACCIONES
// ==========================================================
function finalizarAFD() {
  let alf = prompt("Alfabeto (símbolos separados por espacio):");
  if (alf !== null) alfabetoUsuario = alf.trim().split(/\s+/);
}


function probarPalabraAFD() {
  if (!estadoInicial) { alert("Sin estado inicial"); return; }
  palabraTest = prompt("Palabra a probar:");
  if (palabraTest === null) return;
  // reiniciar camino
  caminoEstados = [];
  caminoTranses = [];
  pasoActual = 0;
  enAnimacion = false;
  alertMostrado = false;
  
  // buscar todos los caminos
  let resultado = buscarTodosCaminosAFD(palabraTest, estadoInicial, []);
  if (resultado.aceptadores.length) {
    caminoEstados = [estadoInicial].concat(resultado.aceptadores[0].map(p => p.estado));
    caminoTranses = resultado.aceptadores[0].map(p => p.trans);
    testAceptado = true;
  } else if (resultado.fallidos.length) {
    let masLargo = resultado.fallidos.reduce((a, b) => a.length > b.length ? a : b);
    caminoEstados = [estadoInicial].concat(masLargo.map(p => p.estado));
    caminoTranses = masLargo.map(p => p.trans);
    testAceptado = false;
  } else {
    caminoEstados = [estadoInicial];
    caminoTranses = [];
    testAceptado = estadoInicial.final && palabraTest === "";
  }
  pasoActual = 0;
  enAnimacion = true;
}

function buscarTodosCaminosAFD(cadena, estadoActual, caminoParcial, visitados = new Set()) {
  let key = estadoActual.nombre + "|" + cadena.length + "|" + caminoParcial.length;
  if (visitados.has(key)) return { aceptadores: [], fallidos: [] };
  visitados.add(key);

  let aceptadores = [];
  let fallidos = [];

  if (cadena.length === 0) {
    if (estadoActual.final) {
      aceptadores.push(caminoParcial);
      return { aceptadores, fallidos };
    }
    // epsilon moves
    let epsTrans = trans.filter(t => t.desde === estadoActual && (t.simb === "e" || t.simb === ""));
    for (let t of epsTrans) {
      let r = buscarTodosCaminosAFD(cadena, t.hasta, caminoParcial.concat({ estado: t.hasta, trans: t }), new Set(visitados));
      aceptadores.push(...r.aceptadores);
      fallidos.push(...r.fallidos);
    }
    if (aceptadores.length === 0 && fallidos.length === 0) fallidos.push(caminoParcial);
    return { aceptadores, fallidos };
  }

  // transiciones normales
  let char = cadena[0];
  let normales = trans.filter(t => t.desde === estadoActual && t.simb === char);
  for (let t of normales) {
    let r = buscarTodosCaminosAFD(cadena.slice(1), t.hasta, caminoParcial.concat({ estado: t.hasta, trans: t }), new Set(visitados));
    aceptadores.push(...r.aceptadores);
    fallidos.push(...r.fallidos);
  }

  // epsilon
  let epsTrans = trans.filter(t => t.desde === estadoActual && (t.simb === "e" || t.simb === ""));
  for (let t of epsTrans) {
    let r = buscarTodosCaminosAFD(cadena, t.hasta, caminoParcial.concat({ estado: t.hasta, trans: t }), new Set(visitados));
    aceptadores.push(...r.aceptadores);
    fallidos.push(...r.fallidos);
  }

  if (aceptadores.length === 0 && fallidos.length === 0) fallidos.push(caminoParcial);
  return { aceptadores, fallidos };
}

function efectoGlow() {
  if (pasoActual < caminoEstados.length) {
    pasoActual++;
    setTimeout(() => efectoGlow(), 600);
  } else {
    enAnimacion = false;
    alert(testAceptado ? "✅ Aceptada" : "❌ Rechazada");
  }
}


// ==========================================================
//  AP 
// ==========================================================

function dibujarAP() {
  fill(0, 255, 255);
  textSize(14);
  text("Modo AP – Click botones o atajos:", 20, 30);
  text("A: agregar  B:borrar  M:mover  T:transición  F:finalizar  P:probar", 20, 50);
  textSize(12);
  text("Pila actual: [ " + pila.join(" ") + " ]", 20, 80);
  text("Palabra: " + palabraTest, 20, 100);

  // Mostrar mensaje si estamos en modo transición
  if (modoEdicion === "trans" && selOrigen) {
    fill(255, 255, 0);
    text("Selecciona estado destino para transición AP", 20, 120);
  }

  // flechas y estados como AFD
  for (let t of trans) {
    let activa = caminoTranses.includes(t) && pasoActual > caminoTranses.indexOf(t);
    t.dibujar(activa);
  }
  for (let e of estados) {
    let activo = caminoEstados.includes(e) && pasoActual >= caminoEstados.indexOf(e);
    e.dibujar(activo);
  }
}

function ingresarTransAP() {
  if (!selOrigen) return;
  
  let dest = estados.find(e => e.adentro(mouseX, mouseY));
  if (!dest) {
    alert("Debes hacer click sobre un estado destino");
    return;
  }
  
  let entrada = prompt(
    "TRANSICIÓN AP - Formato: leo,saco/meto\n" +
    "Usa 'e' para épsilon\n" +
    "Ejemplos:\n" +
    "a,Z/XZ  (lee 'a', saca Z, mete XZ)\n" +
    "e,Z/Z   (épsilon, no lee, no cambia pila)\n" +
    "a,X/e   (lee 'a', saca X, no mete nada)\n" +
    "e,e/X   (épsilon, mete X en pila vacía)\n" +
    "\nIngresa transición:"
  );
  
  if (entrada === null || entrada.trim() === "") {
    selOrigen = null;
    return;
  }
  
  entrada = entrada.trim();
  
  // Validar formato básico
  if (!entrada.includes(",") || !entrada.includes("/")) {
    alert("Error: Formato debe ser 'leo,saco/meto'");
    selOrigen = null;
    return;
  }
  
  let partes = entrada.split(",");
  if (partes.length !== 2) {
    alert("Error: Debe tener exactamente una coma");
    selOrigen = null;
    return;
  }
  
  let leo = partes[0].trim();
  let pilaPartes = partes[1].split("/");
  
  if (pilaPartes.length !== 2) {
    alert("Error: Formato pila debe ser 'saco/meto'");
    selOrigen = null;
    return;
  }
  
  let saco = pilaPartes[0].trim();
  let meto = pilaPartes[1].trim();
  
  // Validar que sea consistente
  if (leo === "" || saco === "" || meto === "") {
    alert("Error: Campos no pueden estar vacíos (usa 'e' para épsilon)");
    selOrigen = null;
    return;
  }
  
  // Crear etiqueta para mostrar
  trans.push(new Transicion(selOrigen, dest, entrada));
  selOrigen = null;
}
function finalizarAP() {
  let alf = prompt("Alfabeto de entrada (símbolos sin espacios, ej: ab):");
  if (alf !== null && alf.trim() !== "") {
    alfabetoUsuario = alf.trim().split("");
  }
  
  let alfP = prompt("Alfabeto de pila (símbolos sin espacios, ej: XZ):");
  if (alfP !== null && alfP.trim() !== "") {
    alfabetoPila = alfP.trim().split("");
  }
  
  // CAMBIA ESTO: Iniciar pila VACÍA
  pila = []; // ← Pila vacía al inicio
  
  // Opcional: Preguntar si quiere símbolo inicial
  let usarSimboloInicial = confirm("¿Usar símbolo inicial en pila? (Z por defecto)");
  if (usarSimboloInicial) {
    let inicialPila = prompt("Símbolo inicial de pila (ej: Z):", "Z");
    if (inicialPila !== null && inicialPila.trim() !== "") {
      pila = [inicialPila.trim()];
    } else {
      pila = ["Z"];
    }
  }
  
  alert("AP configurado:\n" +
        "Alfabeto: " + alfabetoUsuario.join(",") + "\n" +
        "Alfabeto pila: " + alfabetoPila.join(",") + "\n" +
        "Pila inicial: [" + pila.join("") + "]");
}

function probarPalabraAP() {
  if (!estadoInicial) { 
    alert("No hay estado inicial definido"); 
    return; 
  }
  
  let input = prompt("Palabra a probar en el AP (usa 'e' para epsilon/empty):");
  if (input === null) return;
  
  palabraTest = input;
  
  // CAMBIA ESTO: Pila vacía al iniciar prueba
  pila = []; // ← Pila VACÍA
  
  caminoEstados = [];
  caminoTranses = [];
  pasoActual = 0;
  enAnimacion = false;
  testAceptado = false;
  alertMostrado = false;

  // Buscar todos los caminos posibles con pila vacía
  let resultado = buscarTodosCaminosAP(palabraTest, estadoInicial, [], pila);
  
  // Filtrar caminos que terminan en estado final con pila vacía
  let caminosAceptadores = resultado.aceptadores.filter(camino => {
    let ultimoEstado = camino.length > 0 ? camino[camino.length - 1].estado : estadoInicial;
    return ultimoEstado.final;
  });
  
  if (caminosAceptadores.length > 0) {
    // Tomar el primer camino aceptador
    caminoEstados = [estadoInicial].concat(caminosAceptadores[0].map(p => p.estado));
    caminoTranses = caminosAceptadores[0].map(p => p.trans);
    testAceptado = true;
  } else if (resultado.fallidos.length > 0) {
    // Mostrar el camino más largo fallido
    let masLargo = resultado.fallidos.reduce((a, b) => a.length > b.length ? a : b);
    caminoEstados = [estadoInicial].concat(masLargo.map(p => p.estado));
    caminoTranses = masLargo.map(p => p.trans);
    testAceptado = false;
  } else {
    caminoEstados = [estadoInicial];
    caminoTranses = [];
    testAceptado = false;
  }
  
  pasoActual = 0;
  enAnimacion = true;
  pila = alfabetoPila.length > 0 ? [alfabetoPila[0]] : ["Z"]; // Resetear pila para visualización
}

function buscarTodosCaminosAP(cadena, estadoActual, caminoParcial, pilaActual, visitados = new Set()) {
  // Crear clave única para evitar ciclos
  let pilaStr = pilaActual.join(",");
  let key = estadoActual.nombre + "|" + cadena + "|" + pilaStr;
  
  if (visitados.has(key)) return { aceptadores: [], fallidos: [] };
  visitados.add(key);

  let aceptadores = [];
  let fallidos = [];

  // --- VERIFICAR SI ESTAMOS EN SITUACIÓN DE ACEPTACIÓN ---
  // Para AP: cadena vacía Y estado final (pila vacía según nuestra definición)
  if (cadena.length === 0) {
    if (estadoActual.final && pilaActual.length === 0) {
      aceptadores.push(caminoParcial);
    }
  }

  // --- OBTENER TODAS LAS TRANSICIONES POSIBLES DESDE ESTE ESTADO ---
  let transPosibles = trans.filter(t => t.desde === estadoActual);
  
  for (let t of transPosibles) {
    // Parsear la transición: leo,saco/meto
    let partes = t.simb.split(",");
    if (partes.length !== 2) continue;
    
    let leo = partes[0];
    let resto = partes[1];
    let partesPila = resto.split("/");
    if (partesPila.length !== 2) continue;
    
    let saco = partesPila[0];
    let meto = partesPila[1];
    
    // --- VERIFICAR SI PODEMOS APLICAR ESTA TRANSICIÓN ---
    let puedeLeer = false;
    let puedeSacar = false;
    
    // 1. Verificar lectura de entrada
    if (leo === "e") {
      // Transición épsilon - no consume entrada
      puedeLeer = true;
      var nuevaCadena = cadena; // No consumimos
    } else if (cadena.length > 0 && cadena[0] === leo) {
      // Coincide con el primer símbolo
      puedeLeer = true;
      var nuevaCadena = cadena.substring(1); // Consumimos el símbolo
    } else {
      continue; // No podemos aplicar esta transición
    }
    
    // 2. Verificar operación de pila
    let nuevaPila = [...pilaActual];
    
    if (saco === "e") {
      // No sacamos nada de la pila
      puedeSacar = true;
    } else if (pilaActual.length > 0 && pilaActual[pilaActual.length - 1] === saco) {
      // El tope de la pila coincide
      puedeSacar = true;
      nuevaPila.pop(); // Sacamos el tope
    } else {
      continue; // No podemos aplicar esta transición
    }
    
    // 3. Aplicar "meto" a la pila
    if (meto !== "e") {
      // Meter símbolos uno por uno (de izquierda a derecha)
      for (let i = 0; i < meto.length; i++) {
        nuevaPila.push(meto[i]);
      }
    }
    
    if (puedeLeer && puedeSacar) {
      // Aplicar la transición y continuar recursivamente
      let nuevoCamino = caminoParcial.concat({
        estado: t.hasta,
        trans: t,
        lectura: leo === "e" ? "ε" : leo,
        pilaAntes: [...pilaActual],
        pilaDespues: [...nuevaPila]
      });
      
      let resultadoRec = buscarTodosCaminosAP(
        nuevaCadena,
        t.hasta,
        nuevoCamino,
        nuevaPila,
        new Set(visitados)
      );
      
      aceptadores.push(...resultadoRec.aceptadores);
      fallidos.push(...resultadoRec.fallidos);
    }
  }
  
  // Si no encontramos ninguna transición aplicable y no estamos en estado de aceptación,
  // este camino es fallido
  if (aceptadores.length === 0 && transPosibles.length === 0 && !estadoActual.final) {
    fallidos.push(caminoParcial);
  }
  
  return { aceptadores, fallidos };
}

// ==========================================================
//  GRAMÁTICA REGULAR 
// ==========================================================
function dibujarGR() {
  fill(0, 255, 255);
  textSize(14);
  text("Modo GR – G:Ingresar  D:Derivar  V:Verificar", 20, 30);
  textSize(12);
  
  // mostrar gramática en pantalla principal
  let prod = "";
  for (let nt in gramatica) {
    prod += nt + " → " + gramatica[nt].join(" | ") + "\n";
  }
  text("Producciones:\n" + (prod || "—"), 20, 60);
  
  if (derivacion.length) {
    text("Última derivación:", 20, 200);
    for (let i = 0; i < derivacion.length; i++) {
      text(i + ": " + derivacion[i], 20, 220 + i * 18);
    }
  }
}

function ingresarGR() {
  let entrada = prompt(
    "Ingresa gramática\n" +
    "Formato: NT = produccion1 | produccion2 | ...\n" +
    "Usa 'e' para epsilon (vacío)\n" +
    "Ejemplo: S = aS | b\n" +
    "Ingresa:"
  );
  
  if (!entrada) return;
  
  // Normalizar
  entrada = entrada.replace(/->/g, "=").replace(/→/g, "=");
  
  let partes = entrada.split("=");
  if (partes.length < 2) return;
  
  let nt = partes[0].trim();
  let resto = partes.slice(1).join("=");
  
  // Separar producciones
  let producciones = resto.split("|").map(p => p.trim()).filter(p => p !== "");
  
  if (producciones.length > 0) {
    gramatica[nt] = producciones;
    alert(`Producción ${nt} → ${producciones.join(" | ")} agregada`);
  }
}

function derivarGR() {
  if (Object.keys(gramatica).length === 0) {
    alert("Primero ingresa una gramática con 'G'");
    return;
  }
  
  let pasos = prompt("Número de pasos a derivar (ej: 5):");
  if (!pasos) return;
  
  let maxPasos = int(pasos);
  derivacion = ["S"];
  let actual = "S";
  
  for (let paso = 0; paso < maxPasos; paso++) {
    // Buscar un no terminal para expandir
    let expandido = false;
    
    for (let i = 0; i < actual.length; i++) {
      let char = actual[i];
      if (char >= 'A' && char <= 'Z' && gramatica[char]) {
        // Elegir una producción al azar
        let producciones = gramatica[char];
        if (producciones.length > 0) {
          let prod = random(producciones);
          actual = actual.substring(0, i) + 
                   (prod === "e" ? "" : prod) + 
                   actual.substring(i + 1);
          derivacion.push(actual);
          expandido = true;
          break;
        }
      }
    }
    
    if (!expandido) break; // No hay más no terminales
  }
}
function verificarGR() {
  let cadena = prompt("Cadena a verificar:");
  if (cadena === null) return;

  if (!esGramaticaRegular()) {
    alert("⚠️ Esta no es una gramática regular. El análisis puede no ser preciso.");
    if (!confirm("¿Continuar de todos modos?")) return;
  }

  // BFS para encontrar la derivación más corta
  let cola = [{ str: "S", deriv: ["S"] }];
  let visitados = new Set();

  while (cola.length > 0) {
    let { str, deriv } = cola.shift();

    if (str === cadena) {
      derivacion = deriv;
      alert("✅ Aceptada");
      return;
    }

    if (str.length > cadena.length + 2) continue;
    if (visitados.has(str)) continue;
    visitados.add(str);

    // Expandir primer no terminal
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      if (char >= 'A' && char <= 'Z' && gramatica[char]) {
        for (let prod of gramatica[char]) {
          let nueva = str.substring(0, i) + (prod === "e" ? "" : prod) + str.substring(i + 1);
          let nuevaDeriv = deriv.concat([nueva]);
          cola.push({ str: nueva, deriv: nuevaDeriv });
        }
        break; // solo expandimos el primero
      }
    }
  }

  derivacion = [];
  alert("❌ Rechazada");
}

function buscarDerivacionSimple(actual, objetivo, idx) {
  // Si ya llegamos al final
  if (idx === objetivo.length) {
    // Verificar si podemos vaciar los no terminales restantes
    let temp = actual;
    while (true) {
      let expandido = false;
      for (let i = 0; i < temp.length; i++) {
        let char = temp[i];
        if (char >= 'A' && char <= 'Z' && gramatica[char]) {
          if (gramatica[char].includes("e")) {
            temp = temp.substring(0, i) + temp.substring(i + 1);
            derivacion.push(temp);
            expandido = true;
            break;
          }
        }
      }
      if (!expandido) break;
    }
    return temp === "";
  }
  
  // Si no hay no terminales
  if (!/[A-Z]/.test(actual)) {
    return actual === objetivo.substring(idx);
  }
  
  // Buscar primer no terminal
  for (let i = 0; i < actual.length; i++) {
    let char = actual[i];
    if (char >= 'A' && char <= 'Z' && gramatica[char]) {
      // Probar cada producción
      for (let prod of gramatica[char]) {
        let nueva = actual.substring(0, i) + 
                   (prod === "e" ? "" : prod) + 
                   actual.substring(i + 1);
        
        derivacion.push(nueva);
        
        // Verificar si los primeros terminales coinciden
        let nuevosTerminales = "";
        for (let j = 0; j < prod.length; j++) {
          let c = prod[j];
          if (c >= 'a' && c <= 'z') {
            nuevosTerminales += c;
          } else {
            break; // Encontramos un no terminal
          }
        }
        
        let nuevoIdx = idx;
        if (nuevosTerminales !== "") {
          if (objetivo.substring(idx, idx + nuevosTerminales.length) === nuevosTerminales) {
            nuevoIdx = idx + nuevosTerminales.length;
          } else {
            derivacion.pop();
            continue; // No coinciden, probar siguiente
          }
        }
        
        // Llamar recursivamente
        if (buscarDerivacionSimple(nueva, objetivo, nuevoIdx)) {
          return true;
        }
        
        derivacion.pop();
      }
      break; // Solo expandir el primer no terminal
    }
  }
  
  return false;
}

function esGramaticaRegular() {
  if (Object.keys(gramatica).length === 0) return true;
  
  for (let nt in gramatica) {
    for (let prod of gramatica[nt]) {
      if (prod === "e") continue;
      
      // Contar no terminales
      let noTerminales = 0;
      for (let char of prod) {
        if (char >= 'A' && char <= 'Z') {
          noTerminales++;
        }
      }
      
      // En gramática regular derecha: máximo 1 no terminal al final
      if (noTerminales > 1) return false;
      if (noTerminales === 1) {
        let ultimo = prod[prod.length - 1];
        if (!(ultimo >= 'A' && ultimo <= 'Z')) return false;
      }
    }
  }
  
  return true;
}

// ==========================================================
//  GLC
// ==========================================================
/* ----------  DIBUJAR  ---------- */
function dibujarGLC() {
  fill(0, 255, 255);
  textSize(14);
  text("Modo GLC – G:Ingresar  D:Derivar  V:Verificar", 20, 30);
  textSize(12);
  let prod = "";
  for (let nt in gramatica) prod += nt + " → " + gramatica[nt].join(" | ") + "\n";
  text("Producciones:\n" + (prod || "—"), 20, 60);

  if (derivacion.length) {
    text("Última derivación:", 20, 200);
    for (let i = 0; i < derivacion.length; i++)
      text(i + ": " + derivacion[i], 20, 220 + i * 18);
  }
}

/* ----------  INGRESAR  ---------- */
function ingresarGLC() {
  let entrada = prompt("Ingresa GLC (ej: S = aSb | e)\n" +
                       "Puedes añadir más NT después con G otra vez.");
  if (!entrada) return;
  entrada = entrada.replace(/->/g, "=").replace(/→/g, "=");
  let [nt, resto] = entrada.split("=");
  if (!nt || !resto) return;
  nt = nt.trim();
  gramatica[nt] = resto.split("|").map(p => p.trim());
}

/* ----------  DERIVAR (aleatoria)  ---------- */
function derivarGLC() {
  let pasos = prompt("Número de pasos a derivar (ej: 5):");
  if (!pasos) return;
  let n = int(pasos);
  let act = "S";
  derivacion = [act];

  for (let i = 0; i < n; i++) {
    let NT = act.match(/[A-Z]/);          // primer NT
    if (!NT) break;
    let nt = NT[0];
    let opts = gramatica[nt] || [];
    if (!opts.length) break;
    let prod = random(opts);
    act = act.replace(nt, prod === "e" ? "" : prod);
    derivacion.push(act);
  }
}

/* ----------  VERIFICAR (BFS + derivación)  ---------- */
function verificarGLC() {
  let cadena = prompt("Cadena a verificar:");
  if (!cadena) return;

  let cola = [{ str: "S", deriv: ["S"] }];
  let visit = new Set();

  while (cola.length) {
    let { str, deriv } = cola.shift();

    if (str === cadena) {        // éxito
      derivacion = deriv;
      alert("✅ Aceptada");
      return;
    }
    if (str.length > cadena.length + 5) continue;
    if (visit.has(str)) continue;
    visit.add(str);

    // buscar primer NT
    let m = str.match(/[A-Z]/);
    if (!m) continue;
    let nt = m[0];
    let opts = gramatica[nt] || [];
    for (let p of opts) {
      let nueva = str.replace(nt, p === "e" ? "" : p);
      cola.push({ str: nueva, deriv: deriv.concat([nueva]) });
    }
  }
  derivacion = [];
  alert("❌ Rechazada");
}



// ==========================================================
//  MT – MÁQUINA DE TURING
// ==========================================================
// ---------- dibujar ----------

function dibujarMT() {
  fill(0, 255, 255);
  textSize(14);
  text("Modo MT – G:Ingresar  V:Verificar (animado)  P:Pausa  R:Reiniciar", 20, 30);
  textSize(12);

  // cinta
  let x0 = 20, ancho = 40, yc = 100;
  for (let i = 0; i < cintaMT.length; i++) {
    fill(i === cabezalMT ? color(0, 255, 0) : color(255));
    rect(x0 + i * ancho, yc, ancho, ancho);
    fill(0); textAlign(CENTER, CENTER);
    text(cintaMT[i], x0 + i * ancho + ancho / 2, yc + ancho / 2);
  }

  // estado
  text("Estado: " + estadoMT, 20, yc + 60);
}

// ---------- ingresar cadena ----------
function ingresarMT() {
  let entrada = prompt("Ingresa cadena para cinta (ej: abba):");
  if (entrada === null) return;
  cintaMT   = entrada.split("");
  cabezalMT = 0;
  estadoMT  = "q0";
  pasosMT   = [];
  animandoMT= false;
  // blancos infinitos
  cintaMT.unshift("_");
  cintaMT.push("_");
  cabezalMT = 1;
  crearTablaPalindromo();
}

// ---------- tabla de transiciones ----------
function crearTablaPalindromo() {
  reglasMT = {
    q0: {
      a: { nEst: "q1", esc: "_", mov: 1 },
      b: { nEst: "q2", esc: "_", mov: 1 },
      _: { nEst: "qA", esc: "_", mov: 0 }
    },
    q1: { // busca último a
      a: { nEst: "q1", esc: "a", mov: 1 },
      b: { nEst: "q1", esc: "b", mov: 1 },
      _: { nEst: "q3", esc: "_", mov: -1 }
    },
    q2: { // busca último b
      a: { nEst: "q2", esc: "a", mov: 1 },
      b: { nEst: "q2", esc: "b", mov: 1 },
      _: { nEst: "q4", esc: "_", mov: -1 }
    },
    q3: { // borra a
      a: { nEst: "q5", esc: "_", mov: -1 },
      _: { nEst: "qA", esc: "_", mov: 0 }
    },
    q4: { // borra b
      b: { nEst: "q5", esc: "_", mov: -1 },
      _: { nEst: "qA", esc: "_", mov: 0 }
    },
    q5: { // vuelve
      a: { nEst: "q5", esc: "a", mov: -1 },
      b: { nEst: "q5", esc: "b", mov: -1 },
      _: { nEst: "q0", esc: "_", mov: 1 }
    },
    qA: {}
  };
}

function calcularPasosMT() {
  pasosMT = [];
  let c   = cintaMT.slice();
  let cab = cabezalMT;
  let est = estadoMT;
  let pasos = 0, MAX = 200;

  while (est !== "qA" && pasos < MAX) {
    pasosMT.push({cinta: c.slice(), cabezal: cab, estado: est});
    let letra = c[cab] || "_";
    let trans = reglasMT[est]?.[letra];
    if (!trans) break;

    c[cab] = trans.esc;
    cab += trans.mov;
    if (cab < 0) { c.unshift("_"); cab = 0; }
    if (cab >= c.length) c.push("_");
    est = trans.nEst;
    pasos++;
  }
  pasosMT.push({cinta: c.slice(), cabezal: cab, estado: est});
}

// ---------- verificar ----------
function verificarPalindromoMT() {
  if (cintaMT.length === 0) {
    alert("❌ Cinta vacía");
    return;
  }
  calcularPasosMT();
  pasoIndex   = 0;
  animandoMT  = true;
  ultCambioMT = millis();
}





// ==========================================================
//  LATERAL – DEFINICIÓN FORMAL
// ==========================================================
function dibujarLateral() {
  push();
  fill(20, 20, 50, 200);
  noStroke();
  rect(width - 300, 0, 300, height);
  fill(0, 255, 255);
  textSize(16);
  text("DEFINICIÓN ACTUAL", width - 280, 20);
  textSize(12);
  if (pantalla === "AFD") {
    let Q = estados.map(e => e.nombre).join(",");
    let F = estados.filter(e => e.final).map(e => e.nombre).join(",");
    let Sigma = [...new Set(trans.map(t => t.simb))].join(",");
    let delta = trans.map(t => `δ(${t.desde.nombre},${t.simb})=${t.hasta.nombre}`).join("\n");
    let info = `Q = {${Q}}\nΣ = {${Sigma}}\nq₀ = ${estadoInicial ? estadoInicial.nombre : "—"}\nF = {${F}}\n\n${delta}`;
    text(info, width - 280, 60);
  }
   if (pantalla === "AP") {
    text("Alfabeto: " + alfabetoUsuario.join(","), width - 280, 60);
    text("Alfabeto pila: " + alfabetoPila.join(","), width - 280, 80);
    text("Pila: [ " + pila.join(" ") + " ]", width - 280, 100);
  }
  
   if (pantalla === "GR") {
    let prod = "";
    for (let nt in gramatica) prod += nt + " = " + gramatica[nt].join(" | ") + "\n";
    text("Producciones:\n" + (prod || "—"), width - 280, 60);
    if (derivacion.length) {
      text("Última derivación:", width - 280, 200);
      for (let i = 0; i < derivacion.length; i++) text(i + ": " + derivacion[i], width - 280, 220 + i * 18);
    }
  }
  pop();
}




