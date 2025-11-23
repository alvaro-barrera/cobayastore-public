(function(){
  function format(n){ return 'S/ ' + (Math.round(n * 100)/100).toFixed(2); }
  
  function render(){
    var cartContent = document.getElementById('cartContent');
    if (!cartContent) return;
    
    var items = window.CartAPI.readCart();
    
    if (items.length === 0) {
      cartContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x fs-1 text-muted mb-3"></i>
          <h3 class="text-muted">Tu carrito está vacío</h3>
          <p class="text-muted">Agrega productos de nuestras tiendas para comenzar</p>
          <a href="/tienda" class="btn btn-primary">
            <i class="bi bi-shop me-2"></i> Ver Tiendas
          </a>
        </div>
      `;
      return;
    }
    
    // Agrupar items por tienda
    var stores = {};
    var grandTotal = 0;
    
    items.forEach(function(item){
      var subtotal = (item.price||0) * (item.quantity||1);
      grandTotal += subtotal;
      
      if (!stores[item.storeId]) {
        stores[item.storeId] = {
          storeId: item.storeId,
          storeName: item.storeName || item.storeId,
          items: [],
          subtotal: 0
        };
      }
      
      stores[item.storeId].items.push(item);
      stores[item.storeId].subtotal += subtotal;
    });
    
    var html = '<div class="row g-4">';
    
    // Columna principal con tiendas
    html += '<div class="col-lg-8">';
    
    Object.keys(stores).forEach(function(storeId){
      var store = stores[storeId];
      
      html += `
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">
                <i class="bi bi-shop me-2"></i>${store.storeName}
              </h5>
              <small class="text-muted">${store.items.length} productos</small>
            </div>
            <div>
              <a href="/tienda/${storeId}" class="btn btn-sm btn-outline-primary me-2">
                <i class="bi bi-arrow-left me-1"></i> Volver a tienda
              </a>
              <button class="btn btn-sm btn-outline-danger" onclick="clearStoreCart('${storeId}')">
                <i class="bi bi-trash me-1"></i> Vaciar tienda
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-end">Precio</th>
                    <th class="text-center" style="width:120px">Cant.</th>
                    <th class="text-end">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
      `;
      
      store.items.forEach(function(item){
        var subtotal = (item.price||0) * (item.quantity||1);
        
        html += `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <div class="me-3">
                  <i class="bi bi-box fs-4 text-muted"></i>
                </div>
                <div>
                  <div class="fw-semibold">${item.itemTitle}</div>
                  <small class="text-muted">${item.itemType === 'product' ? 'Producto' : 'Servicio'}</small>
                </div>
              </div>
            </td>
            <td class="text-end">${format(item.price||0)}</td>
            <td class="text-center">
              <div class="input-group input-group-sm">
                <button class="btn btn-outline-secondary btn-qty" data-delta="-1" 
                        data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">-</button>
                <input class="form-control text-center qty-input" value="${item.quantity||1}" style="max-width:48px" readonly />
                <button class="btn btn-outline-secondary btn-qty" data-delta="1" 
                        data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">+</button>
              </div>
            </td>
            <td class="text-end fw-semibold">${format(subtotal)}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger btn-remove" 
                      data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
      
      html += `
                </tbody>
              </table>
            </div>
            <div class="border-top pt-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold">Subtotal ${store.storeName}:</span>
                <span class="fw-bold text-primary">${format(store.subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Columna lateral con resumen
    html += '<div class="col-lg-4">';
    html += `
      <div class="card border-0 shadow-sm position-sticky" style="top: 20px;">
        <div class="card-body">
          <h5 class="card-title mb-3">
            <i class="bi bi-receipt me-2"></i> Resumen del Pedido
          </h5>
          
          <div class="mb-3">
            <small class="text-muted">Tiendas</small>
            <div class="fw-bold">${Object.keys(stores).length} tiendas</div>
          </div>
          
          <div class="mb-3">
            <small class="text-muted">Total de productos</small>
            <div class="fw-bold">${items.reduce((sum, item) => sum + (item.quantity||1), 0)} unidades</div>
          </div>
          
          <hr>
          
          <div class="d-flex justify-content-between mb-3">
            <span class="h5">Total</span>
            <span class="h5 text-primary" id="totalAmount">${format(grandTotal)}</span>
          </div>
          
          <div class="d-grid gap-2">
            <button class="btn btn-primary" id="checkoutBtn">
              <i class="bi bi-check-circle me-2"></i> Realizar Pedido
            </button>
            <button class="btn btn-outline-danger" id="clearCart">
              <i class="bi bi-trash me-2"></i> Vaciar Carrito
            </button>
            <a href="/tienda" class="btn btn-outline-secondary">
              <i class="bi bi-shop me-2"></i> Seguir Comprando
            </a>
          </div>
          
          <div class="mt-3">
            <small class="text-muted">
              <i class="bi bi-info-circle me-1"></i>
              No se realizará ningún cobro. Este es un flujo MVP que genera una orden local para el panel de administración.
            </small>
          </div>
        </div>
      </div>
    `;
    
    html += '</div>'; // Cierra col-lg-4
    html += '</div>'; // Cierra row
    
    cartContent.innerHTML = html;
    
    // Agregar event listeners
    addEventListeners();
  }
  
  function addEventListeners(){
    // Botones de cantidad
    document.querySelectorAll('.btn-qty').forEach(function(btn){
      btn.addEventListener('click', function(){
        var delta = parseInt(btn.getAttribute('data-delta'));
        var storeId = btn.getAttribute('data-store-id');
        var itemId = btn.getAttribute('data-item-id');
        var itemType = btn.getAttribute('data-item-type');
        
        var current = window.CartAPI.readCart();
        var idx = current.findIndex(function(x){ 
          return x.storeId===storeId && x.itemId===itemId && x.itemType===itemType; 
        });
        
        if (idx>=0){
          current[idx].quantity = Math.max(1, (current[idx].quantity||1) + delta);
          window.CartAPI.writeCart(current);
          render();
        }
      });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-remove').forEach(function(btn){
      btn.addEventListener('click', function(){
        var storeId = btn.getAttribute('data-store-id');
        var itemId = btn.getAttribute('data-item-id');
        var itemType = btn.getAttribute('data-item-type');
        
        window.CartAPI.removeItem(storeId, itemId, itemType);
        render();
      });
    });
    
    // Botón de vaciar carrito
    document.getElementById('clearCart')?.addEventListener('click', function(){
      if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        window.CartAPI.writeCart([]); 
        render();
      }
    });
    
    // Botón de checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', function(){
      var items = window.CartAPI.readCart();
      if (!items.length){ 
        alert('Tu carrito está vacío.'); 
        return; 
      }
      
      var order = {
        id: 'ord_' + Date.now(),
        createdAt: new Date().toISOString(),
        stores: {},
        products: items.filter(function(x){ return x.itemType==='product'; }),
        services: items.filter(function(x){ return x.itemType==='service'; }),
        total: items.reduce(function(s,x){ return s + (x.price||0)*(x.quantity||1); }, 0)
      };
      
      // Agrupar por tiendas para el pedido
      items.forEach(function(item){
        if (!order.stores[item.storeId]) {
          order.stores[item.storeId] = {
            storeName: item.storeName || item.storeId,
            items: []
          };
        }
        order.stores[item.storeId].items.push(item);
      });
      
      var orders = JSON.parse(localStorage.getItem('orders')||'[]');
      orders.unshift(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      window.CartAPI.writeCart([]);
      alert('¡Pedido creado! Puedes verlo en /admin');
      location.href = '/admin';
    });
  }
  
  // Función global para vaciar carrito de una tienda específica
  window.clearStoreCart = function(storeId){
    if (confirm('¿Estás seguro de que quieres vaciar los productos de esta tienda?')) {
      var current = window.CartAPI.readCart();
      var filtered = current.filter(function(item){ 
        return item.storeId !== storeId; 
      });
      window.CartAPI.writeCart(filtered);
      render();
    }
  };
  
  document.addEventListener('DOMContentLoaded', render);
})();
