document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.calc-group').forEach(function(group){
    var btn = group.querySelector('.calc-btn');
    var input = group.querySelector('.calc-input');
    var result = group.parentElement ? group.parentElement.querySelector('.calc-result') : null;
    if (!btn || !input) return;
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
});
