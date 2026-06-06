const API_URL = "/api";
let chartGastos = null;

const categoriasBase = [
    { id: 1, nombre: 'Alimentación', color: '#2563eb' },
    { id: 2, nombre: 'Transporte', color: '#06b6d4' },
    { id: 3, nombre: 'Servicios', color: '#8b5cf6' },
    { id: 4, nombre: 'Entretenimiento', color: '#f59e0b' },
    { id: 5, nombre: 'Salud', color: '#10b981' },
    { id: 6, nombre: 'Educación', color: '#f43f5e' }
];

window.addEventListener('DOMContentLoaded', () => {
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

    actualizarDashboard();
}

document.getElementById('ingreso-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('ingreso-monto').value);
    const descripcion = document.getElementById('ingreso-desc').value.trim();
    const fecha = document.getElementById('ingreso-fecha').value;
    const idUsuario = parseInt(localStorage.getItem('userId'));

    try {
        const response = await fetch(`${API_URL}/ingresos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, monto, descripcion, fecha })
        });

        if (response.ok) {
            actualizarDashboard();
            e.target.reset();
        } else {
            alert("No se pudo guardar el ingreso. Verificá los campos.");
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

    try {
        const response = await fetch(`${API_URL}/gastos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, idCategoria, descripcion, monto, fecha })
        });

        if (response.ok) {
            actualizarDashboard();
            e.target.reset();
        } else {
            alert("No se pudo guardar el gasto. Verificá los campos.");
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
    } catch (error) {
        console.error("Error al conectar con el endpoint del dashboard:", error);
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
        .sort((a, b) => b.promedio - a.promedio);
}

function renderGrafico(categorias) {
    const ctx = document.getElementById('canvas-gastos').getContext('2d');
    const emptyState = document.getElementById('chart-empty');
    const hayGastos = categorias.some(categoria => categoria.promedio > 0);

    if (chartGastos) {
        chartGastos.destroy();
    }

    emptyState.classList.toggle('hidden', hayGastos);

    chartGastos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categorias.map(categoria => categoria.nombre),
            datasets: [{
                label: 'Promedio por gasto',
                data: categorias.map(categoria => categoria.promedio),
                backgroundColor: categorias.map(categoria => categoria.color),
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 44
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#475569',
                        font: { family: 'Inter', size: 12, weight: '600' }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        color: '#64748b',
                        callback: value => new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            maximumFractionDigits: 0
                        }).format(value)
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
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
                            }).format(context.parsed.y || 0);

                            return `Promedio: ${valor}`;
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
        average.textContent = formatter.format(categoria.promedio);
        count.textContent = `${categoria.cantidad} gasto${categoria.cantidad === 1 ? '' : 's'}`;
        total.textContent = `Total ${formatter.format(categoria.total)}`;

        name.append(left, average);
        meta.append(count, total);
        item.append(name, meta);
        summary.appendChild(item);
    });
}
