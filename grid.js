/**
 * Grid canvas setup and event handling
 * This module handles the main canvas interaction, block placement, and connection management
 */

// Start with immediate initialization
(function() {
    // Canvas initialization
    const canvas = document.getElementById('gridCanvas');
    const ctx = canvas.getContext('2d');
    const GRID_SIZE = window.FQAuthor.GRID_SIZE;
    let lastMouseEvent;

    // Store canvas references in global namespace
    window.FQAuthor.canvas = canvas;
    window.FQAuthor.ctx = ctx;

    // State management
    const state = {
        blocks: [],
        connections: [],
        isDragging: false,
        isMovingBlock: false,
        selectedBlock: null,
        previewBlock: null,
        currentColor: null,
        currentSymbol: null,
        blockType: '',
        blockCounter: 1,
        inputs: null,  // Add this line
        isCreatingConnection: false,
        sourceBlock: null,
        sourceConnector: null,
        isDraggingLabel: false,
        selectedLabel: null,
        labelDragOffset: { x: 0, y: 0 },
        isDraggingConnection: false,
        selectedConnection: null,
        connectionDragOffset: 0
    };

    // Button configurations
    const buttonColors = {
        'btn-1': '#FF5733', // Addition
        'btn-2': '#33FF57', // Subtraction
        'btn-3': '#3357FF', // Multiplication
        'btn-4': '#F3FF33', // Division
        'btn-5': '#FF33F3', // Equals
        'btn-6': '#33FFF3', // Square Root
        'btn-7': '#8033FF', // Square
        'btn-8': '#FF8033', // Substitute
        'btn-9': '#33B5FF'  // Gegeven
    };

    const buttonSymbols = {
        'btn-1': '+',
        'btn-2': '−',
        'btn-3': '×',
        'btn-4': '÷',
        'btn-5': '=',
        'btn-6': '√',
        'btn-7': 'x²',
        'btn-8': '↧',
        'btn-9': '⇰'
    };

    // Core drawing functions
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#ccc';
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
        
        // Draw blocks and connections
        state.blocks.forEach(block => block.draw(ctx));
        state.connections.forEach(conn => conn.draw(ctx));
        
        if (state.previewBlock) {
            state.previewBlock.draw(ctx);
        }
        
        // Draw connection preview if creating connection
        if (state.isCreatingConnection && state.sourceBlock && lastMouseEvent) {
            const coords = getCanvasCoordinates(lastMouseEvent);
            ctx.save();
            ctx.strokeStyle = '#666';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            
            // Draw preview with Manhattan routing
            const sourceX = state.sourceBlock.outputConnector.x;
            const sourceY = state.sourceBlock.outputConnector.y;
            const verticalX = (sourceX + coords.x) / 2;
            
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(verticalX, sourceY);
            ctx.lineTo(verticalX, coords.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    function setupCanvas() {
        canvas.width = 1200;
        canvas.height = 840;
        drawGrid();
    }

    // Block handling functions
    function createPreviewBlock(coords) {
        const snapped = snapToGrid(coords.x, coords.y);
        state.previewBlock = new window.FQAuthor.MathBlock(
            snapped.x, snapped.y, GRID_SIZE, GRID_SIZE,
            state.blockType, state.currentSymbol,
            state.inputs  // Add this parameter
        );
        state.previewBlock.color = state.currentColor;
        drawGrid();
    }

    function placeBlock(coords) {
        const snapped = snapToGrid(coords.x, coords.y);
        const newBlock = new window.FQAuthor.MathBlock(
            snapped.x, snapped.y, GRID_SIZE, GRID_SIZE,
            state.blockType, state.currentSymbol,
            state.inputs  // Add this parameter
        );
        
        newBlock.color = state.currentColor;
        newBlock.blockNumber = state.blockCounter++;
        state.blocks.push(newBlock);
        drawGrid();
        
        // Update button states after adding block
        updateButtonStates();
    }

    // Utility functions
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function snapToGrid(x, y) {
        return {
            x: Math.floor(x / GRID_SIZE) * GRID_SIZE,
            y: Math.floor(y / GRID_SIZE) * GRID_SIZE
        };
    }

    function isOverCanvas(coords) {
        return coords.x >= 0 && coords.x <= canvas.width &&
               coords.y >= 0 && coords.y <= canvas.height;
    }

    function resetDragState() {
        state.isDragging = false;
        state.currentColor = null;
        state.currentSymbol = null;
        state.blockType = '';
        state.inputs = null;  // Add this line
        state.previewBlock = null;
        
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    }

    // Add resetConnectionState function
    function resetConnectionState() {
        state.isCreatingConnection = false;
        state.sourceBlock = null;
        state.sourceConnector = null;
        canvas.style.cursor = 'default';
    }

    // Add createConnection function
    function createConnection(sourceBlock, targetBlock, sourceConnector, targetConnector) {
        // Check if input connector is already occupied
        if (targetConnector.occupied) {
            return; // Don't create connection if input is already in use
        }
        
        const connection = new window.FQAuthor.Connection(
            sourceConnector,
            targetConnector,
            sourceBlock,
            targetBlock
        );
        
        // Mark connectors as occupied
        sourceConnector.occupied = true;
        targetConnector.occupied = true;
        
        state.connections.push(connection);
        drawGrid();
    }

    // Event handlers
    function handleMenuButtonDown(e) {
        if (state.isDragging) return;
        
        const button = e.currentTarget;
        const buttonClass = button.classList[1];
        
        state.isDragging = true;
        state.currentColor = buttonColors[buttonClass];
        state.currentSymbol = buttonSymbols[buttonClass];
        state.blockType = button.getAttribute('data-text');
        state.inputs = parseInt(button.getAttribute('data-input')); // Add this line
        
        createPreviewBlock(getCanvasCoordinates(e));
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        
        e.preventDefault();
    }

    function handleDragMove(e) {
        if (!state.isDragging || !state.previewBlock) return;
        createPreviewBlock(getCanvasCoordinates(e));
    }

    function handleDragEnd(e) {
        if (!state.isDragging) return;
        
        const coords = getCanvasCoordinates(e);
        if (isOverCanvas(coords)) {
            placeBlock(coords);
        }
        
        resetDragState();
        drawGrid();
    }

    function clearAll() {
        // Reset state
        state.blocks = [];
        state.connections = [];
        state.isDragging = false;
        state.isMovingBlock = false;
        state.selectedBlock = null;
        state.previewBlock = null;
        state.currentColor = null;
        state.currentSymbol = null;
        state.blockType = '';
        state.blockCounter = 1;
        state.inputs = null;
        state.isCreatingConnection = false;
        state.sourceBlock = null;
        state.sourceConnector = null;
        state.isDraggingLabel = false;
        state.selectedLabel = null;
        state.labelDragOffset = { x: 0, y: 0 };

        // Reset cursor
        canvas.style.cursor = 'default';

        // Clear any event listeners for drag operations
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);

        // Redraw empty grid
        drawGrid();
        
        // Update button states after clearing
        updateButtonStates();
    }

    // Add removeBlock function after clearAll function
    function removeSelectedItem() {
        // Check if we have a selected block
        const selectedBlock = state.blocks.find(block => block.isSelected);
        if (selectedBlock) {
            // Remove all connections involving this block
            state.connections = state.connections.filter(conn => {
                if (conn.sourceBlock === selectedBlock || conn.targetBlock === selectedBlock) {
                    // Free up the connectors
                    if (conn.outputConnector) conn.outputConnector.occupied = false;
                    if (conn.inputConnector) conn.inputConnector.occupied = false;
                    return false;
                }
                return true;
            });
            
            // Remove the block
            state.blocks = state.blocks.filter(block => block !== selectedBlock);
            state.selectedBlock = null;
            drawGrid();
            return;
        }

        // Check if we have a selected connection
        const selectedConnection = state.connections.find(conn => conn.isSelected);
        if (selectedConnection) {
            // Free up the connectors
            if (selectedConnection.outputConnector) {
                selectedConnection.outputConnector.occupied = false;
            }
            if (selectedConnection.inputConnector) {
                selectedConnection.inputConnector.occupied = false;
            }
            
            // Remove the connection
            state.connections = state.connections.filter(conn => conn !== selectedConnection);
            drawGrid();
        }
    }

    // Add after other utility functions
    function saveToFile() {
        // Create save state object
        const saveState = {
            blocks: state.blocks.map(block => ({
                x: block.x,
                y: block.y,
                width: block.width,
                height: block.height,
                type: block.type,
                symbol: block.symbol,
                inputs: block.inputs,
                color: block.color,
                blockNumber: block.blockNumber,
                expression: block.expression,
                labelX: block.labelX,
                labelY: block.labelY
            })),
            connections: state.connections.map(conn => ({
                sourceBlockIndex: state.blocks.indexOf(conn.sourceBlock),
                targetBlockIndex: state.blocks.indexOf(conn.targetBlock),
                inputIndex: conn.inputIndex,
                verticalX: conn.verticalX
            })),
            blockCounter: state.blockCounter
        };

        // Convert to JSON and create blob
        const jsonString = JSON.stringify(saveState, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.download = 'fqauthor_save.json';
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.click();
        
        // Cleanup
        URL.revokeObjectURL(downloadLink.href);
    }

    // Add after saveToFile function
    function loadFromFile(jsonData) {
        // Parse the saved state
        const savedState = JSON.parse(jsonData);
        
        // Clear current state
        clearAll();
        
        // Restore blocks first
        savedState.blocks.forEach(blockData => {
            const block = new window.FQAuthor.MathBlock(
                blockData.x,
                blockData.y,
                blockData.width,
                blockData.height,
                blockData.type,
                blockData.symbol,
                blockData.inputs
            );
            
            // Restore block properties
            block.color = blockData.color;
            block.blockNumber = blockData.blockNumber;
            block.expression = blockData.expression;
            block.labelX = blockData.labelX;
            block.labelY = blockData.labelY;
            
            state.blocks.push(block);
        });
        
        // Restore connections using saved indices
        savedState.connections.forEach(connData => {
            const sourceBlock = state.blocks[connData.sourceBlockIndex];
            const targetBlock = state.blocks[connData.targetBlockIndex];
            
            if (sourceBlock && targetBlock) {
                const connection = new window.FQAuthor.Connection(
                    sourceBlock.outputConnector,
                    targetBlock.inputConnectors[connData.inputIndex],
                    sourceBlock,
                    targetBlock
                );
                
                connection.verticalX = connData.verticalX;
                state.connections.push(connection);
            }
        });
        
        // Restore block counter
        state.blockCounter = savedState.blockCounter;
        
        // Redraw
        drawGrid();
        
        // Update button states after loading
        updateButtonStates();
    }

    // Add function to update button states
    function updateButtonStates() {
        const hasContent = state.blocks.length > 0 || state.connections.length > 0;
        
        // Get all top menu buttons
        const saveBtn = document.getElementById('saveBtn');
        const trashBtn = document.getElementById('trashBtn');
        const clearBtn = document.getElementById('clearBtn');
        const editBtn = document.getElementById('editBtn');
        const opdrachtBtn = document.getElementById('opdrachtBtn');
        const loadBtn = document.getElementById('loadBtn');
        
        // Case 1: Empty application
        if (!hasContent) {
            // Disable all buttons except Load and Opdracht
            saveBtn.disabled = true;
            trashBtn.disabled = true;
            clearBtn.disabled = true;
            editBtn.disabled = true;
            loadBtn.disabled = false;
            opdrachtBtn.disabled = false;
        } 
        // Case 2: Application has content
        else {
            // Enable all buttons except Load and Opdracht
            saveBtn.disabled = false;
            trashBtn.disabled = false;
            clearBtn.disabled = false;
            editBtn.disabled = false;
            loadBtn.disabled = true;
            opdrachtBtn.disabled = true;
        }
    }

    // Initialize
    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Event listeners
    const menuButtons = document.querySelectorAll('.menu-button');
    menuButtons.forEach(button => 
        button.addEventListener('mousedown', handleMenuButtonDown)
    );

    // Allow block movement
    canvas.addEventListener('mousedown', (e) => {
        const coords = getCanvasCoordinates(e);
        
        // Check for label dragging first
        for (const block of state.blocks) {
            if (block.isOverConnectedLabel(coords.x, coords.y)) {
                block.isDraggingLabel = true;
                state.selectedBlock = block;
                state.labelOffset = {
                    x: coords.x - block.labelX,
                    y: coords.y - block.labelY
                };
                canvas.style.cursor = 'move';
                e.preventDefault();
                return;
            }
        }
        
        // Check for connection vertical line dragging
        for (const conn of state.connections) {
            if (conn.isOverVerticalLine(coords.x, coords.y)) {
                state.isDraggingConnection = true;
                state.selectedConnection = conn;
                state.connectionDragOffset = coords.x - conn.verticalX;
                canvas.style.cursor = 'ew-resize';
                e.preventDefault();
                return;
            }
        }
        
        // Check for connector clicks first
        for (const block of state.blocks) {
            const connectorType = block.getConnectorAt(coords.x, coords.y);
            if (connectorType) {
                if (!state.isCreatingConnection) {
                    if (connectorType === 'output' && !block.outputConnector.occupied) {
                        // Start new connection from output
                        state.isCreatingConnection = true;
                        state.sourceBlock = block;
                        state.sourceConnector = block.outputConnector;
                        canvas.style.cursor = 'crosshair';
                    }
                } else {
                    if (connectorType.startsWith('input')) {
                        // Complete connection to input
                        const inputIndex = parseInt(connectorType.slice(5)) - 1;
                        const targetConnector = block.inputConnectors[inputIndex];
                        
                        if (!targetConnector.occupied && block !== state.sourceBlock) {
                            createConnection(
                                state.sourceBlock,
                                block,
                                state.sourceConnector,
                                targetConnector
                            );
                        }
                    }
                    resetConnectionState();
                    drawGrid();
                }
                e.preventDefault();
                return;
            }
        }
        
        state.blocks.forEach(block => block.isSelected = false);
        
        // Add inside canvas mousedown event handler, before block selection code
        state.connections.forEach(conn => conn.isSelected = false);

        // Check for connection selection
        for (const conn of state.connections) {
            if (conn.contains(coords.x, coords.y)) {
                conn.isSelected = true;
                drawGrid();
                e.preventDefault();
                return;
            }
        }

        for (const block of state.blocks) {
            if (block.contains(coords.x, coords.y)) {
                block.isSelected = true;
                state.selectedBlock = block;
                state.isMovingBlock = true;
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
                drawGrid();
                return;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        lastMouseEvent = e;
        const coords = getCanvasCoordinates(e);
        
        // Handle connection vertical line dragging
        if (state.isDraggingConnection && state.selectedConnection) {
            state.selectedConnection.verticalX = coords.x - state.connectionDragOffset;
            drawGrid();
            return;
        }
        
        // Handle label dragging
        if (state.selectedBlock?.isDraggingLabel) {
            state.selectedBlock.labelX = coords.x - state.labelOffset.x;
            state.selectedBlock.labelY = coords.y - state.labelOffset.y;
            drawGrid();
            return;
        }
        
        // Always redraw when creating connection to show preview
        if (state.isCreatingConnection) {
            drawGrid();
            return;
        }

        if (state.isMovingBlock && state.selectedBlock) {
            const snapped = snapToGrid(coords.x, coords.y);
            
            // Update block position
            state.selectedBlock.x = snapped.x;
            state.selectedBlock.y = snapped.y;
            
            // Update block's connectors
            state.selectedBlock.updateConnectors();
            
            // Force update of all connections involving this block
            state.connections.forEach(conn => {
                if (conn.sourceBlock === state.selectedBlock || 
                    conn.targetBlock === state.selectedBlock) {
                    // Update connector positions first
                    conn.sourceBlock.updateConnectors();
                    conn.targetBlock.updateConnectors();
                    // Then update the connection path
                    conn.updatePath();
                }
            });
            
            drawGrid();
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (state.isDraggingConnection) {
            state.isDraggingConnection = false;
            state.selectedConnection = null;
            state.connectionDragOffset = 0;
            canvas.style.cursor = 'default';
        } else if (state.selectedBlock?.isDraggingLabel) {
            state.selectedBlock.isDraggingLabel = false;
            canvas.style.cursor = 'default';
        } else if (state.isMovingBlock) {
            state.isMovingBlock = false;
            canvas.style.cursor = 'default';
        }
        drawGrid();
    });

    // Add event listener for clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
        clearAll();
    });

    // Add event listener for trash button after other event listeners
    document.getElementById('trashBtn').addEventListener('click', () => {
        removeSelectedItem();
    });

    // Add event listener for save button
    document.getElementById('saveBtn').addEventListener('click', () => {
        saveToFile();
    });

    // Add event listener for load button
    document.getElementById('loadBtn').addEventListener('click', () => {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        loadFromFile(event.target.result);
                    } catch (error) {
                        console.error('Error loading file:', error);
                        alert('Invalid save file format');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        fileInput.click();
    });
})();