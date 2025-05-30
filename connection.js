/**
 * Connection class that represents a Manhattan-style connection between two math blocks
 */
// Define Connection class in FQAuthor namespace
(function(FQAuthor) {
    'use strict';
    
    // Ensure FQAuthor exists
    if (!FQAuthor) {
        window.FQAuthor = {};
    }
    
    // Define Connection class
    class Connection {
        /**
         * Create a new Connection
         * @param {Object} outputConnector - The output connector object from the source block
         * @param {Object} inputConnector - The input connector object from the target block
         * @param {MathBlock} sourceBlock - The source math block
         * @param {MathBlock} targetBlock - The target math block
         */
        constructor(outputConnector, inputConnector, sourceBlock, targetBlock) {
            this.outputConnector = outputConnector;
            this.inputConnector = inputConnector;
            this.sourceBlock = sourceBlock;
            this.targetBlock = targetBlock;
            this.verticalX = (outputConnector.x + inputConnector.x) / 2;
            this.isSelected = false;
            
            // Mark connectors as occupied
            this.outputConnector.occupied = true;
            this.inputConnector.occupied = true;
            
            // Store the input connector index for tracking
            this.inputIndex = targetBlock.inputConnectors.indexOf(inputConnector);
        }
        
        /**
         * Update the connection path when blocks are moved
         */
        updatePath() {
            // Safety checks
            if (!this.sourceBlock || !this.targetBlock) return;
            
            // Update source connector
            this.outputConnector = this.sourceBlock.outputConnector;
            
            // Use stored index to get the correct input connector
            if (this.inputIndex !== -1 && this.inputIndex < this.targetBlock.inputConnectors.length) {
                this.inputConnector = this.targetBlock.inputConnectors[this.inputIndex];
            }

            // Update the vertical line position
            if (this.outputConnector && this.inputConnector) {
                this.verticalX = (this.outputConnector.x + this.inputConnector.x) / 2;
            }
        }
        
        /**
         * Draw the connection on the canvas
         * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
         */
        draw(ctx) {
            if (!this.outputConnector || !this.inputConnector) return;
            
            ctx.save();
            ctx.strokeStyle = this.isSelected ? '#ff0000' : '#666';
            ctx.lineWidth = 2;
            
            // Draw Manhattan path
            ctx.beginPath();
            ctx.moveTo(this.outputConnector.x, this.outputConnector.y);
            ctx.lineTo(this.verticalX, this.outputConnector.y);
            ctx.lineTo(this.verticalX, this.inputConnector.y);
            ctx.lineTo(this.inputConnector.x, this.inputConnector.y);
            ctx.stroke();
            
            ctx.restore();
        }
        
        /**
         * Check if a point is on any part of the connection
         * @param {number} x - The x coordinate
         * @param {number} y - The y coordinate
         * @returns {boolean} True if the point is on the connection
         */
        contains(x, y) {
            const tolerance = 8;
            
            // Check vertical line
            if (Math.abs(x - this.verticalX) <= tolerance &&
                y >= Math.min(this.outputConnector.y, this.inputConnector.y) &&
                y <= Math.max(this.outputConnector.y, this.inputConnector.y)) {
                return true;
            }
            
            // Check horizontal lines
            if (Math.abs(y - this.outputConnector.y) <= tolerance &&
                x >= Math.min(this.outputConnector.x, this.verticalX) &&
                x <= Math.max(this.outputConnector.x, this.verticalX)) {
                return true;
            }
            
            if (Math.abs(y - this.inputConnector.y) <= tolerance &&
                x >= Math.min(this.inputConnector.x, this.verticalX) &&
                x <= Math.max(this.inputConnector.x, this.verticalX)) {
                return true;
            }
            
            return false;
        }
        
        /**
         * Check if a point is on the vertical part of the connection
         * @param {number} x - The x coordinate to check
         * @param {number} y - The y coordinate to check
         * @returns {boolean} True if point is on vertical part
         */
        containsVerticalPart(x, y) {
            const tolerance = 8; // Same tolerance as in contains()
            
            // Check if point is near vertical line segment
            return Math.abs(x - this.verticalX) <= tolerance &&
                   y >= Math.min(this.outputConnector.y, this.inputConnector.y) &&
                   y <= Math.max(this.outputConnector.y, this.inputConnector.y);
        }

        /**
         * Start dragging the vertical line
         * @param {number} x - The starting x coordinate
         */
        startDrag(x) {
            this.isDragging = true;
            this.dragStartX = x - this.verticalX;
            this.isSelected = true;
        }
        
        /**
         * Update the vertical line position during drag
         * @param {number} x - The current x coordinate
         */
        drag(x) {
            if (this.isDragging) {  // Fixed syntax error here
                this.verticalX = x - this.dragStartX;
            }
        }
        
        /**
         * End dragging the vertical line
         */
        endDrag() {
            this.isDragging = false;
            this.dragStartX = 0;
            this.isSelected = false;
        }
        
        /**
         * Clean up the connection before removal
         */
        remove() {
            if (this.outputConnector) {
                this.outputConnector.occupied = false;
            }
            if (this.inputConnector) {
                this.inputConnector.occupied = false;
            }
            this.sourceBlock = null;
            this.targetBlock = null;
        }
        
        /**
         * Check if this connection uses the specified connector
         * @param {Object} connector - The connector to check
         * @returns {boolean} True if this connection uses the connector
         */
        usesConnector(connector) {
            return this.outputConnector === connector || this.inputConnector === connector;
        }
        
        /**
         * Check if a click is over the vertical line of the connection
         * @param {number} x - The x coordinate of the click
         * @param {number} y - The y coordinate of the click
         * @returns {boolean} True if the click is over the vertical line
         */
        isOverVerticalLine(x, y) {
            const tolerance = 5; // Pixels of click tolerance
            
            // Check if click is near vertical line
            if (Math.abs(x - this.verticalX) > tolerance) return false;
            
            // Check if click is between horizontal segments
            const minY = Math.min(this.outputConnector.y, this.inputConnector.y);
            const maxY = Math.max(this.outputConnector.y, this.inputConnector.y);
            return y >= minY && y <= maxY;
        }
    }
    
    // Register the Connection class in FQAuthor namespace
    FQAuthor.Connection = Connection;
    
})(window.FQAuthor || {});