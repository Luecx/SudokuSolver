// Langueage setting on the TOP
if (typeof translations == "undefined") { // Wenn vergessen wird das lang-*.js script zu implementieren
    var translations = {};
}
Object.assign(translations, basetranslation);

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    applyLanguage(lang);
    updateActiveMenuItem(lang);
}

function applyLanguage(lang) {
    for (const id in translations) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = translations[id][lang];
    }
    document.documentElement.lang = lang;

    // MathJax neu rendern
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function updateActiveMenuItem(lang) {
    document.querySelectorAll('#languageDropdownMenu .dropdown-item').forEach(item => {
        if (item.getAttribute('data-lang') === lang) {
            item.classList.add('bg-primary', 'text-white');
        } else {
            item.classList.remove('bg-primary', 'text-white');
        }
    });
}

// Event Listener für alle Dropdown-Items
document.querySelectorAll('#languageDropdownMenu .dropdown-item').forEach(item => {
    item.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        setLanguage(lang);
    });
});

// Beim Laden der Seite: Sprache und aktives Menü-Item setzen
document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('language') || 'en';
    applyLanguage(lang);
    updateActiveMenuItem(lang);
});
