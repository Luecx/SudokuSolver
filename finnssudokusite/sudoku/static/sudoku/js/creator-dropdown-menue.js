const inputField = document.getElementById('inputField');
const dropdownMenu = document.getElementById('dropdownMenu');
const menuList = document.getElementById('menuList');

// Menü anzeigen, wenn das Eingabefeld fokussiert wird
inputField.addEventListener('focus', () => {
    dropdownMenu.style.display = 'block';
    filterMenu('');
});

// Menü ausblenden, wenn außerhalb geklickt wird
document.addEventListener('click', (event) => {
    if (!inputField.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
});

// Menü filtern bei Eingabe
inputField.addEventListener('input', (event) => {
    filterMenu(event.target.value);
});

function filterMenu(filterText) {
    const items = menuList.getElementsByTagName('li');
    const filter = filterText.trim().toLowerCase();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Für Checkbox-Eintrag: label-Text filtern
        if (item.querySelector('label')) {
            const labelText = item.querySelector('label').textContent.toLowerCase();
            item.style.display = (filter === '' || labelText.includes(filter)) ? '' : 'none';
        } else {
            item.style.display = (filter === '' || item.textContent.toLowerCase().includes(filter)) ? '' : 'none';
        }
    }
}

// Akkordeon-Item sichtbar machen und öffnen
function showAccordionItem(name) {
    // Namen zu gültiger ID umwandeln (Leerzeichen & Sonderzeichen ersetzen)
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-');
    const item = document.getElementById(`accordion-${safeName}`);
    if (!item) return;

    // Item sichtbar machen
    item.classList.remove('d-none');

    // Collapse-Element öffnen (Bootstrap 5)
    const collapse = item.querySelector('.accordion-collapse');
    if (collapse) {
        // Bootstrap Collapse API verwenden
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse, {toggle: false});
            bsCollapse.show();
        } else {
            // Fallback: einfach anzeigen
            collapse.classList.add('show');
        }
    }

    // Button als "expanded" kennzeichnen
    const btn = item.querySelector('.accordion-button');
    if (btn) {
        btn.classList.remove('collapsed');
        btn.setAttribute('aria-expanded', 'true');
    }
}

// Menüauswahl (Checkboxen und Listeneinträge)
menuList.addEventListener('click', (event) => {
    // Checkbox-Label
    if (event.target.matches('input[type="checkbox"]')) {
        const label = event.target.nextElementSibling.textContent.trim();
        if (event.target.checked) {
            inputField.value = label;
            dropdownMenu.style.display = 'none';
            showAccordionItem(label);
        }
        event.stopPropagation();
    }
    // Listeneintrag (ohne Checkbox)
    else if (
        event.target.matches('li.list-group-item-action') &&
        !event.target.querySelector('input[type="checkbox"]')
    ) {
        const name = event.target.textContent.trim();
        inputField.value = "";
        dropdownMenu.style.display = 'none';
        showAccordionItem(name);
    }
});
document.addEventListener('click', function(event) {
  if (event.target.closest('.delete-accordion-item')) {
    const btn = event.target.closest('.delete-accordion-item');
    const targetId = btn.getAttribute('data-target');
    const item = document.getElementById(targetId);
    if (item) {
      item.classList.add('d-none');
      // Optional: Collapse schließen, falls offen
      const collapse = item.querySelector('.accordion-collapse');
      if (collapse && typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse, {toggle: false});
        bsCollapse.hide();
      }
    }
  }
});

// Hilfsfunktion: Menüpunkt anhand Name finden
function getMenuItemByName(name) {
    return Array.from(document.querySelectorAll('#menuList .list-group-item'))
        .find(item => item.dataset.name === name);
}

