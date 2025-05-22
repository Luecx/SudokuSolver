export function initTableFilter({
                                    tableId,
                                    searchInputId,
                                    tagClass,
                                    tagAttribute,
                                    columns,
                                    rowsPerPage = 10,
                                }) {
    let currentSort = { key: null, ascending: true };
    let currentPage = 1;

    function getFilteredRows() {
        const search = (searchInputId ? document.getElementById(searchInputId)?.value : "").toLowerCase();
        const selectedTags = Array.from(document.querySelectorAll(`.${tagClass}:checked`)).map(cb =>
            cb.value.toLowerCase()
        );
        const rows = Array.from(document.querySelectorAll(`#${tableId} tbody tr`));
        return rows.filter(row => {
            const name = (row.dataset.name || "").toLowerCase();
            const rowTags = (row.getAttribute(tagAttribute) || "").toLowerCase();
            const matchesSearch = name.includes(search);
            const matchesTags = selectedTags.every(tag => rowTags.includes(tag));
            return matchesSearch && matchesTags;
        });
    }

    function sortRows(rows, key, asc) {
        rows.sort((a, b) => {
            let valA = a.dataset[key];
            let valB = b.dataset[key];

            if (!isNaN(parseFloat(valA))) {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            if (typeof valA === "string") {
                return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            return asc ? valA - valB : valB - valA;
        });
    }

    function renderPage(rows) {
        const start = (currentPage - 1) * rowsPerPage;
        const end = currentPage * rowsPerPage;
        const visibleRows = rows.slice(start, end);

        // Hide all rows initially
        rows.forEach(row => {
            row.style.display = "none";
            row.classList.remove("animated-row");
            row.style.animationDelay = "";
        });

        // Show and animate visible rows
        visibleRows.forEach((row, i) => {
            row.style.display = "";
            row.classList.add("animated-row");
            row.style.animationDelay = `${i * 15}ms`;
        });
    }



    function updatePaginationControls(totalPages) {
        const containerId = `${tableId}-pagination`;
        let pagination = document.getElementById(containerId);

        if (!pagination) {
            // Dynamically create pagination list if missing
            pagination = document.createElement("ul");
            pagination.className = "pagination justify-content-center mt-3";
            pagination.id = containerId;

            const wrapper = document.getElementById(tableId).closest(".table-responsive");
            if (wrapper) {
                const nav = document.createElement("nav");
                nav.appendChild(pagination);
                wrapper.after(nav);
            } else {
                console.warn("No wrapper found for pagination.");
                return;
            }
        }

        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = "page-item" + (i === currentPage ? " active" : "");
            const btn = document.createElement("button");
            btn.className = "page-link";
            btn.textContent = i;
            btn.onclick = () => {
                currentPage = i;
                applyFilters();
            };
            li.appendChild(btn);
            pagination.appendChild(li);
        }
    }

    function applyFilters() {
        const filtered = getFilteredRows();
        if (currentSort.key) {
            sortRows(filtered, currentSort.key, currentSort.ascending);
        }

        const tbody = document.querySelector(`#${tableId} tbody`);
        filtered.forEach(row => tbody.appendChild(row));

        const totalPages = Math.ceil(filtered.length / rowsPerPage);
        currentPage = Math.min(currentPage, totalPages || 1);
        document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => (row.style.display = "none"));
        renderPage(filtered);
        updatePaginationControls(totalPages);
    }

    function updateSortIndicators() {
        document.querySelectorAll(`#${tableId} .sort-indicator`).forEach(el => (el.innerText = ""));
        if (!currentSort.key) return;
        const th = document.querySelector(`#${tableId} th[data-key="${currentSort.key}"]`);
        const indicator = th?.querySelector(".sort-indicator");
        if (indicator) {
            indicator.innerText = currentSort.ascending ? " ▲" : " ▼";
        }
    }

    function sortBy(key) {
        if (currentSort.key === key) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.key = key;
            currentSort.ascending = true;
        }
        applyFilters();
        updateSortIndicators();
    }

    // ✅ Immediately run setup logic (no DOMContentLoaded)
    columns.forEach(col => {
        const th = document.querySelector(`#${tableId} th[data-key="${col}"]`);
        if (th) {
            th.style.cursor = "pointer";
            th.onclick = () => sortBy(col);
        }
    });

    if (searchInputId) {
        const input = document.getElementById(searchInputId);
        if (input) input.addEventListener("input", applyFilters);
    }

    document.querySelectorAll(`.${tagClass}`).forEach(cb => {
        cb.addEventListener("change", applyFilters);
    });

    applyFilters();
}
