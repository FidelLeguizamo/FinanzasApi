const API_URL = "/api";
let chartGastos = null;

const categoriasBase = [
    { id: 1, nombre: 'Comida y snacks', color: '#2563eb' },
    { id: 2, nombre: 'Entretenimiento', color: '#f59e0b' },
    { id: 3, nombre: 'Educación', color: '#8b5cf6' },
    { id: 4, nombre: 'Transporte', color: '#06b6d4' },
    { id: 5, nombre: 'Ropa y accesorios', color: '#ec4899' },
    { id: 6, nombre: 'Tecnología y juegos', color: '#6366f1' },
    { id: 7, nombre: 'Salud y cuidado', color: '#10b981' },
    { id: 8, nombre: 'Regalos y salidas', color: '#f43f5e' }
];

window.addEventListener('DOMContentLoaded', () => {
    limitarFechasHastaHoy();

    const cachedUserId = localStorage.getItem('userId');
    if (cachedUserId) {
        showDashboard();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    }
});

document.getElementById('go-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('signup-box').classList.remove('hidden');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const contrasenia = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, contrasenia })
        });

        if (response.ok) {
            const usuario = await response.json();
            localStorage.setItem('userId', usuario.IdUsuario);
            localStorage.setItem('userName', usuario.Nombre);
            showDashboard();
        } else {
            alert("❌ Credenciales incorrectas. Verificá tu correo y contraseña.");
        }
    } catch (error) {
        console.error("Error en conexión de login:", error);
        alert("⚠️ Error de conexión con el servidor.");
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const contrasenia = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, contrasenia })
        });

        if (response.ok) {
            alert("✨ ¡Cuenta creada con éxito! Ya podés iniciar sesión.");
            document.getElementById('signup-box').classList.add('hidden');
            document.getElementById('login-box').classList.remove('hidden');
            document.getElementById('signup-form').reset();
        } else {
            const errorText = await response.text();
            alert(errorText || "⚠️ El correo ya está registrado o los datos son inválidos.");
        }
    } catch (error) {
        console.error("Error en conexión de registro:", error);
        alert("⚠️ Ocurrió un problema de red al intentar registrarse.");
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
});

function showDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');

    const name = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('welcome-text').innerText = `Hola, ${name} 👋`;

    limitarFechasHastaHoy();
    actualizarDashboard();
}

document.getElementById('ingreso-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('ingreso-monto').value);
    const categoria = document.getElementById('ingreso-categoria').value;
    const descripcion = document.getElementById('ingreso-desc').value.trim();
    const fecha = document.getElementById('ingreso-fecha').value;
    const idUsuario = parseInt(localStorage.getItem('userId'));

    if (esFechaFutura(fecha)) {
        alert("No se pueden registrar ingresos a futuro.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/ingresos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, monto, categoria, descripcion, fecha })
        });

        if (response.ok) {
            actualizarDashboard();
            e.target.reset();
            limitarFechasHastaHoy();
        } else {
            const errorText = await response.text();
            alert(errorText || "No se pudo guardar el ingreso. Verificá los campos.");
        }
    } catch (error) {
        console.error("Error al registrar ingreso:", error);
    }
});

document.getElementById('gasto-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('gasto-monto').value);
    const descripcion = document.getElementById('gasto-desc').value.trim();
    const idCategoria = parseInt(document.getElementById('gasto-categoria').value);
    const fecha = document.getElementById('gasto-fecha').value;
    const idUsuario = parseInt(localStorage.getItem('userId'));

    if (esFechaFutura(fecha)) {
        alert("No se pueden registrar gastos a futuro.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/gastos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, idCategoria, descripcion, monto, fecha })
        });

        if (response.ok) {
            actualizarDashboard();
            e.target.reset();
            limitarFechasHastaHoy();
        } else {
            const errorText = await response.text();
            alert(errorText || "No se pudo guardar el gasto. Verificá los campos.");
        }
    } catch (error) {
        console.error("Error al registrar gasto:", error);
    }
});

async function actualizarDashboard() {
    const idUsuario = localStorage.getItem('userId');
    if (!idUsuario) return;

    try {
        const response = await fetch(`${API_URL}/gastos/dashboard/${idUsuario}`);
        if (!response.ok) throw new Error("Error al obtener métricas del dashboard");

        const resData = await response.json();
        const data = resData.datos;
        const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

        document.getElementById('total-ingresos').innerText = formatter.format(data.totalIngresos);
        document.getElementById('total-gastos').innerText = formatter.format(data.totalGastos);
        document.getElementById('total-balance').innerText = formatter.format(data.balance);

        const categorias = normalizarCategorias(data.categorias || []);
        renderGrafico(categorias);
        renderResumenCategorias(categorias, formatter);
        actualizarHistorial(formatter);
    } catch (error) {
        console.error("Error al conectar con el endpoint del dashboard:", error);
    }
}

async function actualizarHistorial(formatter) {
    const idUsuario = localStorage.getItem('userId');
    const list = document.getElementById('movimientos-list');
    if (!idUsuario || !list) return;

    try {
        const response = await fetch(`${API_URL}/gastos/historial/${idUsuario}`);
        if (!response.ok) throw new Error("Error al obtener historial");

        const resData = await response.json();
        renderHistorial(resData.datos || [], formatter);
    } catch (error) {
        console.error("Error al conectar con el historial:", error);
    }
}

function normalizarCategorias(categoriasApi) {
    return categoriasBase
        .map(base => {
            const encontrada = categoriasApi.find(cat => Number(cat.categoriaId) === base.id) || {};

            return {
                ...base,
                nombre: encontrada.categoria || base.nombre,
                total: Number(encontrada.total || 0),
                promedio: Number(encontrada.promedio || 0),
                cantidad: Number(encontrada.cantidad || 0)
            };
        })
        .sort((a, b) => b.total - a.total);
}

function renderGrafico(categorias) {
    const ctx = document.getElementById('canvas-gastos').getContext('2d');
    const emptyState = document.getElementById('chart-empty');
    const centerState = document.getElementById('chart-center');
    const totalState = document.getElementById('chart-total');
    const totalGastos = categorias.reduce((total, categoria) => total + categoria.total, 0);
    const hayGastos = totalGastos > 0;

    if (chartGastos) {
        chartGastos.destroy();
    }

    emptyState.classList.toggle('hidden', hayGastos);
    centerState.classList.toggle('hidden', !hayGastos);
    totalState.textContent = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(totalGastos);

    chartGastos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias.map(categoria => categoria.nombre),
            datasets: [{
                label: 'Total gastado',
                data: categorias.map(categoria => categoria.total),
                backgroundColor: categorias.map(categoria => categoria.color),
                borderColor: '#ffffff',
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        color: '#334155',
                        font: { family: 'Inter', size: 12, weight: '600' },
                        padding: 16
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    bodyFont: { family: 'Inter', size: 13 },
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { family: 'Inter', size: 13 },
                    callbacks: {
                        label: (context) => {
                            const valor = new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: 'ARS'
                            }).format(context.parsed || 0);
                            const porcentaje = totalGastos > 0
                                ? Math.round((Number(context.parsed || 0) / totalGastos) * 100)
                                : 0;

                            return `${context.label}: ${valor} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderResumenCategorias(categorias, formatter) {
    const summary = document.getElementById('category-summary');
    summary.innerHTML = '';

    categorias.forEach(categoria => {
        const item = document.createElement('div');
        const name = document.createElement('div');
        const left = document.createElement('span');
        const dot = document.createElement('span');
        const average = document.createElement('span');
        const meta = document.createElement('div');
        const count = document.createElement('span');
        const total = document.createElement('span');

        item.className = 'category-item';
        name.className = 'category-name';
        dot.className = 'category-dot';
        dot.style.background = categoria.color;
        meta.className = 'category-meta';

        left.append(dot, document.createTextNode(categoria.nombre));
        average.textContent = formatter.format(categoria.total);
        count.textContent = `${categoria.cantidad} gasto${categoria.cantidad === 1 ? '' : 's'}`;
        total.textContent = categoria.cantidad > 0 ? `Prom. ${formatter.format(categoria.promedio)}` : 'Sin gastos';

        name.append(left, average);
        meta.append(count, total);
        item.append(name, meta);
        summary.appendChild(item);
    });
}

function renderHistorial(movimientos, formatter) {
    const list = document.getElementById('movimientos-list');
    list.innerHTML = '';

    if (!movimientos.length) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'Todavía no hay movimientos registrados.';
        list.appendChild(empty);
        return;
    }

    movimientos.forEach(movimiento => {
        const tipo = movimiento.tipo.toLowerCase();
        const item = document.createElement('div');
        const main = document.createElement('div');
        const top = document.createElement('div');
        const badge = document.createElement('span');
        const category = document.createElement('span');
        const date = document.createElement('span');
        const desc = document.createElement('div');
        const amount = document.createElement('div');

        item.className = `movimiento-item ${tipo}`;
        main.className = 'movimiento-main';
        top.className = 'movimiento-top';
        badge.className = `movimiento-badge ${tipo}`;
        category.className = 'movimiento-category';
        date.className = 'movimiento-date';
        desc.className = 'movimiento-desc';
        amount.className = `movimiento-monto ${tipo}`;

        badge.textContent = movimiento.tipo;
        category.textContent = movimiento.categoria || 'Sin categoría';
        date.textContent = formatearFecha(movimiento.fecha);
        desc.textContent = movimiento.descripcion || 'Sin descripción';
        amount.textContent = `${tipo === 'ingreso' ? '+' : '-'} ${formatter.format(movimiento.monto)}`;

        top.append(badge, category, date);
        main.append(top, desc);
        item.append(main, amount);
        list.appendChild(item);
    });
}

function limitarFechasHastaHoy() {
    const hoy = obtenerFechaActualInput();
    document.getElementById('ingreso-fecha').max = hoy;
    document.getElementById('gasto-fecha').max = hoy;
}

function obtenerFechaActualInput() {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const local = new Date(hoy.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
}

function esFechaFutura(fecha) {
    return Boolean(fecha) && fecha > obtenerFechaActualInput();
}

function formatearFecha(fecha) {
    if (typeof fecha === 'string') {
        const soloFecha = fecha.slice(0, 10);
        const partes = soloFecha.split('-');

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(fecha));
}
