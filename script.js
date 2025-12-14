// Configuración principal
const CONFIG = {
    baseWidth: 640,
    baseHeight: 400,
    gridSize: 16,
    cols: 40,
    rows: 25,
    blinkInterval: 500,
    isMobile: false,
    currentScale: 1
};

// Estado global
const state = {
    tool: 'brush',
    fgColor: 7,
    bgColor: 0,
    colors: [
        { name: 'black', hex: '#000000', display: 'Negro' },
        { name: 'red', hex: '#ff3b30', display: 'Rojo' },
        { name: 'green', hex: '#4cd964', display: 'Verde' },
        { name: 'yellow', hex: '#ffcc00', display: 'Amarillo' },
        { name: 'blue', hex: '#007aff', display: 'Azul' },
        { name: 'magenta', hex: '#ff2d55', display: 'Magenta' },
        { name: 'cyan', hex: '#5ac8fa', display: 'Cian' },
        { name: 'white', hex: '#ffffff', display: 'Blanco' }
    ],
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    showGrid: true,
    gridData: [],
    blinkState: true,
    textInputActive: false,
    startX: 0,
    startY: 0,
    isDrawingShape: false,
    tempCanvas: null,
    tempCtx: null,
    history: [],
    historyIndex: -1,
    touchStart: { x: 0, y: 0 },
    isPanning: false,
    canvasOffset: { x: 0, y: 0 }
};

// Elementos DOM
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const cursorPos = document.getElementById('cursor-pos');
const toolIndicator = document.getElementById('tool-indicator');
const messageLine = document.getElementById('message-line');
const timeDisplay = document.getElementById('time-display');
const statusIndicator = document.getElementById('status-indicator');
const resolutionIndicator = document.getElementById('resolution-indicator');
const mobileHint = document.getElementById('mobile-hint');
const responsiveToggle = document.getElementById('responsive-toggle');
const toolsPanel = document.getElementById('tools-panel');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileToolbar = document.getElementById('mobile-toolbar');

// Inicialización
function init() {
    detectMobile();
    setupCanvas();
    setupTempCanvas();
    setupEventListeners();
    setupPalette();
    setupMobileUI();
    updateDisplay();
    startBlinkEffect();
    updateTime();
    
    setInterval(updateTime, 60000);
    
    showMessage('PIXELCARE INICIADO - HOMENAJE A SUSAN KARE. CREA ICONOS PÍXEL PERFECT.');
    
    // Añadir estado inicial al historial
    saveToHistory();
}

function detectMobile() {
    CONFIG.isMobile = window.matchMedia('(max-width: 767px)').matches;
    
    if (CONFIG.isMobile) {
        document.body.classList.add('mobile');
        mobileHint.style.display = 'block';
        responsiveToggle.style.display = 'inline-block';
        
        // Ajustar tamaño para móvil
        CONFIG.gridSize = 12;
        CONFIG.cols = 32;
        CONFIG.rows = 20;
    } else {
        document.body.classList.remove('mobile');
        mobileHint.style.display = 'none';
        responsiveToggle.style.display = 'none';
        
        // Tamaño original para desktop
        CONFIG.gridSize = 16;
        CONFIG.cols = 40;
        CONFIG.rows = 25;
    }
    
    resolutionIndicator.textContent = `${CONFIG.cols}×${CONFIG.rows}`;
}

function setupCanvas() {
    // Ajustar tamaño según dispositivo
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    // Calcular escala manteniendo proporción
    const scaleX = containerWidth / (CONFIG.cols * CONFIG.gridSize);
    const scaleY = containerHeight / (CONFIG.rows * CONFIG.gridSize);
    CONFIG.currentScale = Math.min(scaleX, scaleY, 1);
    
    canvas.width = CONFIG.cols * CONFIG.gridSize * CONFIG.currentScale;
    canvas.height = CONFIG.rows * CONFIG.gridSize * CONFIG.currentScale;
    
    // Aplicar transformación CSS para escalado suave
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    
    // Limpiar canvas
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar rejilla si está activada
    if (state.showGrid) {
        drawGrid();
    }
    
    // Inicializar gridData
    state.gridData = [];
    for (let y = 0; y < CONFIG.rows; y++) {
        state.gridData[y] = [];
        for (let x = 0; x < CONFIG.cols; x++) {
            state.gridData[y][x] = {
                fg: state.bgColor,
                bg: state.bgColor,
                char: null,
                blink: false
            };
        }
    }
}

function setupTempCanvas() {
    state.tempCanvas = document.createElement('canvas');
    state.tempCanvas.width = canvas.width;
    state.tempCanvas.height = canvas.height;
    state.tempCtx = state.tempCanvas.getContext('2d');
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(128, 216, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const scaledGridSize = CONFIG.gridSize * CONFIG.currentScale;
    
    // Líneas verticales
    for (let x = 0; x <= CONFIG.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * scaledGridSize, 0);
        ctx.lineTo(x * scaledGridSize, canvas.height);
        ctx.stroke();
    }
    
    // Líneas horizontales
    for (let y = 0; y <= CONFIG.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * scaledGridSize);
        ctx.lineTo(canvas.width, y * scaledGridSize);
        ctx.stroke();
    }
}

function redrawAllPixels() {
    // Fondo completo
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cada píxel
    const scaledGridSize = CONFIG.gridSize * CONFIG.currentScale;
    const pixelSize = Math.max(1, scaledGridSize - 2 * CONFIG.currentScale);
    
    for (let y = 0; y < CONFIG.rows; y++) {
        for (let x = 0; x < CONFIG.cols; x++) {
            const cell = state.gridData[y][x];
            if (cell.fg !== state.bgColor) {
                // Fondo del bloque
                ctx.fillStyle = state.colors[cell.bg].hex;
                ctx.fillRect(
                    x * scaledGridSize, 
                    y * scaledGridSize, 
                    scaledGridSize, 
                    scaledGridSize
                );
                
                // Píxel interior
                ctx.fillStyle = state.colors[cell.fg].hex;
                ctx.fillRect(
                    x * scaledGridSize + CONFIG.currentScale, 
                    y * scaledGridSize + CONFIG.currentScale, 
                    pixelSize, 
                    pixelSize
                );
            }
        }
