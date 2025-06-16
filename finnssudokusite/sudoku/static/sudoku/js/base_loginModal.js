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