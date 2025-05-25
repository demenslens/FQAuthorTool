// Grid canvas setup
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas and its context
    const canvas = document.getElementById('gridCanvas');
    const ctx = canvas.getContext('2d');
    
    // Check if MathBlock is available
    if (typeof MathBlock === 'undefined') {
        console.error('MathBlock class is not defined! Make sure mathBlock.js is loaded properly.');
        return;
    }
    
    // Debug message
    console.log('Grid initialization started');
    
    // Grid cell size
    const GRID_SIZE = 60;
    
    // Counter for unique block IDs
    let blockCounter = 1;
    
    // Array to hold all placed blocks
    const blocks = [];
    
    // Track if we're dragging and what color we're using
    let isDragging = false;
    let currentColor = null;
    let currentSymbol = null;
    
    // Preview block that follows the mouse
    let previewBlock = null;
    
    // Currently selected block (for deletion)
    let selectedBlock = null;
    
    // Define button colors and symbols
    const buttonColors = {
        'btn-1': '#FF5733', // Red-orange for Addition
        'btn-2': '#33FF57', // Green for Subtraction
        'btn-3': '#3357FF', // Blue for Multiplication
        'btn-4': '#F3FF33', // Yellow for Division
        'btn-5': '#FF33F3', // Pink for Equals
        'btn-6': '#33FFF3', // Cyan for Square Root
        'btn-7': '#8033FF', // Purple for Square
        'btn-8': '#FF8033'  // Orange for Integral
    };
    
    const buttonSymbols = {
        'btn-1': '+',
        'btn-2': '−',
        'btn-3': '×',
        'btn-4': '÷',
        'btn-5': '=',
        'btn-6': '√',
        'btn-7': 'x²',
        'btn-8': '∫'
    };
    
    // Set up the canvas size
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        drawGrid();
        drawBlocks();
    }
    
    // Draw the grid
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Draw all blocks and preview block
    function drawBlocks() {
        // Draw placed blocks
        blocks.forEach(block => {
            // Draw the block
            block.draw(ctx);
            
            // Draw block number in the top-left corner with black text
            ctx.save();
            ctx.font = '10px Arial';
            ctx.fillStyle = block.textColor || 'black'; // Use black as default if textColor not set
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(block.blockNumber, block.x + 3, block.y + 3);
            ctx.restore();
            
            // If this block is selected, draw a thicker black border
            if (selectedBlock === block) {
                // Save current context state
                ctx.save();
                
                // Draw thicker black border for selected block
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 4; // Thicker border for selected block
                ctx.strokeRect(block.x, block.y, block.width, block.height);
                
                // Restore context state
                ctx.restore();
            }
        });
        
        // Draw preview block if available
        if (previewBlock) {
            previewBlock.draw(ctx);
            
            // Draw "?" as block number for preview with black text
            ctx.save();
            ctx.font = '10px Arial';
            ctx.fillStyle = previewBlock.textColor || 'black';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('?', previewBlock.x + 3, previewBlock.y + 3);
            ctx.restore();
        }
    }
    
    // Get canvas-relative mouse coordinates
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    // Get grid-snapped coordinates
    function snapToGrid(x, y) {
        return {
            x: Math.floor(x / GRID_SIZE) * GRID_SIZE,
            y: Math.floor(y / GRID_SIZE) * GRID_SIZE
        };
    }
    
    // Start dragging from a menu button
    const menuButtons = document.querySelectorAll('.menu-button');
    menuButtons.forEach(button => {
        button.addEventListener('mousedown', (e) => {
            // Get the button's class to determine color and symbol
            const buttonClass = button.classList[1];
            
            // Get the button's color and symbol
            currentColor = buttonColors[buttonClass];
            currentSymbol = buttonSymbols[buttonClass];
            
            console.log('Button class:', buttonClass);
            console.log('Mapped color:', currentColor);
            console.log('Mapped symbol:', currentSymbol);
            
            isDragging = true;
            
            // Prevent default behavior
            e.preventDefault();
            
            // Add document-level handlers
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
    
    // Handle mouse movement during drag
    function onMouseMove(e) {
        if (!isDragging || !currentColor) return;
        
        // Get mouse position relative to canvas
        const coords = getCanvasCoordinates(e);
        
        // Check if mouse is over canvas
        if (coords.x >= 0 && coords.x < canvas.width && 
            coords.y >= 0 && coords.y < canvas.height) {
            
            // Snap to grid
            const snapped = snapToGrid(coords.x, coords.y);
            
            // Convert hex to rgba with opacity for preview
            const hexColor = currentColor;
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const transparentColor = `rgba(${r}, ${g}, ${b}, 0.5)`; // 50% opacity
            
            // Create/update preview block
            if (!previewBlock) {
                previewBlock = new MathBlock(snapped.x, snapped.y, transparentColor, currentSymbol);
                previewBlock.textColor = 'black';
                console.log('Created preview block:', previewBlock);
            } else {
                previewBlock.moveTo(snapped.x, snapped.y);
                previewBlock.color = transparentColor;
                previewBlock.symbol = currentSymbol;
                previewBlock.textColor = 'black';
            }
            
            // Redraw
            drawGrid();
            drawBlocks();
        } else {
            // Mouse is outside canvas, hide preview
            previewBlock = null;
            drawGrid();
            drawBlocks();
        }
    }
    
    // Handle mouse up to place block
    function onMouseUp(e) {
        if (!isDragging || !currentColor) return;
        
        // Get final position
        const coords = getCanvasCoordinates(e);
        
        // Check if mouse is over canvas
        if (coords.x >= 0 && coords.x < canvas.width && 
            coords.y >= 0 && coords.y < canvas.height) {
            
            // Snap to grid
            const snapped = snapToGrid(coords.x, coords.y);
            
            // Create a new block at the final position with more transparent color
            // Convert hex to rgba with opacity
            const hexColor = currentColor;
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const transparentColor = `rgba(${r}, ${g}, ${b}, 0.5)`; // 50% opacity
            
            const newBlock = new MathBlock(snapped.x, snapped.y, transparentColor, currentSymbol);
            
            // Assign a unique block number (reset to 1 if we reach 100)
            newBlock.blockNumber = blockCounter;
            blockCounter = (blockCounter % 99) + 1; // Cycle from 1 to 99
            
            // Set text color to black
            newBlock.textColor = 'black';
            
            blocks.push(newBlock);
            console.log('Created permanent block at:', snapped.x, snapped.y, 'with number:', newBlock.blockNumber);
        }
        
        // Reset state
        isDragging = false;
        currentColor = null;
        currentSymbol = null;
        previewBlock = null;
        
        // Remove document handlers
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // Final redraw
        drawGrid();
        drawBlocks();
    }
    
    // Select a block when clicking on it
    canvas.addEventListener('click', (e) => {
        // If we're dragging, don't select blocks
        if (isDragging) return;
        
        const coords = getCanvasCoordinates(e);
        
        // Check if we clicked on a block
        let clickedBlock = null;
        for (let i = blocks.length - 1; i >= 0; i--) {
            if (blocks[i].contains(coords.x, coords.y)) {
                clickedBlock = blocks[i];
                break;
            }
        }
        
        // Update selection
        selectedBlock = clickedBlock;
        console.log('Selected block:', selectedBlock);
        
        // Redraw to show selection indicator
        drawGrid();
        drawBlocks();
    });
    
    // Trash button functionality
    document.getElementById('trashBtn').addEventListener('click', () => {
        if (selectedBlock) {
            // Find the index of the selected block
            const index = blocks.indexOf(selectedBlock);
            
            if (index > -1) {
                // Remove the block from the array
                blocks.splice(index, 1);
                console.log('Removed block at index:', index);
            }
            
            // Clear selection
            selectedBlock = null;
            
            // Redraw
            drawGrid();
            drawBlocks();
        } else {
            console.log('No block selected to delete');
        }
    });
    
    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', () => {
        blocks.length = 0; // Clear all blocks
        selectedBlock = null; // Clear selection
        blockCounter = 1; // Reset block counter
        console.log('Cleared all blocks');
        drawGrid();
        drawBlocks();
    });
    
    // Initial setup
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});