class Exercise {
    constructor() {
        // Exercise metadata
        this.title = '';
        this.blocks = [];
        this.connections = [];

        // Standard text blocks
        this.textBlocks = {
            gegeven: {
                title: 'Gegeven',
                content: '',
                x: 50,
                y: 50,
                width: 300,
                height: 100
            },
            gevraagd: {
                title: 'Gevraagd',
                content: '',
                x: 50,
                y: 170,
                width: 300,
                height: 100
            },
            hulpstellingen: {
                title: 'Hulpstellingen',
                content: '',
                x: 50,
                y: 290,
                width: 300,
                height: 100
            }
        };
    }

    /**
     * Set the exercise title
     * @param {string} title - The exercise title
     */
    setTitle(title) {
        this.title = title;
    }

    /**
     * Set the exercise description
     * @param {string} description - The exercise description
     */
    setDescription(description) {
        this.description = description;
    }

    /**
     * Save the current state of blocks and connections
     * @param {Array} blocks - Array of MathBlock objects
     * @param {Array} connections - Array of Connection objects
     */
    saveState(blocks, connections) {
        this.blocks = blocks.map(block => ({
            x: block.x,
            y: block.y,
            type: block.type,
            symbol: block.symbol,
            color: block.color,
            expression: block.expression
        }));

        this.connections = connections.map(conn => ({
            sourceBlock: this.blocks.indexOf(conn.sourceBlock),
            targetBlock: this.blocks.indexOf(conn.targetBlock),
            verticalX: conn.verticalX
        }));
    }

    /**
     * Set content for a specific text block
     * @param {string} blockName - Name of the text block (gegeven/gevraagd/hulpstellingen)
     * @param {string} content - Content to set
     */
    setTextBlockContent(blockName, content) {
        if (this.textBlocks[blockName]) {
            this.textBlocks[blockName].content = content;
        }
    }

    /**
     * Draw text blocks on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    drawTextBlocks(ctx) {
        ctx.save();
        
        // Text block styling
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.font = 'bold 14px Arial';
        
        Object.values(this.textBlocks).forEach(block => {
            // Draw block background
            ctx.beginPath();
            ctx.roundRect(block.x, block.y, block.width, block.height, 5);
            ctx.fill();
            ctx.stroke();

            // Draw title
            ctx.fillStyle = '#000000';
            ctx.fillText(block.title, block.x + 10, block.y + 20);

            // Draw content
            ctx.font = '12px Arial';
            const lines = this.wrapText(ctx, block.content, block.width - 20);
            lines.forEach((line, i) => {
                ctx.fillText(line, block.x + 10, block.y + 45 + (i * 20));
            });
        });

        ctx.restore();
    }

    /**
     * Wrap text to fit within specified width
     * @private
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    /**
     * Export the exercise to JSON
     * @returns {string} JSON string of the exercise
     */
    export() {
        return JSON.stringify({
            title: this.title,
            blocks: this.blocks,
            connections: this.connections,
            textBlocks: this.textBlocks
        }, null, 2);
    }

    /**
     * Import an exercise from JSON
     * @param {string} json - JSON string to import
     * @returns {boolean} Success status
     */
    import(json) {
        try {
            const data = JSON.parse(json);
            this.title = data.title;
            this.blocks = data.blocks;
            this.connections = data.connections;
            this.textBlocks = data.textBlocks;
            return true;
        } catch (error) {
            console.error('Failed to import exercise:', error);
            return false;
        }
    }
}

// Register in FQAuthor namespace
window.FQAuthor = window.FQAuthor || {};
window.FQAuthor.Exercise = Exercise;