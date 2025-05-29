/**
 * @file mouse_selector.js
 * @description
 * General-purpose mouse-based selection utility.
 *
 * Supports single or multiple selection modes for interactive UIs.
 * Handles mouse events with support for shift/control key modifiers and drag gestures.
 *
 * Usage example:
 * ```js
 * const selector = new MouseSelector({
 *   getKeyFromEvent: e => e.target.dataset.key,
 *   onSelect: key => ...,
 *   onDeselect: key => ...,
 *   onClear: () => ...,
 *   onIsSelected: key => ...,
 *   mode: SelectionMode.MULTIPLE
 * });
 * ```
 */

import { SelectionMode } from "../board/board_selectionEnums.js";

export class MouseSelector {
    /**
     * Constructs a MouseSelector instance.
     *
     * @param {Object} options
     * @param {(e: MouseEvent) => string | null} options.getKeyFromEvent - Maps mouse event to a selection key.
     * @param {(key: string) => void} options.onSelect - Called when a key is selected.
     * @param {(key: string) => void} options.onDeselect - Called when a key is deselected.
     * @param {() => void} options.onClear - Called to clear the current selection.
     * @param {(key: string) => boolean} options.onIsSelected - Checks if a key is already selected.
     * @param {() => void=} options.onStartSelection - Optional hook when selection starts.
     * @param {SelectionMode} [options.mode=SelectionMode.MULTIPLE] - Selection behavior (SINGLE or MULTIPLE).
     */
    constructor({
                    getKeyFromEvent,
                    onSelect,
                    onDeselect,
                    onClear,
                    onIsSelected,
                    onStartSelection = null,
                    mode = SelectionMode.MULTIPLE,
                }) {
        this.getKeyFromEvent = getKeyFromEvent;
        this.onSelect = onSelect;
        this.onDeselect = onDeselect;
        this.onClear = onClear;
        this.onIsSelected = onIsSelected;
        this.onStartSelection = onStartSelection;
        this.mode = mode;

        this._mouseDown = false;
        this._mouseDownPos = null;
        this._isDragging = false;
        this._dragged = new Set();
        this._shouldClear = false;
    }

    /**
     * Handle mouse down event. Starts tracking for click/drag detection.
     * @param {MouseEvent} e
     */
    onMouseDown(e) {
        const key = this.getKeyFromEvent(e);
        if (!key) return;

        this._mouseDown = true;
        this._mouseDownPos = { x: e.clientX, y: e.clientY };
        this._isDragging = false;
        this._dragged.clear();

        this._shouldClear = this.mode === SelectionMode.MULTIPLE
            ? !(e.shiftKey || e.ctrlKey)
            : true;

        this.onStartSelection?.();
    }

    /**
     * Handle mouse move event. Performs drag-based selection.
     * @param {MouseEvent} e
     */
    onMouseMove(e) {
        if (!this._mouseDown) return;

        const distX = Math.abs(e.clientX - this._mouseDownPos.x);
        const distY = Math.abs(e.clientY - this._mouseDownPos.y);
        const movedEnough = distX > 5 || distY > 5;

        if (movedEnough) this._isDragging = true;
        if (!this._isDragging) return;

        const key = this.getKeyFromEvent(e);
        if (!key || this._dragged.has(key)) return;
        this._dragged.add(key);

        if (this.mode === SelectionMode.SINGLE) {
            this.onClear();
            this.onSelect(key);
        } else {
            if (this._shouldClear) {
                this._shouldClear = false;
                this.onClear();
            }
            if (!this.onIsSelected(key)) {
                this.onSelect(key);
            }
        }
    }

    /**
     * Handle mouse up event. Determines if a selection should occur.
     * @param {MouseEvent} e
     */
    onMouseUp(e) {
        if (!this._mouseDown) return;

        const key = this.getKeyFromEvent(e);
        const isClick = !this._isDragging;
        const shift = e.shiftKey || e.ctrlKey;

        if (key && isClick) {
            const alreadySelected = this.onIsSelected(key);

            if (this.mode === SelectionMode.SINGLE) {
                if (alreadySelected) {
                    this.onDeselect(key);
                } else {
                    this.onClear();
                    this.onSelect(key);
                }
            } else {
                if (shift) {
                    if (alreadySelected) {
                        this.onDeselect(key);
                    } else {
                        this.onSelect(key);
                    }
                } else {
                    if (alreadySelected && this._onlyOneSelected()) {
                        this.onDeselect(key);
                    } else {
                        if (this._shouldClear) this.onClear();
                        this.onSelect(key);
                    }
                }
            }
        }

        this._mouseDown = false;
        this._mouseDownPos = null;
        this._isDragging = false;
        this._dragged.clear();
    }

    /**
     * Override this method to determine if only one item is selected.
     * Used for deselecting the last selected item.
     *
     * @returns {boolean}
     */
    _onlyOneSelected = () => false;
}
