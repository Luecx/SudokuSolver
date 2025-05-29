/**
 * @file table_filter.js
 * @description
 * Dynamic table filtering, sorting, and pagination utility.
 *
 * Enables:
 * - Text search filtering by row name
 * - Tag-based checkbox filtering (with AND logic)
 * - Clickable header sorting (numeric/string-aware)
 * - Animated row rendering
 * - Dynamic pagination
 *
 * Usage:
 * ```js
 * initTableFilter({
 *   tableId: "my-table",
 *   searchInputId: "search-bar",
 *   tagClass: "tag-checkbox",
 *   tagAttribute: "data-tags",
 *   columns: ["name", "difficulty", "rating"],
 *   rowsPerPage: 10
 * });
 * ```
 */

/**
 * Initializes interactive filtering and sorting for an HTML table.
 *
 * @param {Object} config
 * @param {string} config.tableId - ID of the table (must include <tbody> and <th data-key>).
 * @param {string} config.searchInputId - ID of the text input used for search (optional).
 * @param {string} config.tagClass - Class name for filter checkboxes.
 * @param {string} config.tagAttribute - Row attribute holding tags (e.g. "data-tags").
 * @param {string[]} config.columns - Column keys used for sorting (must match data-key attributes).
 * @param {number} [config.rowsPerPage=10] - Number of rows to show per page.
 */
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

    /**
     * Returns all rows that match search input and selected tag filters.
     * @returns {HTMLTableRowElement[]}
     */
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

    /**
     * Sorts rows in-place by a given key and direction.
     * @param {HTMLElement[]} rows
     * @param {string} key - data-* attribute to sort by
     * @param {boolean} asc - True for ascending, false for descending
     */
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

    /**
     * Displays only the visible rows for the current page, with animation.
     * @param {HTMLElement[]} rows
     */
    function renderPage(rows) {
        const start = (currentPage - 1) * rowsPerPage;
        const end = currentPage * rowsPerPage;
        const visibleRows = rows.slice(start, end);

        rows.forEach(row => {
            row.style.display = "none";
            row.classList.remove("animated-row");
            row.style.animationDelay = "";
        });

        visibleRows.forEach((row, i) => {
            row.style.display = "";
            row.classList.add("animated-row");
            row.style.animationDelay = `${i * 15}ms`;
        });
    }

    /**
     * Renders pagination buttons below the table.
     * @param {number} totalPages
     */
    function updatePaginationControls(totalPages) {
        const containerId = `${tableId}-pagination`;
        let pagination = document.getElementById(containerId);

        if (!pagination) {
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

    /**
     * Applies all filters: search, tag, sort, pagination.
     */
    function applyFilters() {
        const filtered = getFilteredRows();

        if (currentSort.key) {
            sortRows(filtered, currentSort.key, currentSort.ascending);
        }

        const tbody = document.querySelector(`#${tableId} tbody`);
        filtered.forEach(row => tbody.appendChild(row)); // reinsert in sorted order

        const totalPages = Math.ceil(filtered.length / rowsPerPage);
        currentPage = Math.min(currentPage, totalPages || 1);

        document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => (row.style.display = "none"));
        renderPage(filtered);
        updatePaginationControls(totalPages);
    }

    /**
     * Updates sort indicators (e.g. ▲ or ▼) on column headers.
     */
    function updateSortIndicators() {
        document.querySelectorAll(`#${tableId} .sort-indicator`).forEach(el => (el.innerText = ""));
        if (!currentSort.key) return;

        const th = document.querySelector(`#${tableId} th[data-key="${currentSort.key}"]`);
        const indicator = th?.querySelector(".sort-indicator");
        if (indicator) {
            indicator.innerText = currentSort.ascending ? " ▲" : " ▼";
        }
    }

    /**
     * Sorts table by the given column key.
     * @param {string} key
     */
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

    // === Setup bindings ===
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

    applyFilters(); // Initial run
}
