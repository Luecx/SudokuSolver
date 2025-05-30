function openModalWithContent(url) {
    const container = document.getElementById('modalContentContainer');
    const modalDialog = document.querySelector('#loginModal .modal-dialog');
    modalDialog.className = 'modal-dialog modal-dialog-centered';

    fetch(url)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = "<div class='alert alert-danger'>Fehler beim Laden des Inhalts.</div>";
            console.error("Modal-Error: ", error);
        });
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