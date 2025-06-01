function openLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function switchModalContent(url, size = null) {
    const container = document.getElementById('modalContentContainer');
    const modalDialog = document.querySelector('#loginModal .modal-dialog');
    const modalContent = document.querySelector('#loginModal .modal-content');
    const modalBody = document.querySelector('#loginModal .modal-body');
    const sizeMap = {
        'S': 'modal-sm',
        'L': 'modal-lg',
        'XL': '.modal-xl',
    };

    const targetClass = sizeMap[size] || '';
    modalBody.classList.add('fade-out');
    setTimeout(() => {
        modalDialog.className = 'modal-dialog modal-dialog-centered ' + targetClass;

        fetch(url)
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                modalBody.classList.remove('fade-out');
            })
            .catch(error => {
                container.innerHTML = "<div class='alert alert-danger'>Fehler beim Laden des Inhalts.</div>";
                console.error("Modal-Error: ", error);
                modalBody.classList.remove('fade-out');
            });
    }, 500);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const langCode = this.getAttribute('data-lang');
        document.getElementById('languageInput').value = langCode;
        document.getElementById('languageForm').submit();
    });
});
// AJAX-Formularverarbeitung im Modal
document.addEventListener('submit', function (e) {
    const form = e.target;
    if (form.closest('#loginModal')) {
        e.preventDefault();

        const url = form.action;
        const method = form.method.toUpperCase();
        const formData = new FormData(form);

        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.text())
        .then(html => {
            try {
                const data = JSON.parse(html);
                if (data.success) {
                    const modalEl = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modalEl.hide();
                    if (data.redirect_url) {
                        location.assign(data.redirect_url);
                    } else {
                        location.reload();
                    }
                    return;
                }
            } catch (e) {
                // kein JSON, vermutlich reguläres HTML
            }
            const container = document.getElementById('modalContentContainer');
            container.innerHTML = html;
        })
        .catch(error => {
            console.error("Fehler beim Senden des Modal-Formulars:", error);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('#loginModal form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            fetch(loginForm.action, {
                method: loginForm.method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (response.redirected) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (modal) modal.hide();
                    window.location.href = response.url;
                } else {
                    return response.text().then(html => {
                        document.getElementById('modalContentContainer').innerHTML = html;
                    });
                }
            });
        });
    }
});