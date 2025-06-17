
export function drawCollisionX(board, ctx, cell) {
    const { r, c } = cell;
    const topLeft = board.getCellTopLeftCTX(r, c);
    const cellSize = board.getCellSize();

    const padding = cellSize / 4;
    const x = topLeft.x + padding;
    const y = topLeft.y + padding;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Draw X from corner to corner
    ctx.moveTo(x, y);
    ctx.lineTo(x + cellSize, y + cellSize);
    ctx.moveTo(x + cellSize, y);
    ctx.lineTo(x, y + cellSize);

    ctx.stroke();
    ctx.restore(); 
}
