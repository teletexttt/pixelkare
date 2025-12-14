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
    fgColor: 7, // Blanco
    bgColor: 0, // Negro
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
    startX: 0,
    startY: 0,
    isDrawingShape: false,
    tempCanvas: null,
    tempCtx: null,
    history: [],
    historyIndex: -1,
    touchStart: { x: 0, y: 0 },
    isPanning: false
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
const logoCanvas = document.getElementById('logo-canvas');

// Iconos de Susan Kare
const KARE_ICONS = {
    smiley: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,1,1,0,0,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0]
    ],
    hand: [
        [0,0,0,0,1,1,0,0],
        [0,0,0,1,0,0,1,0],
        [0,0,1,0,0,0,0,1],
        [0,0,1,0,0,0,0,1],
        [0,1,0,0,0,0,0,1],
        [0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1]
    ],
    watch: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0]
    ]
};

// Inicialización
function init() {
    detectMobile();
    setupCanvas();
    setupTempCanvas();
    setupEventListeners();
    setupPalette();
    setupMobileUI();
    createLogo();
    updateDisplay();
    startBlinkEffect();
    updateTime();
    
    setInterval(updateTime, 60000);
    
    showMessage('PIXELCARE - HOMENAJE A SUSAN KARE. CREA ICONOS PÍXEL PERFECT.');
    
    saveToHistory();
}

function detectMobile() {
    CONFIG.isMobile = window.matchMedia('(max-width: 767px)').matches;
    
    if (CONFIG.isMobile) {
        document.body.classList.add('mobile');
        mobileHint.style.display = 'block';
        responsiveToggle.style.display = 'inline-block';
        
        // Ajustar tamaño para móvil
        CONFIG.gridSize = 14;
        CONFIG.cols = 28;
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
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    const scaleX = containerWidth / (CONFIG.cols * CONFIG.gridSize);
    const scaleY = containerHeight / (CONFIG.rows * CONFIG.gridSize);
    CONFIG.currentScale = Math.min(scaleX, scaleY, 1);
    
    canvas.width = CONFIG.cols * CONFIG.gridSize;
    canvas.height = CONFIG.rows * CONFIG.gridSize;
    
    canvas.style.width = `${canvas.width * CONFIG.currentScale}px`;
    canvas.style.height = `${canvas.height * CONFIG.currentScale}px`;
    
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (state.showGrid) {
        drawGrid();
    }
    
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

function createLogo() {
    const logoCtx = logoCanvas.getContext('2d');
    logoCtx.fillStyle = '#000';
    logoCtx.fillRect(0, 0, 48, 48);
    
    // Dibujar smiley pixelado
    logoCtx.fillStyle = '#ffff00';
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (KARE_ICONS.smiley[y][x] === 1) {
                logoCtx.fillRect(x * 6, y * 6, 6, 6);
            }
        }
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(128, 216, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= CONFIG.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CONFIG.gridSize, 0);
        ctx.lineTo(x * CONFIG.gridSize, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= CONFIG.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CONFIG.gridSize);
        ctx.lineTo(canvas.width, y * CONFIG.gridSize);
        ctx.stroke();
    }
}

function redrawAllPixels() {
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < CONFIG.rows; y++) {
        for (let x = 0; x < CONFIG.cols; x++) {
            const cell = state.gridData[y][x];
            if (cell.fg !== state.bgColor) {
                ctx.fillStyle = state.colors[cell.bg].hex;
                ctx.fillRect(
                    x * CONFIG.gridSize, 
                    y * CONFIG.gridSize, 
                    CONFIG.gridSize, 
                    CONFIG.gridSize
                );
                
                ctx.fillStyle = state.colors[cell.fg].hex;
                ctx.fillRect(
                    x * CONFIG.gridSize + 1, 
                    y * CONFIG.gridSize + 1, 
                    CONFIG.gridSize - 2, 
                    CONFIG.gridSize - 2
                );
            }
        }
    }
    
    if (state.showGrid) {
        drawGrid();
    }
}

function setupPalette() {
    const fgColors = document.getElementById('fg-colors');
    const bgColors = document.getElementById('bg-colors');
    const fgColorName = document.getElementById('fg-color-name');
    const bgColorName = document.getElementById('bg-color-name');
    
    fgColors.innerHTML = '';
    bgColors.innerHTML = '';
    
    state.colors.forEach((color, index) => {
        // Botones para color frontal
        const fgBtn = document.createElement('button');
        fgBtn.className = `color-btn color-${color.name}`;
        fgBtn.title = color.display;
        fgBtn.dataset.index = index;
        fgBtn.addEventListener('click', () => {
            state.fgColor = index;
            updatePaletteDisplay();
            showMessage(`COLOR FRENTE: ${color.display}`);
        });
        fgColors.appendChild(fgBtn);
        
        // Botones para color de fondo
        const bgBtn = document.createElement('button');
        bgBtn.className = `color-btn color-${color.name}`;
        bgBtn.title = color.display;
        bgBtn.dataset.index = index;
        bgBtn.addEventListener('click', () => {
            state.bgColor = index;
            updatePaletteDisplay();
            showMessage(`COLOR FONDO: ${color.display}`);
        });
        bgColors.appendChild(bgBtn);
    });
    
    updatePaletteDisplay();
}

function updatePaletteDisplay() {
    const currentFg = document.getElementById('current-fg');
    const currentBg = document.getElementById('current-bg');
    const fgColorName = document.getElementById('fg-color-name');
    const bgColorName = document.getElementById('bg-color-name');
    
    currentFg.className = `color-box color-${state.colors[state.fgColor].name}`;
    currentBg.className = `color-box color-${state.colors[state.bgColor].name}`;
    fgColorName.textContent = state.colors[state.fgColor].display;
    bgColorName.textContent = state.colors[state.bgColor].display;
    
    document.querySelectorAll('#fg-colors .color-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.index) === state.fgColor);
    });
    
    document.querySelectorAll('#bg-colors .color-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.index) === state.bgColor);
    });
    
    // Actualizar botones móviles
    document.querySelectorAll('.color-btn-mobile').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.color) === state.fgColor);
    });
}

function setupEventListeners() {
    // Eventos del canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Eventos táctiles
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Botones de herramientas
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            setTool(tool);
        });
    });
    
    // Botones de control
    document.getElementById('btn-clear').addEventListener('click', clearCanvas);
    document.getElementById('btn-grid').addEventListener('click', toggleGrid);
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-export').addEventListener('click', () => exportCanvas(false));
    
    // Botones de presets
    document.getElementById('btn-smiley').addEventListener('click', () => drawKareIcon('smiley'));
    document.getElementById('btn-hand').addEventListener('click', () => drawKareIcon('hand'));
    document.getElementById('btn-watch').addEventListener('click', () => drawKareIcon('watch'));
    
    // Botón responsive
    responsiveToggle.addEventListener('click', toggleResponsive);
    
    // Menú móvil
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Botones móviles
    document.querySelectorAll('.mobile-tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = btn.dataset.tool;
            setTool(tool);
            e.stopPropagation();
        });
    });
    
    document.querySelectorAll('.color-btn-mobile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colorIndex = parseInt(btn.dataset.color);
            state.fgColor = colorIndex;
            updatePaletteDisplay();
            showMessage(`COLOR: ${state.colors[colorIndex].display}`);
            e.stopPropagation();
        });
    });
    
    // Atajos de teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Actualizar posición del cursor
    canvas.addEventListener('mousemove', updateCursorPosition);
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mobile-modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
}

function setupMobileUI() {
    if (!CONFIG.isMobile) return;
    
    // Herramientas móviles
    const toolsList = document.getElementById('mobile-tools-list');
    toolsList.innerHTML = '';
    
    const tools = [
        { tool: 'brush', icon: '✏️', label: 'Pincel' },
        { tool: 'eraser', icon: '🧹', label: 'Borrador' },
        { tool: 'line', icon: '📏', label: 'Línea' },
        { tool: 'rect', icon: '⬜', label: 'Rectángulo' },
        { tool: 'circle', icon: '⭕', label: 'Círculo' },
        { tool: 'fill', icon: '🎨', label: 'Relleno' }
    ];
    
    tools.forEach(t => {
        const item = document.createElement('div');
        item.className = 'mobile-tool-item';
        item.dataset.tool = t.tool;
        item.innerHTML = `<div style="font-size: 24px; margin-bottom: 5px;">${t.icon}</div><div>${t.label}</div>`;
        item.addEventListener('click', () => {
            setTool(t.tool);
            document.getElementById('mobile-tools-modal').style.display = 'none';
        });
        toolsList.appendChild(item);
    });
    
    // Colores móviles
    const colorsList = document.getElementById('mobile-colors-list');
    colorsList.innerHTML = '';
    
    state.colors.forEach((color, index) => {
        const item = document.createElement('div');
        item.className = 'mobile-color-item';
        item.dataset.color = index;
        item.innerHTML = `
            <div class="color-btn-mobile color-${color.name}" 
                 style="width: 40px; height: 40px; margin-bottom: 5px;"></div>
            <div>${color.display}</div>
        `;
        item.addEventListener('click', () => {
            state.fgColor = index;
            updatePaletteDisplay();
            document.getElementById('mobile-colors-modal').style.display = 'none';
            showMessage(`COLOR: ${color.display}`);
        });
        colorsList.appendChild(item);
    });
}

function setTool(tool) {
    state.tool = tool;
    
    // Actualizar UI desktop
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    
    // Actualizar UI móvil
    document.querySelectorAll('.mobile-tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    
    toolIndicator.textContent = tool.toUpperCase();
    
    const cursorMap = {
        brush: 'crosshair',
        eraser: 'cell',
        line: 'crosshair',
        rect: 'crosshair',
        circle: 'crosshair',
        fill: 'crosshair'
    };
    canvas.style.cursor = cursorMap[tool] || 'crosshair';
    
    showMessage(`HERRAMIENTA: ${tool.toUpperCase()}`);
}

function startDrawing(e) {
    e.preventDefault();
    const { x, y } = getGridCoordinates(e);
    state.isDrawing = true;
    state.lastX = x;
    state.lastY = y;
    state.startX = x;
    state.startY = y;
    
    if (['line', 'rect', 'circle'].includes(state.tool)) {
        state.isDrawingShape = true;
        state.tempCtx.drawImage(canvas, 0, 0);
        return;
    }
    
    switch(state.tool) {
        case 'brush':
            drawPixel(x, y);
            break;
        case 'eraser':
            erasePixel(x, y);
            break;
        case 'fill':
            floodFill(x, y);
            break;
    }
}

function draw(e) {
    if (!state.isDrawing) return;
    e.preventDefault();
    
    const { x, y } = getGridCoordinates(e);
    
    if (state.isDrawingShape && ['line', 'rect', 'circle'].includes(state.tool)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(state.tempCanvas, 0, 0);
        drawShapePreview(state.startX, state.startY, x, y);
        return;
    }
    
    switch(state.tool) {
        case 'brush':
            drawLine(state.lastX, state.lastY, x, y);
            state.lastX = x;
            state.lastY = y;
            break;
        case 'eraser':
            eraseLine(state.lastX, state.lastY, x, y);
            state.lastX = x;
            state.lastY = y;
            break;
    }
}

function stopDrawing() {
    if (!state.isDrawing) return;
    
    if (state.isDrawingShape && ['line', 'rect', 'circle'].includes(state.tool)) {
        applyShape();
    }
    
    state.isDrawing = false;
    state.isDrawingShape = false;
    saveToHistory();
}

function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        state.touchStart = { x: touch.clientX, y: touch.clientY };
        state.isPanning = false;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && state.isDrawing) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        
        // Detectar si es pan (movimiento grande sin dibujar)
        const dx = Math.abs(touch.clientX - state.touchStart.x);
        const dy = Math.abs(touch.clientY - state.touchStart.y);
        if (dx > 20 || dy > 20) {
            state.isPanning = true;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!state.isPanning) {
        const mouseEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseEvent);
    }
    state.isPanning = false;
}

function getGridCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = CONFIG.currentScale;
    
    let clientX, clientY;
    if (e.type.includes('touch')) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const canvasX = (clientX - rect.left) / scale;
    const canvasY = (clientY - rect.top) / scale;
    
    const gridX = Math.floor(canvasX / CONFIG.gridSize);
    const gridY = Math.floor(canvasY / CONFIG.gridSize);
    
    return {
        x: Math.max(0, Math.min(gridX, CONFIG.cols - 1)),
        y: Math.max(0, Math.min(gridY, CONFIG.rows - 1))
    };
}

function drawPixel(x, y) {
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return;
    
    state.gridData[y][x].fg = state.fgColor;
    state.gridData[y][x].bg = state.bgColor;
    
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(x * CONFIG.gridSize, y * CONFIG.gridSize, CONFIG.gridSize, CONFIG.gridSize);
    
    ctx.fillStyle = state.colors[state.fgColor].hex;
    ctx.fillRect(x * CONFIG.gridSize + 1, y * CONFIG.gridSize + 1, CONFIG.gridSize - 2, CONFIG.gridSize - 2);
    
    if (state.showGrid) {
        drawGridCell(x, y);
    }
}

function drawLine(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
        drawPixel(x1, y1);
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

function erasePixel(x, y) {
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return;
    
    state.gridData[y][x].fg = state.bgColor;
    state.gridData[y][x].bg = state.bgColor;
    
    ctx.fillStyle = state.colors[state.bgColor].hex;
    ctx.fillRect(x * CONFIG.gridSize, y * CONFIG.gridSize, CONFIG.gridSize, CONFIG.gridSize);
    
    if (state.showGrid) {
        drawGridCell(x, y);
    }
}

function eraseLine(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
        erasePixel(x1, y1);
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

function floodFill(x, y) {
    const targetColor = state.gridData[y][x].fg;
    if (targetColor === state.fgColor) return;
    
    const queue = [[x, y]];
    const visited = new Set();
    
    while(queue.length > 0) {
        const [cx, cy] = queue.shift();
        const key = `${cx},${cy}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (cx < 0 || cx >= CONFIG.cols || cy < 0 || cy >= CONFIG.rows) continue;
        if (state.gridData[cy][cx].fg !== targetColor) continue;
        
        drawPixel(cx, cy);
        
        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
    }
}

function drawShapePreview(x1, y1, x2, y2) {
    ctx.strokeStyle = state.colors[state.fgColor].hex;
    ctx.fillStyle = state.colors[state.fgColor].hex + '80';
    ctx.lineWidth = 1;
    
    switch(state.tool) {
        case 'line':
            drawPreviewLine(x1, y1, x2, y2);
            break;
        case 'rect':
            drawPreviewRect(x1, y1, x2, y2);
            break;
        case 'circle':
            drawPreviewCircle(x1, y1, x2, y2);
            break;
    }
    
    if (state.showGrid) {
        drawGrid();
    }
}

function drawPreviewLine(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
        drawPreviewPixel(x1, y1);
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

function drawPreviewRect(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (let x = minX; x <= maxX; x++) {
        drawPreviewPixel(x, minY);
        drawPreviewPixel(x, maxY);
    }
    for (let y = minY; y <= maxY; y++) {
        drawPreviewPixel(minX, y);
        drawPreviewPixel(maxX, y);
    }
}

function drawPreviewCircle(x1, y1, x2, y2) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    for (let angle = 0; angle < 360; angle += 10) {
        const rad = angle * Math.PI / 180;
        const x = Math.round(x1 + radius * Math.cos(rad));
        const y = Math.round(y1 + radius * Math.sin(rad));
        
        if (x >= 0 && x < CONFIG.cols && y >= 0 && y < CONFIG.rows) {
            drawPreviewPixel(x, y);
        }
    }
}

function drawPreviewPixel(x, y) {
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return;
    
    ctx.fillStyle = state.colors[state.fgColor].hex + '80';
    ctx.fillRect(
        x * CONFIG.gridSize + 1, 
        y * CONFIG.gridSize + 1, 
        CONFIG.gridSize - 2, 
        CONFIG.gridSize - 2
    );
}

function applyShape() {
    const endX = state.lastX;
    const endY = state.lastY;
    
    switch(state.tool) {
        case 'line':
            drawLine(state.startX, state.startY, endX, endY);
            break;
        case 'rect':
            drawRectangle(state.startX, state.startY, endX, endY);
            break;
        case 'circle':
            drawCircle(state.startX, state.startY, endX, endY);
            break;
    }
}

function drawRectangle(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (let x = minX; x <= maxX; x++) {
        drawPixel(x, minY);
        drawPixel(x, maxY);
    }
    for (let y = minY; y <= maxY; y++) {
        drawPixel(minX, y);
        drawPixel(maxX, y);
    }
}

function drawCircle(x1, y1, x2, y2) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    for (let angle = 0; angle < 360; angle += 5) {
        const rad = angle * Math.PI / 180;
        const x = Math.round(x1 + radius * Math.cos(rad));
        const y = Math.round(y1 + radius * Math.sin(rad));
        
        if (x >= 0 && x < CONFIG.cols && y >= 0 && y < CONFIG.rows) {
            drawPixel(x, y);
        }
    }
}

function drawGridCell(x, y) {
    ctx.strokeStyle = 'rgba(128, 216, 255, 0.3)';
    ctx.lineWidth = 1;
    
    ctx.strokeRect(
        x * CONFIG.gridSize,
        y * CONFIG.gridSize,
        CONFIG.gridSize,
        CONFIG.gridSize
    );
}

function drawKareIcon(iconName) {
    saveToHistory();
    
    const iconData = KARE_ICONS[iconName];
    if (!iconData) return;
    
    // Dibujar en el centro
    const centerX = Math.floor(CONFIG.cols / 2) - 4;
    const centerY = Math.floor(CONFIG.rows / 2) - 4;
    
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (iconData[y][x] === 1) {
                const px = centerX + x;
                const py = centerY + y;
                if (px >= 0 && px < CONFIG.cols && py >= 0 && py < CONFIG.rows) {
                    drawPixel(px, py);
                }
            }
        }
    }
    
    showMessage(`ICONO KARE "${iconName.toUpperCase()}" AÑADIDO`);
}

function clearCanvas() {
    if (confirm('¿BORRAR TODO EL LIENZO?')) {
        ctx.fillStyle = state.colors[state.bgColor].hex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (state.showGrid) {
            drawGrid();
        }
        
        for (let y = 0; y < CONFIG.rows; y++) {
            for (let x = 0; x < CONFIG.cols; x++) {
                state.gridData[y][x].fg = state.bgColor;
                state.gridData[y][x].bg = state.bgColor;
            }
        }
        
        showMessage('LIENZO BORRADO');
        saveToHistory();
    }
}

function toggleGrid() {
    state.showGrid = !state.showGrid;
    redrawAllPixels();
    showMessage(`REJILLA: ${state.showGrid ? 'ACTIVADA' : 'DESACTIVADA'}`);
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        const previousState = state.history[state.historyIndex];
        state.gridData = JSON.parse(JSON.stringify(previousState.gridData));
        redrawAllPixels();
        showMessage('DESHECHO');
    } else {
        showMessage('NO HAY MÁS ACCIONES PARA DESHACER');
    }
}

function saveToHistory() {
    // Limitar historial a 50 estados
    if (state.history.length > 50) {
        state.history.shift();
    }
    
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push({
        gridData: JSON.parse(JSON.stringify(state.gridData))
    });
    state.historyIndex = state.history.length - 1;
}

function exportCanvas(includeGrid = true) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CONFIG.cols * CONFIG.gridSize;
    exportCanvas.height = CONFIG.rows * CONFIG.gridSize;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Dibujar fondo
    exportCtx.fillStyle = state.colors[state.bgColor].hex;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Dibujar píxeles
    for (let y = 0; y < CONFIG.rows; y++) {
        for (let x = 0; x < CONFIG.cols; x++) {
            const cell = state.gridData[y][x];
            if (cell.fg !== state.bgColor) {
                exportCtx.fillStyle = state.colors[cell.bg].hex;
                exportCtx.fillRect(
                    x * CONFIG.gridSize, 
                    y * CONFIG.gridSize, 
                    CONFIG.gridSize, 
                    CONFIG.gridSize
                );
                
                exportCtx.fillStyle = state.colors[cell.fg].hex;
                exportCtx.fillRect(
                    x * CONFIG.gridSize + 1, 
                    y * CONFIG.gridSize + 1, 
                    CONFIG.gridSize - 2, 
                    CONFIG.gridSize - 2
                );
            }
        }
    }
    
    // Dibujar rejilla si se incluye
    if (includeGrid && state.showGrid) {
        exportCtx.strokeStyle = 'rgba(128, 216, 255, 0.3)';
        exportCtx.lineWidth = 1;
        
        for (let x = 0; x <= CONFIG.cols; x++) {
            exportCtx.beginPath();
            exportCtx.moveTo(x * CONFIG.gridSize, 0);
            exportCtx.lineTo(x * CONFIG.gridSize, exportCanvas.height);
            exportCtx.stroke();
        }
        
        for (let y = 0; y <= CONFIG.rows; y++) {
            exportCtx.beginPath();
            exportCtx.moveTo(0, y * CONFIG.gridSize);
            exportCtx.lineTo(exportCanvas.width, y * CONFIG.gridSize);
            exportCtx.stroke();
        }
    }
    
    const link = document.createElement('a');
    link.download = `pixelcare-${new Date().getTime()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    
    showMessage('IMAGEN EXPORTADA COMO PNG');
}

function updateCursorPosition(e) {
    const { x, y } = getGridCoordinates(e);
    cursorPos.textContent = `X: ${x}, Y: ${y}`;
}

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    timeDisplay.textContent = timeStr;
}

function updateDisplay() {
    statusIndicator.textContent = state.isDrawing ? '● DIBUJANDO' : '● LISTO';
}

function showMessage(msg) {
    messageLine.textContent = msg;
    
    setTimeout(() => {
        if (messageLine.textContent === msg) {
            messageLine.textContent = 'PIXELCARE - HOMENAJE A SUSAN KARE. CREA ICONOS PIXEL ART.';
        }
    }, 3000);
}

function handleKeyPress(e) {
    const toolKeys = {
        'b': 'brush',
        'e': 'eraser',
        'l': 'line',
        'r': 'rect',
        'c': 'circle',
        'f': 'fill'
    };
    
    if (toolKeys[e.key.toLowerCase()]) {
        setTool(toolKeys[e.key.toLowerCase()]);
        e.preventDefault();
    }
    
    // Teclas numéricas para colores (1-8)
    const colorIndex = parseInt(e.key) - 1;
    if (colorIndex >= 0 && colorIndex <= 7) {
        state.fgColor = colorIndex;
        updatePaletteDisplay();
        showMessage(`COLOR: ${state.colors[colorIndex].display}`);
    }
    
    // Ctrl+Z para deshacer
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    // Ctrl+S para guardar
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportCanvas(false);
    }
}

function startBlinkEffect() {
    setInterval(() => {
        state.blinkState = !state.blinkState;
        // Efecto de parpadeo en el indicador de estado
        if (state.blinkState) {
            statusIndicator.style.opacity = '1';
        } else {
            statusIndicator.style.opacity = '0.7';
        }
    }, CONFIG.blinkInterval);
}

function toggleResponsive() {
    if (CONFIG.isMobile) {
        // Cambiar a modo desktop
        CONFIG.isMobile = false;
        CONFIG.gridSize = 16;
        CONFIG.cols = 40;
        CONFIG.rows = 25;
        document.body.classList.remove('mobile');
        mobileHint.style.display = 'none';
        mobileToolbar.style.display = 'none';
        toolsPanel.style.display = 'flex';
        toolsPanel.classList.remove('mobile-open');
        mobileMenuBtn.style.display = 'none';
    } else {
        // Cambiar a modo móvil
        CONFIG.isMobile = true;
        CONFIG.gridSize = 14;
        CONFIG.cols = 28;
        CONFIG.rows = 20;
        document.body.classList.add('mobile');
        mobileHint.style.display = 'block';
        mobileToolbar.style.display = 'flex';
        toolsPanel.style.display = 'none';
        mobileMenuBtn.style.display = 'flex';
    }
    
    resolutionIndicator.textContent = `${CONFIG.cols}×${CONFIG.rows}`;
    setupCanvas();
    showMessage(`MODO: ${CONFIG.isMobile ? 'MÓVIL' : 'ESCRITORIO'}`);
}

function toggleMobileMenu() {
    toolsPanel.classList.toggle('mobile-open');
}

// Iniciar la aplicación
window.addEventListener('load', init);
