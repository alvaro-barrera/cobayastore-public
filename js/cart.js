(function(){
  var STORAGE_KEY = 'cart';
  function readCart(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }
  function writeCart(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function addItem(payload){
    var items = readCart();
    // merge by store+item id
    var idx = items.findIndex(function(it){ return it.storeId===payload.storeId && it.itemId===payload.itemId && it.itemType===payload.itemType; });
    if (idx>=0){ items[idx].quantity = (items[idx].quantity||1) + 1; }
    else { payload.quantity = payload.quantity||1; items.push(payload); }
    writeCart(items);
    toast('Añadido al carrito');
    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('cartUpdated'));
  }
  function removeItem(storeId, itemId, itemType){
    var items = readCart().filter(function(it){ return !(it.storeId===storeId && it.itemId===itemId && it.itemType===itemType); });
    writeCart(items);
    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('cartUpdated'));
  }
  function toast(msg){
    if (!document.body) return;
    var el = document.createElement('div');
    el.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success shadow';
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2000);
  }

  // Bind add-to-cart buttons
  document.addEventListener('click', function(e){
    var t = e.target;
    if (!(t instanceof HTMLElement)) return;
    var btn = t.closest('.add-to-cart');
    if (!btn) return;
    var ds = btn.dataset;
    
    // Parse calculator data if exists
    var calculator = null;
    if (ds.itemCalculator && ds.itemCalculator !== '') {
      try {
        calculator = JSON.parse(ds.itemCalculator);
      } catch (e) {
        calculator = null;
      }
    }
    
    addItem({
      storeId: ds.storeId,
      storeName: ds.storeName,
      itemId: ds.itemId,
      itemTitle: ds.itemTitle,
      price: parseFloat(ds.itemPrice||'0'),
      itemType: ds.itemType,
      unit: ds.itemUnit,
      price_unit: parseFloat(ds.itemPriceUnit || ds.itemPrice || '0'),
      cotizable: ds.itemCotizable === 'true',
      calculator: calculator
    });
  });

  // Expose for carrito page
  window.CartAPI = { readCart, writeCart, addItem, removeItem };
})();
