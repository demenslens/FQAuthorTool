/**
 * MathBlock class that represents a 60x60 block on the grid with a math symbol
 */
class MathBlock {
    /**
     * Create a new MathBlock
     * @param {number} x - The x coordinate on the grid
     * @param {number} y - The y coordinate on the grid
     * @param {number} width - The width of the block
     * @param {number} height - The height of the block
     * @param {string} type - The type of the math operation
     * @param {string} symbol - The math symbol to display in the block
     */
    constructor(x, y, width, height, type, symbol) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Ensure type is properly normalized
        this.type = String(type).toLowerCase().replace(/\s+/g, '_');
        console.log('MathBlock created with type:', this.type);
        
        this.symbol = symbol;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.color = this.getColorForType();
        this.borderRadius = 5;
        
        // Add output connector property
        this.outputConnector = {
            x: this.x + this.width,
            y: this.y + this.height/2,
            radius: 3
        };
        
        // Add input connectors based on block type
        this.inputConnectors = [];
        
        // Log the exact type value for debugging
        console.log('Block type for connector decision:', this.type);
        
        // Determine number of input connectors based on block type
        if (this.type === 'square' || this.type === 'square_root') {
            // Square and Square Root have one input connector in the middle
            console.log('Creating single input connector for:', this.type);
            this.inputConnectors = [{
                x: this.x,
                y: this.y + this.height/2,
                radius: 3
            }];
        } else if (this.type === 'gegeven') {
            // Gegeven has no input connectors
            console.log('No input connectors for:', this.type);
            this.inputConnectors = [];
        } else {
            // All others have 2 input connectors (15px from top and bottom)
            console.log('Creating two input connectors for:', this.type);
            this.inputConnectors = [
                {
                    x: this.x,
                    y: this.y + 15,
                    radius: 3
                },
                {
                    x: this.x,
                    y: this.y + this.height - 15,
                    radius: 3
                }
            ];
        }
    }
    
    /**
     * Update the connector positions when the block is moved
     */
    updateConnectorPositions() {
        // Update output connector
        this.outputConnector.x = this.x + this.width;
        this.outputConnector.y = this.y + this.height/2;
        
        // Update input connectors based on type
        if (this.type === 'square' || this.type === 'square_root') {
            // Square and Square Root have one input connector in the middle
            if (this.inputConnectors.length > 0) {
                this.inputConnectors[0].x = this.x;
                this.inputConnectors[0].y = this.y + this.height/2;
            }
        } else if (this.type === 'gegeven') {
            // Gegeven has no input connectors
        } else {
            // All others have 2 input connectors (15px from top and bottom)
            if (this.inputConnectors.length >= 2) {
                this.inputConnectors[0].x = this.x;
                this.inputConnectors[0].y = this.y + 15;
                
                this.inputConnectors[1].x = this.x;
                this.inputConnectors[1].y = this.y + this.height - 15;
            }
        }
    }
    
    /**
     * Draw the block on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
     */
    draw(ctx) {
        // Draw the main block
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(this.x + this.borderRadius, this.y);
        ctx.lineTo(this.x + this.width - this.borderRadius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.borderRadius);
        ctx.lineTo(this.x + this.width, this.y + this.height - this.borderRadius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.borderRadius, this.y + this.height);
        ctx.lineTo(this.x + this.borderRadius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.borderRadius);
        ctx.lineTo(this.x, this.y + this.borderRadius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + this.borderRadius, this.y);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Draw the symbol in the center of the block
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = this.x + (this.width / 2);
        const centerY = this.y + (this.height / 2);
        ctx.fillText(this.symbol, centerX, centerY);
        
        // Draw the output connector circle
        ctx.beginPath();
        ctx.arc(this.outputConnector.x, this.outputConnector.y, this.outputConnector.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw the input connector circles
        this.inputConnectors.forEach(connector => {
            ctx.beginPath();
            ctx.arc(connector.x, connector.y, connector.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    // Update method to ensure connector positions are updated when block is moved
    update(newX, newY) {
        this.x = newX;
        this.y = newY;
        this.updateConnectorPositions();
    }
    
    /**
     * Check if a point is inside this block
     * @param {number} x - The x coordinate to check
     * @param {number} y - The y coordinate to check
     * @returns {boolean} - True if the point is inside the block
     */
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    /**
     * Start dragging the block
     * @param {number} x - The x coordinate where dragging started
     * @param {number} y - The y coordinate where dragging started
     */
    startDrag(x, y) {
        this.isDragging = true;
        this.dragStartX = x - this.x;
        this.dragStartY = y - this.y;
    }
    
    /**
     * Drag the block to a new position
     * @param {number} x - The new x coordinate
     * @param {number} y - The new y coordinate
     */
    drag(x, y) {
        if (this.isDragging) {
            this.x = x - this.dragStartX;
            this.y = y - this.dragStartY;
            this.updateConnectorPositions(); // Update connector positions while dragging
        }
    }
    
    /**
     * End dragging the block
     */
    endDrag() {
        this.isDragging = false;
    }
    
    /**
     * Get the color associated with the block type
     * @returns {string} - The color for the block type
     */
    getColorForType() {
        const colors = {
            'addition': '#FF5733',
            'subtraction': '#33FF57',
            'multiplication': '#3357FF',
            'division': '#F3FF33',
            'equals': '#FF33F3',
            'square_root': '#33FFF3',
            'square': '#8033FF',
            'substitute': '#FF8033',
            'gegeven': '#33B5FF'
        };
        
        return colors[this.type] || '#333333';
    }
}

// Export the MathBlock class for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathBlock };
}