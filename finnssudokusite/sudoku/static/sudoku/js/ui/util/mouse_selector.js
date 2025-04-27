import { SelectionMode } from "../board/board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
import { CellIdx }      from "../region/CellIdx.js";

export class MouseSelector {
    constructor({
                    getKeyFromEvent,       // (MouseEvent e) => string | null
                    onSelect,              // (key: string) => void
                    onDeselect,            // (key: string) => void
                    onClear,               // () => void
                    onIsSelected,          // (key: string) => boolean
                    onStartSelection = null,  // () => void (optional)
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

        this.lastCell = null;
    }

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

    onMouseMove(e) {
        if (!this._mouseDown || this.mode === SelectionMode.SINGLE) return;

        const distX = Math.abs(e.clientX - this._mouseDownPos.x);
        const distY = Math.abs(e.clientY - this._mouseDownPos.y);
        const movedEnough = distX > 5 || distY > 5;

        if (movedEnough) this._isDragging = true;
        if (!this._isDragging) return;

        if (this._shouldClear) {
            this._shouldClear = false;
            this.onClear();
        }

        const key = this.getKeyFromEvent(e);
        if (!key || this._dragged.has(key)) return;
        this._dragged.add(key);
            
        if (!this.onIsSelected(key)) {
            // check if we move diagonally, if so don't select the cell
            if (this.lastCell && Math.abs(key.r - this.lastCell.r) === 1 &&  Math.abs(key.c - this.lastCell.c) === 1) {
                return;
            }

            this.onSelect(key);
            this.lastCell = key;
        }
    }

    onMouseUp(e) {
        if (!this._mouseDown) return;

        this.lastCell = null;

        const key = this.getKeyFromEvent(e);
        const isClick = !this._isDragging;
        const shift = e.shiftKey || e.ctrlKey;

        if (key && isClick) {
            const alreadySelected = this.onIsSelected(key);

            if (this.mode === SelectionMode.SINGLE) {
                if (!alreadySelected || this._onlyOneSelected()) {
                    this.onClear();
                    this.onSelect(key);
                }
            } else {
                if (shift) {
                    if (alreadySelected) this.onDeselect(key);
                    else this.onSelect(key);
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

    // Optional override for determining whether only one is selected
    _onlyOneSelected = () => false;
}
