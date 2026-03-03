(function(){
  var ITEMS_PER_PAGE = 6;

  function removeBlackActivatorImages(scope){
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.card-image img.activator, img.activator, .card-image img[src*="Black.png"], img[src*="Black.png"], img[src*="/7/71/Black.png"]').forEach(function(el){
      el.remove();
    });
  }

  removeBlackActivatorImages(document);

  // Add data-label attributes to table cells for responsive stacked layout
  function addTableDataLabels() {
    document.querySelectorAll('table').forEach(function(table) {
      var headers = [];
      table.querySelectorAll('thead th').forEach(function(th) {
        headers.push(th.textContent.trim());
      });
      if (headers.length === 0) return;
      table.querySelectorAll('tbody tr').forEach(function(tr) {
        tr.querySelectorAll('td').forEach(function(td, i) {
          if (headers[i] && !td.getAttribute('data-label')) {
            td.setAttribute('data-label', headers[i]);
          }
        });
      });
    });
  }

  // Force filters section to be: title left + select right, without background container
  function normalizeFiltersSection(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;

    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(title) {
      if ((title.textContent || '').trim().toLowerCase() !== 'filters') return;

      var section = title;
      while (section && section !== document.body) {
        if (section.querySelector && section.querySelector('.select-wrapper')) break;
        section = section.parentElement;
      }
      if (!section || section.dataset.filtersNormalized === '1') return;

      var selectWrapper = section.querySelector('.select-wrapper');
      if (!selectWrapper) return;
      var selectField = selectWrapper.closest('.input-field') || selectWrapper;

      section.dataset.filtersNormalized = '1';

      [section, section.querySelector('.card-panel'), section.querySelector('.card')].forEach(function(el) {
        if (!el) return;
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('border', 'none', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('padding', '0', 'important');
        el.style.setProperty('overflow', 'visible', 'important');
      });

      var ancestor = section;
      for (var i = 0; i < 5 && ancestor; i++) {
        ancestor.style.setProperty('overflow', 'visible', 'important');
        ancestor = ancestor.parentElement;
      }

      var headerRow = section.querySelector('.filters-inline-header');
      if (!headerRow) {
        headerRow = document.createElement('div');
        headerRow.className = 'filters-inline-header';
        headerRow.style.display = 'flex';
        headerRow.style.alignItems = 'center';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.gap = '12px';
        headerRow.style.width = '100%';
        headerRow.style.margin = '0 0 12px 0';
        section.insertBefore(headerRow, section.firstChild);
      }

      if (title.parentElement !== headerRow) {
        headerRow.appendChild(title);
      }
      if (selectField.parentElement !== headerRow) {
        headerRow.appendChild(selectField);
      }

      title.style.margin = '0';
      selectField.style.margin = '0';
      selectField.style.minWidth = '220px';
      selectField.style.maxWidth = '320px';
      selectField.style.flex = '0 0 auto';
    });
  }

  addTableDataLabels();
  normalizeFiltersSection(document);

  var observer = new MutationObserver(function(){
    addTableDataLabels();
    normalizeFiltersSection(document);
    removeBlackActivatorImages(document);

    document.querySelectorAll('.pagination, ul.pagination').forEach(function(pg){
      var container = pg.closest('.row, .container, section, div');
      var cards = container ? container.querySelectorAll('.card') : [];
      if(cards.length <= ITEMS_PER_PAGE){
        pg.style.display = 'none';
        if(pg.parentElement && pg.parentElement.children.length === 1){
          pg.parentElement.style.display = 'none';
        }
      } else {
        pg.style.display = '';
        if(pg.parentElement && pg.parentElement.children.length === 1){
          pg.parentElement.style.display = '';
        }
      }
    });

    document.querySelectorAll('.card .card-image img').forEach(function(img){
      img.style.cssText = 'display:block!important;position:static!important;width:auto!important;max-width:80%!important;height:auto!important;max-height:80%!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;float:none!important;';
    });
    document.querySelectorAll('.card .card-image').forEach(function(container){
      container.style.cssText += 'text-align:center!important;overflow:hidden!important;';
    });

    document.querySelectorAll('.card .card-action').forEach(function(action){
      if(action.querySelector('.btn-discover')) return;
      var card = action.closest('.card');
      if(!card) return;

      var overlay = document.createElement('div');
      overlay.className = 'discover-overlay';
      var title = card.querySelector('.card-content .card-title');
      var desc = card.querySelector('.card-content p');
      overlay.innerHTML =
        '<div class="discover-title">' + (title ? title.textContent : 'Promotion') + '</div>' +
        '<div class="discover-desc">' + (desc ? desc.textContent : 'No additional details available.') + '</div>' +
        '<button class="discover-close"><i class="material-icons" style="font-size:14px">close</i> Close</button>';
      card.appendChild(overlay);

      overlay.querySelector('.discover-close').addEventListener('click', function(e){
        e.stopPropagation();
        overlay.classList.remove('open');
      });

      var btn = document.createElement('a');
      btn.className = 'btn-discover';
      btn.innerHTML = '<i class="material-icons">visibility</i> Discover';
      btn.href = 'javascript:void(0)';
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('open');
      });
      action.appendChild(btn);
    });
  });

  observer.observe(document.body, {childList:true, subtree:true});

  requestAnimationFrame(function(){ removeBlackActivatorImages(document); });
  window.addEventListener('load', function(){ removeBlackActivatorImages(document); });
})();
