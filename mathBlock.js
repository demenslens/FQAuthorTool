/**
 * MathBlock class that represents a 60x60 block on the grid with a math symbol
 */
class MathBlock {
    /**
     * Create a new MathBlock
     * @param {number} x - The x coordinate on the grid
     * @param {number} y - The y coordinate on the grid
     * @param {string} color - The color of the block (defaults to black)
     * @param {string} symbol - The math symbol to display in the block
     */
    constructor(x, y, color = 'black', symbol = '') {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.color = color;
        this.borderColor = '#666666'; // Gray border color
        this.borderWidth = 2; // Border width in pixels
        this.symbol = symbol;
        this.textColor = 'black'; // Default text color
    }

    /**
     * Draw the block on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
     */
    draw(ctx) {
        // Draw the filled block
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw the border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw the symbol if it exists
        if (this.symbol) {
            ctx.save(); // Save current context state
            
            // Set up text properties
            ctx.fillStyle = this.textColor; // Use the textColor property
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate center position
            const centerX = this.x + (this.width / 2);
            const centerY = this.y + (this.height / 2);
            
            // Draw text
            ctx.fillText(this.symbol, centerX, centerY);
            
            ctx.restore(); // Restore context state
        }
    }

    /**
     * Check if a point is inside this block
     * @param {number} x - The x coordinate to check
     * @param {number} y - The y coordinate to check
     * @returns {boolean} - True if the point is inside the block
     */
    contains(x, y) {
        return x >= this.x && 
               x <= this.x + this.width && 
               y >= this.y && 
               y <= this.y + this.height;
    }

    /**
     * Move the block to a new position
     * @param {number} x - The new x coordinate
     * @param {number} y - The new y coordinate
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Export the MathBlock class for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathBlock };
}