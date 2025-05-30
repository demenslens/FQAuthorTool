/**
 * MathBlock class representing a mathematical operation block
 */
window.FQAuthor.MathBlock = class MathBlock {
    /**
     * Create a new MathBlock
     * @param {number} x - The x coordinate of the block
     * @param {number} y - The y coordinate of the block
     * @param {number} width - The width of the block
     * @param {number} height - The height of the block
     * @param {string} type - The type of mathematical operation
     * @param {string} symbol - The symbol to display in the block
     * @param {number} inputs - The number of inputs for the block
     */
    constructor(x, y, width, height, type, symbol, inputs) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.symbol = symbol;
        this.inputs = inputs;
        this.color = '#fff';
        this.blockNumber = null;
        this.isSelected = false; // Add this line
        
        // Initialize expression label
        this.expression = "Math Expression";
        this.labelOffset = 30; // Distance below block
        this.labelX = x + this.width + 65; // Position at end of dotted line
        this.labelY = y + height + this.labelOffset; // Initial position
        this.isDraggingLabel = false;

        // Initialize connectors
        this.updateConnectors();
    }

    updateConnectors() {
        const connectorRadius = 5;
        
        // Store previous occupied states
        const previousOccupied = {
            output: this.outputConnector?.occupied || false,
            inputs: this.inputConnectors?.map(conn => conn.occupied) || []
        };
        
        // Update output connector
        this.outputConnector = {
            x: this.x + this.width,
            y: this.y + this.height/2,
            radius: connectorRadius,
            occupied: previousOccupied.output
        };

        // Update input connectors
        const newInputConnectors = [];
        if (this.inputs === 1) {
            newInputConnectors.push({
                x: this.x,
                y: this.y + this.height/2,
                radius: connectorRadius,
                occupied: previousOccupied.inputs[0] || false
            });
        } else if (this.inputs === 2) {
            newInputConnectors.push({
                x: this.x,
                y: this.y + 12,
                radius: connectorRadius,
                occupied: previousOccupied.inputs[0] || false
            });
            newInputConnectors.push({
                x: this.x,
                y: this.y + this.height - 12,
                radius: connectorRadius,
                occupied: previousOccupied.inputs[1] || false
            });
        }
        this.inputConnectors = newInputConnectors;
    }

    /**
     * Draw the block and its connectors on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    draw(ctx) {
        // Update connector positions
        this.updateConnectors();
        
        ctx.save();
        
        // Draw main block with selection state
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.isSelected ? '#ff0000' : '#666';
        ctx.lineWidth = this.isSelected ? 3 : 2;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw symbol
        ctx.fillStyle = '#000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x + this.width/2, this.y + this.height/2);

        // Draw block number if exists
        if (this.blockNumber !== null) {
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(this.blockNumber, this.x + 5, this.y + 5);
        }

        // Draw connectors
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#666'; // Add border for visibility
        ctx.lineWidth = 1;

        // Draw output connector
        ctx.beginPath();
        ctx.arc(this.outputConnector.x, this.outputConnector.y, 
                this.outputConnector.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke(); // Add stroke to make white connectors visible

        // Draw input connectors
        this.inputConnectors.forEach(conn => {
            ctx.beginPath();
            ctx.arc(conn.x, conn.y, conn.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke(); // Add stroke to make white connectors visible
        });

        // Draw expression label and connecting line
        ctx.setLineDash([5, 3]); // Dotted line
        ctx.beginPath();
        ctx.moveTo(this.outputConnector.x, this.outputConnector.y);
        ctx.lineTo(this.labelX - 5, this.labelY); // Connect to start of label
        ctx.stroke();
        
        // Draw only the connected expression text
        ctx.setLineDash([]); // Reset line style
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.isDraggingLabel ? '#ff0000' : '#000';
        ctx.fillText(this.expression, this.labelX, this.labelY);

        ctx.restore();
    }

    /**
     * Check if a point is inside the block
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @returns {boolean} True if point is inside block
     */
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    /**
     * Get the connector type at a specific position
     * @param {number} x - X coordinate of the position
     * @param {number} y - Y Coordinate of the position
     * @returns {string|null} The connector type ('input1', 'input2', or 'output'), or null if none
     */
    getConnectorAt(x, y) {
        const hitRadius = 8; // Slightly larger than visual radius for easier clicking
        
        // Check output connector
        if (Math.hypot(x - this.outputConnector.x, y - this.outputConnector.y) <= hitRadius) {
            return 'output';
        }
        
        // Check input connectors
        for (let i = 0; i < this.inputConnectors.length; i++) {
            const conn = this.inputConnectors[i];
            if (Math.hypot(x - conn.x, y - conn.y) <= hitRadius) {
                return `input${i + 1}`;
            }
        }
        
        return null;
    }

    isOverLabel(x, y) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = '16px Arial';
        const labelWidth = ctx.measureText(this.expression).width;
        const labelHeight = 20; // Approximate text height
        return x >= this.labelX - labelWidth/2 &&
               x <= this.labelX + labelWidth/2 &&
               y >= this.labelY - labelHeight/2 &&
               y <= this.labelY + labelHeight/2;
    }

    // Add method to check if point is over the connected label
    isOverConnectedLabel(x, y) {
        const ctx = window.FQAuthor.ctx;
        ctx.font = '14px Arial';
        const labelWidth = ctx.measureText(this.expression).width;
        const labelHeight = 20; // Approximate text height
        
        return x >= this.labelX - 5 && // Add small padding for easier selection
               x <= this.labelX + labelWidth + 5 &&
               y >= this.labelY - labelHeight/2 &&
               y <= this.labelY + labelHeight/2;
    }

    // Update label position when block moves
    updateLabelPosition() {
        if (!this.isDraggingLabel) {
            this.labelX = this.x + this.width + 65;
            this.labelY = this.y + this.height + this.labelOffset;
        }
    }
}