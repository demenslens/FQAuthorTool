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
    let blockType = ''; // Track the type of block to create
    
    // Preview block that follows the mouse
    let previewBlock = null;
    
    // Currently selected block (for deletion)
    let selectedBlock = null;
    
    // Track which button was clicked
    let selectedButton = null;
    
    // Define button colors and symbols
    const buttonColors = {
        'btn-1': '#FF5733', // Red-orange for Addition
        'btn-2': '#33FF57', // Green for Subtraction
        'btn-3': '#3357FF', // Blue for Multiplication
        'btn-4': '#F3FF33', // Yellow for Division
        'btn-5': '#FF33F3', // Pink for Equals
        'btn-6': '#33FFF3', // Cyan for Square Root
        'btn-7': '#8033FF', // Purple for Square
        'btn-8': '#FF8033',  // Orange for Substitute
        'btn-9': '#33B5FF'   // Light blue for Gegeven
    };
    
    const buttonSymbols = {
        'btn-1': '+',
        'btn-2': '−',
        'btn-3': '×',
        'btn-4': '÷',
        'btn-5': '=',
        'btn-6': '√',
        'btn-7': 'x²',
        'btn-8': '↧',    // Substitute symbol (U+021A7)
        'btn-9': '⇰'     // Gegeven symbol (U+021F0)
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
            // Store the selected button
            selectedButton = button;
            
            // Get the button's class to determine color and symbol
            const buttonClass = button.classList[1];
            
            // Get the button's color and symbol
            currentColor = buttonColors[buttonClass];
            currentSymbol = buttonSymbols[buttonClass];
            
            // Get block type from data-text attribute
            blockType = button.getAttribute('data-text').toLowerCase().replace(/\s+/g, '_');
            
            isDragging = true;
            
            // Prevent default behavior
            e.preventDefault();
            
            // Change cursor to indicate dragging
            canvas.style.cursor = 'crosshair';
            
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
                // Pass all required parameters to the MathBlock constructor
                previewBlock = new MathBlock(
                    snapped.x,         // x position
                    snapped.y,         // y position
                    GRID_SIZE,         // width
                    GRID_SIZE,         // height
                    blockType,         // type - from data-text attribute
                    currentSymbol      // symbol
                );
                previewBlock.color = transparentColor; // Set color after creation
                previewBlock.textColor = 'black';
            } else {
                previewBlock.x = snapped.x;
                previewBlock.y = snapped.y;
                previewBlock.color = transparentColor;
                previewBlock.symbol = currentSymbol;
                previewBlock.textColor = 'black';
                previewBlock.updateConnectorPositions(); // Update connectors if moved
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
            
            // Create a new block at the final position using stored blockType
            const newBlock = new MathBlock(
                snapped.x,         // x position
                snapped.y,         // y position
                GRID_SIZE,         // width
                GRID_SIZE,         // height
                blockType,         // type - already normalized
                currentSymbol      // symbol
            );
            
            // Set color after creation
            newBlock.color = currentColor;
            
            // Assign a unique block number
            newBlock.blockNumber = blockCounter;
            blockCounter = (blockCounter % 99) + 1;
            
            // Set text color to black
            newBlock.textColor = 'black';
            
            blocks.push(newBlock);
        }
        
        // Reset state
        isDragging = false;
        currentColor = null;
        currentSymbol = null;
        selectedButton = null;
        blockType = '';
        previewBlock = null;
        
        // Remove document handlers
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // Reset cursor
        canvas.style.cursor = 'default';
        
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
            }
            
            // Clear selection
            selectedBlock = null;
            
            // Redraw
            drawGrid();
            drawBlocks();
        }
    });
    
    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', () => {
        blocks.length = 0; // Clear all blocks
        selectedBlock = null; // Clear selection
        blockCounter = 1; // Reset block counter
        drawGrid();
        drawBlocks();
    });
    
    // Initial setup
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Variables for tracking block movement
    let isMovingBlock = false;
    let movingBlockOffset = { x: 0, y: 0 };
    
    // Add mouse events for moving blocks
    canvas.addEventListener('mousedown', (e) => {
        // If we're already dragging a new block from the menu, don't handle block movement
        if (isDragging) return;
        
        const coords = getCanvasCoordinates(e);
        
        // Check if we clicked on a block
        for (let i = blocks.length - 1; i >= 0; i--) {
            if (blocks[i].contains(coords.x, coords.y)) {
                // Select this block
                selectedBlock = blocks[i];
                
                // Start moving the block
                isMovingBlock = true;
                
                // Change cursor to grabbing hand
                canvas.style.cursor = 'grabbing';
                
                // Calculate the offset from the mouse to the block's corner
                // This ensures the block doesn't jump to have its corner at the mouse position
                movingBlockOffset = {
                    x: coords.x - selectedBlock.x,
                    y: coords.y - selectedBlock.y
                };
                
                // Prevent default behavior
                e.preventDefault();
                
                // No need to check other blocks
                break;
            }
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoordinates(e);
        
        if (isMovingBlock && selectedBlock) {
            // If we're moving a block, keep the grabbing cursor
            canvas.style.cursor = 'grabbing';
            
            // Calculate new position, accounting for the initial click offset
            const newX = coords.x - movingBlockOffset.x;
            const newY = coords.y - movingBlockOffset.y;
            
            // Snap to grid
            const snapped = snapToGrid(newX, newY);
            
            // Update block position
            selectedBlock.x = snapped.x;
            selectedBlock.y = snapped.y;
            
            // Update connector positions
            selectedBlock.updateConnectorPositions();
            
            // Redraw
            drawGrid();
            drawBlocks();
        } else if (!isDragging) {
            // If we're not dragging a new block or moving an existing one,
            // check if the mouse is over any block to show the grab cursor
            let overBlock = false;
            for (let i = blocks.length - 1; i >= 0; i--) {
                if (blocks[i].contains(coords.x, coords.y)) {
                    overBlock = true;
                    break;
                }
            }
            
            // Change cursor based on whether we're over a block
            canvas.style.cursor = overBlock ? 'grab' : 'default';
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        // End moving block if we were moving one
        if (isMovingBlock) {
            isMovingBlock = false;
            movingBlockOffset = { x: 0, y: 0 };
            
            // Reset cursor
            canvas.style.cursor = 'default';
            
            // Redraw final position
            drawGrid();
            drawBlocks();
        }
    });
    
    // Prevent text selection during drag operations
    canvas.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
});