// Configuración de Supabase (Reemplaza con tus credenciales de tu proyecto)
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let carrito = [];
let tasaBCV = 36.5; // Puedes sincronizarla dinámicamente o dejarla configurable

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si hay sesión activa
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        mostrarApp(session.user);
    }

    // Manejar Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            document.getElementById('login-error').innerText = 'Credenciales incorrectas o error de acceso.';
        } else {
            mostrarApp(data.user);
        }
    });

    // Manejar Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    });
});

async function mostrarApp(user) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-email-display').innerText = user.email;
    
    await cargarProductos();
}

async function cargarProductos() {
    const { data: productos, error } = await supabaseClient
        .from('productos') // Asegúrate de que tu tabla en Supabase se llame así
        .select('*');

    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (error) {
        grid.innerHTML = '<p>Error al cargar inventario.</p>';
        return;
    }

    productos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h4>${prod.nombre}</h4>
            <p>$${prod.precio_usd.toFixed(2)}</p>
            <p>Stock: ${prod.stock}</p>
        `;
        card.onclick = () => agregarAlCarrito(prod);
        grid.appendChild(card);
    });
}

function agregarAlCarrito(producto) {
    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const contenedor = document.getElementById('cart-items');
    contenedor.innerHTML = '';
    let totalUsd = 0;

    carrito.forEach(item => {
        totalUsd += item.precio_usd * item.cantidad;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `<span>${item.nombre} (x${item.cantidad})</span> <span>$${(item.precio_usd * item.cantidad).toFixed(2)}</span>`;
        contenedor.appendChild(div);
    });

    document.getElementById('total-usd').innerText = totalUsd.toFixed(2);
    document.getElementById('total-ves').innerText = (totalUsd * tasaBCV).toFixed(2);
}

function finalizarVenta(moneda) {
    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }
    alert(`Venta procesada exitosamente en ${moneda}. Inventario actualizado.`);
    carrito = [];
    actualizarCarritoUI();
}