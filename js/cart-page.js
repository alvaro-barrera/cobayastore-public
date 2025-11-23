(function(){
  function format(n){ return 'S/ ' + (Math.round(n * 100)/100).toFixed(2); }
  function render(){
    var tbody = document.querySelector('#cartTable tbody');
    if (!tbody) return;
    var items = window.CartAPI.readCart();
    tbody.innerHTML = '';
    var total = 0;
    items.forEach(function(it){
      var subtotal = (it.price||0) * (it.quantity||1);
      total += subtotal;
      var tr = document.createElement('tr');
      tr.innerHTML = '\n        <td>'+(it.storeName||it.storeId)+'</td>\n        <td>'+it.itemTitle+'</td>\n        <td class="text-end">'+format(it.price||0)+'</td>\n        <td class="text-center">\n          <div class="input-group input-group-sm">\n            <button class="btn btn-outline-secondary btn-qty" data-delta="-1">-</button>\n            <input class="form-control text-center qty-input" value="'+(it.quantity||1)+'" style="max-width:48px" />\n            <button class="btn btn-outline-secondary btn-qty" data-delta="1">+</button>\n          </div>\n        </td>\n        <td class="text-end">'+format(subtotal)+'</td>\n        <td class="text-end"><button class="btn btn-sm btn-outline-danger btn-remove">Quitar</button></td>\n      ';
      tr.querySelector('.btn-remove').addEventListener('click', function(){
        window.CartAPI.removeItem(it.storeId, it.itemId, it.itemType);
        render();
      });
      tr.querySelectorAll('.btn-qty').forEach(function(btn){
        btn.addEventListener('click', function(){
          var delta = parseInt(btn.getAttribute('data-delta'));
          var current = window.CartAPI.readCart();
          var idx = current.findIndex(function(x){ return x.storeId===it.storeId && x.itemId===it.itemId && x.itemType===it.itemType; });
          if (idx>=0){
            current[idx].quantity = Math.max(1, (current[idx].quantity||1) + delta);
            window.CartAPI.writeCart(current);
            render();
          }
        });
      });
      tbody.appendChild(tr);
    });
    var totalEl = document.getElementById('totalAmount');
    if (totalEl) totalEl.textContent = format(total);
  }

  document.getElementById('clearCart')?.addEventListener('click', function(){
    window.CartAPI.writeCart([]); render();
  });

  document.getElementById('checkoutBtn')?.addEventListener('click', function(){
    var items = window.CartAPI.readCart();
    if (!items.length){ alert('Tu carrito está vacío.'); return; }
    var order = {
      id: 'ord_' + Date.now(),
      createdAt: new Date().toISOString(),
      products: items.filter(function(x){ return x.itemType==='product'; }),
      services: items.filter(function(x){ return x.itemType==='service'; }),
      total: items.reduce(function(s,x){ return s + (x.price||0)*(x.quantity||1); }, 0)
    };
    var orders = JSON.parse(localStorage.getItem('orders')||'[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    window.CartAPI.writeCart([]);
    alert('¡Pedido creado! Puedes verlo en /admin');
    location.href = '/admin';
  });

  document.addEventListener('DOMContentLoaded', render);
})();
