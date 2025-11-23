(function(){
  function format(n){ return 'S/ ' + (Math.round(n * 100)/100).toFixed(2); }
  
  // Esperar a que SweetAlert2 esté disponible
  function waitForSwal(callback) {
    if (typeof Swal !== 'undefined') {
      callback();
    } else {
      setTimeout(function() {
        waitForSwal(callback);
      }, 100);
    }
  }
  
  // Función para inicializar calculadoras en el modal
  function initCalculators() {
    document.querySelectorAll('.calc-group').forEach(function(group){
      var btn = group.querySelector('.calc-btn');
      var input = group.querySelector('.calc-input');
      var result = group.parentElement ? group.parentElement.querySelector('.calc-result') : null;
      if (!btn || !input) return;
      
      // Remover listeners anteriores para evitar duplicados
      btn.replaceWith(btn.cloneNode(true));
      input.replaceWith(input.cloneNode(true));
      
      // Obtener nuevos elementos
      btn = group.querySelector('.calc-btn');
      input = group.querySelector('.calc-input');
      
      btn.addEventListener('click', function(){
        var type = group.getAttribute('data-calc-type');
        var priceUnit = parseFloat(group.getAttribute('data-price-unit') || '0');
        var baseAmount = parseFloat(group.getAttribute('data-base-amount') || '1');
        var extraPerCm = parseFloat(group.getAttribute('data-extra-per-cm') || '0');
        var val = parseFloat(input.value || '0');
        var price = priceUnit;
        
        if (type === 'grams') price = (priceUnit / baseAmount) * val;
        else if (type === 'liters') price = priceUnit * val;
        else if (type === 'custom_cm') price = priceUnit + (extraPerCm * val);
        
        if (result) result.textContent = 'Precio estimado: S/ ' + price.toFixed(2);
      });
    });
  }
  
  function render(){
    console.log('🛒 Renderizando carrito...');
    
    var cartContent = document.getElementById('cartContent');
    if (!cartContent) {
      console.error('❌ No se encontró el elemento cartContent');
      return;
    }
    
    var items = window.CartAPI.readCart();
    console.log('📦 Items en carrito:', items);
    
    // Obtener el ID de la tienda actual desde el modal
    var modal = document.getElementById('cartModal');
    var currentStoreId = modal ? modal.getAttribute('data-current-store') : null;
    console.log('🏪 Tienda actual:', currentStoreId);
    
    // Filtrar por tienda si se especifica una
    if (currentStoreId) {
      items = items.filter(function(item) {
        return item.storeId === currentStoreId;
      });
      console.log('📦 Items filtrados para tienda:', items);
    }
    
    if (items.length === 0) {
      var emptyMessage = currentStoreId ? 
        `Tu carrito está vacío para esta tienda. Agrega productos de esta tienda para comenzar.` :
        'Tu carrito está vacío. Agrega productos de nuestras tiendas para comenzar.';
        
      console.log('📭 Carrito vacío, mostrando mensaje:', emptyMessage);
      
      cartContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x fs-1 text-muted mb-3"></i>
          <h4 class="text-muted">Tu carrito está vacío</h4>
          <p class="text-muted">${emptyMessage}</p>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
            <i class="bi bi-shop me-2"></i> ${currentStoreId ? 'Ver productos' : 'Ver tiendas'}
          </button>
        </div>
      `;
      return;
    }
    
    console.log('📊 Renderizando', items.length, 'productos');
    
    // Agrupar items por tienda
    var stores = {};
    var grandTotal = 0;
    
    items.forEach(function(item){
      var subtotal = item.cotizable ? 0 : (item.price||0) * (item.quantity||1);
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
    
    console.log('🏪 Tiendas agrupadas:', Object.keys(stores));
    
    var html = '<div class="row g-0 h-100">';
    
    // Columna principal con tiendas
    html += '<div class="col-lg-8 border-end">';
    html += '<div class="p-3" style="max-height: 500px; overflow-y: auto;">';
    
    // Si estamos en una tienda específica, mostrar header diferente
    if (currentStoreId && stores[currentStoreId]) {
      var store = stores[currentStoreId];
      html += `
        <div class="alert alert-info mb-3">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Carrito de ${store.storeName}</strong> - Solo se muestran productos de esta tienda
        </div>
      `;
    }
    
    Object.keys(stores).forEach(function(storeId){
      var store = stores[storeId];
      
      html += `
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
            <div>
              <h6 class="mb-0">
                <i class="bi bi-shop me-2"></i>${store.storeName}
              </h6>
              <small class="text-muted">${store.items.length} productos</small>
            </div>
            <div>
              ${!currentStoreId ? `
                <a href="/tienda/${storeId}" class="btn btn-sm btn-outline-primary me-2">
                  <i class="bi bi-arrow-left me-1"></i> Tienda
                </a>
              ` : ''}
              <button class="btn btn-sm btn-outline-danger" onclick="clearStoreCart('${storeId}')">
                <i class="bi bi-trash me-1"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-2">
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th style="font-size: 0.85rem;">Producto</th>
                    <th class="text-end" style="font-size: 0.85rem;">Precio</th>
                    <th class="text-center" style="width:80px; font-size: 0.85rem;">Cant.</th>
                    <th class="text-end" style="font-size: 0.85rem;">Subtotal</th>
                    <th class="text-center" style="width:40px;"></th>
                  </tr>
                </thead>
                <tbody>
      `;
      
      // Separar items cotizables y con precio
      var pricedItems = store.items.filter(item => !item.cotizable);
      var quotableItems = store.items.filter(item => item.cotizable);
      
      // Renderizar items con precio
      if (pricedItems.length > 0) {
        html += `
          <tr class="table-light">
            <td colspan="5" class="text-center fw-semibold py-2" style="font-size: 0.9rem;">
              <i class="bi bi-cart3 me-2"></i>Productos y Servicios con Precio
            </td>
          </tr>
        `;
        
        pricedItems.forEach(function(item){
          var subtotal = (item.price||0) * (item.quantity||1);
          
          html += `
            <tr>
              <td style="font-size: 0.85rem;">
                <div class="d-flex align-items-center">
                  <div class="me-2">
                    <i class="bi bi-box text-muted"></i>
                  </div>
                  <div>
                    <div class="fw-semibold">${item.itemTitle}</div>
                    <small class="text-muted">${item.itemType === 'product' ? 'Producto' : 'Servicio'}</small>
                  </div>
                </div>
              </td>
              <td class="text-end" style="font-size: 0.85rem;">
                ${format(item.price||0)}
              </td>
              <td class="text-center">
                <div class="input-group input-group-sm">
                  <button class="btn btn-outline-secondary btn-qty" data-delta="-1" 
                          data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">-</button>
                  <input class="form-control text-center qty-input" value="${item.quantity||1}" style="max-width:40px; font-size: 0.8rem;" readonly />
                  <button class="btn btn-outline-secondary btn-qty" data-delta="1" 
                          data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">+</button>
                </div>
              </td>
              <td class="text-end fw-semibold" style="font-size: 0.85rem;">
                ${format(subtotal)}
              </td>
              <td class="text-center">
                <button class="btn btn-sm btn-outline-danger btn-remove" 
                        data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
          
          // Agregar calculadora si el producto tiene una
          if (item.calculator && item.calculator.enabled) {
            html += `
              <tr>
                <td colspan="5" style="font-size: 0.8rem; padding: 8px 4px;">
                  <div class="d-flex align-items-center gap-2">
                  <small class="text-muted">Calculadora:</small>
                  <div class="input-group input-group-sm calc-group"
                       data-calc-type="${item.unit === 'L' ? 'liters' : (item.unit === 'g' ? 'grams' : 'flat')}"
                       data-price-unit="${item.price_unit || item.price}"
                       data-base-amount="${item.unit === 'g' ? 20 : 1}"
                       data-extra-per-cm="0">
                    <input type="number" class="form-control calc-input" 
                           placeholder="${item.calculator.unit_hint || 'Cantidad'}" 
                           min="0" step="any" style="max-width: 80px; font-size: 0.75rem;" />
                    <button class="btn btn-outline-primary calc-btn" type="button" style="font-size: 0.75rem;">Calcular</button>
                  </div>
                  <small class="text-muted calc-result"></small>
                </div>
              </td>
            </tr>
          `;
          }
        });
      }
      
      // Renderizar items cotizables
      if (quotableItems.length > 0) {
        html += `
          <tr class="table-warning">
            <td colspan="5" class="text-center fw-semibold py-2" style="font-size: 0.9rem;">
              <i class="bi bi-clipboard-check me-2"></i>Productos y Servicios por Cotizar
            </td>
          </tr>
        `;
        
        quotableItems.forEach(function(item){
          html += `
            <tr>
              <td style="font-size: 0.85rem;">
                <div class="d-flex align-items-center">
                  <div class="me-2">
                    <i class="bi bi-clipboard2 text-warning"></i>
                  </div>
                  <div>
                    <div class="fw-semibold">${item.itemTitle}</div>
                    <small class="text-muted">${item.itemType === 'product' ? 'Producto' : 'Servicio'}</small>
                    <span class="badge bg-warning ms-2">Cotizable</span>
                  </div>
                </div>
              </td>
              <td class="text-end" style="font-size: 0.85rem;">
                <span class="text-warning fw-semibold">Cotizar</span>
              </td>
              <td class="text-center">
                <span class="badge bg-info text-white" style="font-size: 0.8rem;">
                  <i class="bi bi-clipboard-check me-1"></i>Por cotizar
                </span>
              </td>
              <td class="text-end fw-semibold" style="font-size: 0.85rem;">
                <span class="text-warning">Cotizar</span>
              </td>
              <td class="text-center">
                <button class="btn btn-sm btn-outline-danger btn-remove" 
                        data-store-id="${item.storeId}" data-item-id="${item.itemId}" data-item-type="${item.itemType}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
        });
      }
      
      html += `
                </tbody>
              </table>
            </div>
            <div class="border-top pt-2 mt-2">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold" style="font-size: 0.9rem;">Subtotal ${store.storeName}:</span>
                <span class="fw-bold text-primary" style="font-size: 0.9rem;">${format(store.subtotal)}</span>
              </div>
              ${quotableItems.length > 0 ? `
                <div class="alert alert-warning mt-2 mb-0 py-2" style="font-size: 0.8rem;">
                  <i class="bi bi-info-circle me-1"></i>
                  Hay ${quotableItems.length} item(s) por cotizar. El precio no está incluido en el subtotal.
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>'; // Cierra columna principal
    
    // Columna lateral con resumen
    html += '<div class="col-lg-4">';
    html += '<div class="p-3 bg-light h-100 d-flex flex-column">';
    html += `
      <h6 class="mb-3">
        <i class="bi bi-receipt me-2"></i> Resumen
      </h6>
      
      <div class="mb-3">
        <small class="text-muted">Tiendas</small>
        <div class="fw-bold">${Object.keys(stores).length} tiendas</div>
      </div>
      
      <div class="mb-3">
        <small class="text-muted">Total productos</small>
        <div class="fw-bold">${items.reduce((sum, item) => sum + (item.quantity||1), 0)} unidades</div>
      </div>
      
      ${currentStoreId ? `
        <div class="alert alert-warning py-2 mb-3" style="font-size: 0.8rem;">
          <i class="bi bi-info-circle me-1"></i>
          Solo se muestran productos de esta tienda. Para ver todos los productos, abre el carrito desde otra página.
        </div>
      ` : ''}
      
      ${items.some(item => item.cotizable) ? `
        <div class="alert alert-warning py-2 mb-3" style="font-size: 0.8rem;">
          <i class="bi bi-calculator me-1"></i>
          Hay productos cotizables en tu carrito. El precio total no incluye estos productos.
        </div>
      ` : ''}
      
      <hr>
      
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <span class="h6">Total</span>
          <span class="h6 text-primary" id="totalAmount">${format(grandTotal)}</span>
        </div>
      </div>
      
      <div class="mt-auto">
        <div class="alert alert-info py-2 mb-3" style="font-size: 0.8rem;">
          <i class="bi bi-info-circle me-1"></i>
          No se realizará ningún cobro. Este proceso genera una orden.
        </div>
      </div>
    `;
    
    html += '</div></div>'; // Cierra columna lateral
    html += '</div>'; // Cierra row
    
    console.log('✅ HTML generado, inserting into cartContent');
    cartContent.innerHTML = html;
    
    // Inicializar calculadoras después de renderizar
    setTimeout(function() {
      console.log('🧮 Inicializando calculadoras...');
      initCalculators();
    }, 100);
    
    // Agregar event listeners
    console.log('🎧 Agregando event listeners...');
    addEventListeners();
    
    console.log('🎉 Renderización completada');
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
  }
  
  // Función global para vaciar carrito de una tienda específica
  window.clearStoreCart = function(storeId){
    waitForSwal(function(){
      Swal.fire({
        title: '¿Vaciar tienda?',
        html: `<div class="text-center">
                  <i class="bi bi-shop fs-1 text-danger mb-3"></i>
                  <p class="mb-0">¿Estás seguro de que quieres vaciar todos los productos de esta tienda?</p>
                </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash me-2"></i>Sí, vaciar tienda',
        cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          var current = window.CartAPI.readCart();
          var filtered = current.filter(function(item){ 
            return item.storeId !== storeId; 
          });
          window.CartAPI.writeCart(filtered);
          render();
          
          // Mostrar confirmación
          Swal.fire({
            title: '¡Tienda vaciada!',
            html: `<div class="text-center">
                      <i class="bi bi-check-circle fs-1 text-success mb-3"></i>
                      <p class="mb-0">Los productos de esta tienda han sido eliminados del carrito.</p>
                    </div>`,
            icon: 'success',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
        }
      });
    });
  };
  
  // Inicializar event listeners cuando el DOM esté listo
  function initEventListeners() {
    // Botón de vaciar carrito
    var clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
      // Remover listeners anteriores
      clearCartBtn.replaceWith(clearCartBtn.cloneNode(true));
      clearCartBtn = document.getElementById('clearCart');
      
      clearCartBtn.addEventListener('click', function(){
        waitForSwal(function(){
          Swal.fire({
            title: '¿Vaciar carrito completo?',
            html: `<div class="text-center">
                      <i class="bi bi-cart-x fs-1 text-danger mb-3"></i>
                      <p class="mb-0">¿Estás seguro de que quieres vaciar todo el carrito?</p>
                      <small class="text-muted">Se eliminarán todos los productos de todas las tiendas</small>
                    </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash me-2"></i>Sí, vaciar todo',
            cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
              window.CartAPI.writeCart([]); 
              render();
              
              // Mostrar confirmación
              Swal.fire({
                title: '¡Carrito vaciado!',
                html: `<div class="text-center">
                          <i class="bi bi-check-circle fs-1 text-success mb-3"></i>
                          <p class="mb-0">Todos los productos han sido eliminados del carrito.</p>
                        </div>`,
                icon: 'success',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false
              });
            }
          });
        });
      });
    }
    
    // Botón de checkout
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      // Remover listeners anteriores
      checkoutBtn.replaceWith(checkoutBtn.cloneNode(true));
      checkoutBtn = document.getElementById('checkoutBtn');
      
      checkoutBtn.addEventListener('click', function(){
        waitForSwal(function(){
          var items = window.CartAPI.readCart();
          if (!items.length){ 
            Swal.fire({
              title: 'Carrito vacío',
              html: `<div class="text-center">
                        <i class="bi bi-cart-x fs-1 text-warning mb-3"></i>
                        <p class="mb-0">Tu carrito está vacío. Agrega productos antes de realizar el pedido.</p>
                      </div>`,
              icon: 'warning',
              confirmButtonColor: '#0077BE',
              confirmButtonText: '<i class="bi bi-shop me-2"></i>Ver tiendas'
            });
            return; 
          }
          
          Swal.fire({
            title: '¿Confirmar pedido?',
            html: `<div class="text-center">
                      <i class="bi bi-receipt fs-1 text-primary mb-3"></i>
                      <p class="mb-2">¿Estás seguro de que quieres realizar este pedido?</p>
                      <div class="text-start">
                        <strong>Resumen del pedido:</strong><br>
                        • ${Object.keys(items.reduce((acc, item) => {
                            acc[item.storeId] = true;
                            return acc;
                          }, {})).length} tiendas<br>
                        • ${items.reduce((sum, item) => sum + (item.quantity||1), 0)} productos<br>
                        • Total: ${format(items.reduce((s,x) => s + (x.price||0)*(x.quantity||1), 0))}
                      </div>
                    </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0077BE',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-check-circle me-2"></i>Confirmar pedido',
            cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
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
              
              // Cerrar modal y mostrar éxito
              var modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
              modal.hide();
              
              setTimeout(function(){
                Swal.fire({
                  title: '¡Pedido creado!',
                  html: `<div class="text-center">
                            <i class="bi bi-check-circle fs-1 text-success mb-3"></i>
                            <p class="mb-0">Tu pedido ha sido creado exitosamente.</p>
                            <small class="text-muted">Puedes verlo en el panel de administración</small>
                          </div>`,
                  icon: 'success',
                  confirmButtonColor: '#0077BE',
                  confirmButtonText: '<i class="bi bi-speedometer2 me-2"></i>Ver admin'
                }).then(() => {
                  location.href = '/admin';
                });
              }, 500);
            }
          });
        });
      });
    }
  }
  
  // Inicializar cuando el DOM esté listo
  function init() {
    console.log('🚀 Inicializando script del carrito modal...');
    
    // Asignar event listeners a los botones
    console.log('🎧 Asignando event listeners a botones...');
    initEventListeners();
    
    // Asignar evento al modal para renderizar cuando se abre
    var modal = document.getElementById('cartModal');
    if (modal) {
      console.log('📦 Modal encontrado, asignando evento show.bs.modal');
      modal.addEventListener('show.bs.modal', function() {
        console.log('👂 Evento show.bs.modal disparado');
        render();
      });
      console.log('✅ Evento show.bs.modal asignado correctamente');
    } else {
      console.error('❌ No se encontró el modal con ID cartModal');
    }
    
    console.log('🎉 Inicialización completada');
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
