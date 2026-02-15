// Data storage
let maleData = [];
let femaleData = [];
let selectedMaleRow = null;
let selectedFemaleRow = null;

// Column definitions
const columns = [
    'wingL', 'mean_chordL', 'wingarea', 'moa1', 'moa2', 'moa3',
    'moaND1', 'moaND2', 'moaND3', 'wingmass', 'wingAR', 'bodyL',
    'maxbodywidth', 'bodymass', 'Ixx_bw', 'Iyy_bw', 'Izz_bw', 'Ixz_bw',
    'wbf1', 'wbf2', 'CWing_loading', 'BandWmass', 'effective_HW_loading',
    'L1', 'head_L', 'thorax_L', 'abdomen_L', 'head_L_PBL', 'thorax_L_PBL', 'abdomen_L_PBL'
];

// Initialize with one empty row
function initializeTables() {
    addMaleRow();
    addFemaleRow();
}

// Create data row object with species name
function createDataRow(speciesName = '') {
    const row = {
        species: speciesName
    };
    columns.forEach(col => {
        row[col] = '';
    });
    return row;
}

// Add male row
function addMaleRow() {
    const newRow = createDataRow();
    maleData.push(newRow);
    renderMaleTable();
}

// Add female row
function addFemaleRow() {
    const newRow = createDataRow();
    femaleData.push(newRow);
    renderFemaleTable();
}

// Delete male row
function deleteMaleRow() {
    if (selectedMaleRow !== null) {
        maleData.splice(selectedMaleRow, 1);
        selectedMaleRow = null;
        renderMaleTable();
    } else {
        alert('Please select a row to delete');
    }
}

// Delete female row
function deleteFemaleRow() {
    if (selectedFemaleRow !== null) {
        femaleData.splice(selectedFemaleRow, 1);
        selectedFemaleRow = null;
        renderFemaleTable();
    } else {
        alert('Please select a row to delete');
    }
}

// Handle drag over event
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    
    const dropZone = event.target.closest('.drag-drop-zone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

// Handle drag leave event
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.target.closest('.drag-drop-zone');
    if (dropZone && event.target === dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

// Handle male CSV drop
function handleMaleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = document.getElementById('maleDragZone');
    dropZone.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please drop a CSV file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);
        
        if (rows.length === 0) {
            alert('CSV file is empty');
            return;
        }
        
        // Check if first row is a header row (contains column names)
        let startIndex = 0;
        const firstRow = rows[0];
        if (isHeaderRow(firstRow)) {
            startIndex = 1;
        }
        
        if (startIndex >= rows.length) {
            alert('CSV file contains only headers');
            return;
        }
        
        // Check if data is empty or only contains empty rows
        const hasExistingData = maleData.some(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );
        
        let newRowsCount = rows.length - startIndex;
        
        if (!hasExistingData) {
            // Replace existing empty rows
            maleData = [];
        }
        
        const previousCount = maleData.length;
        
        // Process each row starting from startIndex
        for (let i = startIndex; i < rows.length; i++) {
            const values = rows[i];
            const rowNum = hasExistingData ? previousCount + (i - startIndex) + 1 : (i - startIndex) + 1;
            const speciesName = values[0] || `Row ${rowNum}`;
            const dataRow = createDataRow(speciesName);
            
            // Map remaining values to columns
            for (let j = 1; j < values.length && j - 1 < columns.length; j++) {
                const value = values[j].trim();
                if (value) {
                    dataRow[columns[j - 1]] = value;
                }
            }
            
            maleData.push(dataRow);
        }
        
        selectedMaleRow = null;
        renderMaleTable();
        const actionWord = hasExistingData ? 'Added' : 'Loaded';
        alert(`${actionWord} ${newRowsCount} male specimens. Total: ${maleData.length} rows`);
    };
    
    reader.readAsText(file);
}

// Handle female CSV drop
function handleFemaleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = document.getElementById('femaleDragZone');
    dropZone.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please drop a CSV file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);
        
        if (rows.length === 0) {
            alert('CSV file is empty');
            return;
        }
        
        // Check if first row is a header row (contains column names)
        let startIndex = 0;
        const firstRow = rows[0];
        if (isHeaderRow(firstRow)) {
            startIndex = 1;
        }
        
        if (startIndex >= rows.length) {
            alert('CSV file contains only headers');
            return;
        }
        
        // Check if data is empty or only contains empty rows
        const hasExistingData = femaleData.some(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );
        
        let newRowsCount = rows.length - startIndex;
        
        if (!hasExistingData) {
            // Replace existing empty rows
            femaleData = [];
        }
        
        const previousCount = femaleData.length;
        
        // Process each row starting from startIndex
        for (let i = startIndex; i < rows.length; i++) {
            const values = rows[i];
            const rowNum = hasExistingData ? previousCount + (i - startIndex) + 1 : (i - startIndex) + 1;
            const speciesName = values[0] || `Row ${rowNum}`;
            const dataRow = createDataRow(speciesName);
            
            // Map remaining values to columns
            for (let j = 1; j < values.length && j - 1 < columns.length; j++) {
                const value = values[j].trim();
                if (value) {
                    dataRow[columns[j - 1]] = value;
                }
            }
            
            femaleData.push(dataRow);
        }
        
        selectedFemaleRow = null;
        renderFemaleTable();
        const actionWord = hasExistingData ? 'Added' : 'Loaded';
        alert(`${actionWord} ${newRowsCount} female specimens. Total: ${femaleData.length} rows`);
    };
    
    reader.readAsText(file);
}

// Detect if a row is a header row (contains column names)
function isHeaderRow(row) {
    if (!row || row.length === 0) return false;
    
    // List of possible header names (case-insensitive)
    const headerKeywords = ['species', 'wingL', 'mean_chordL', 'wingarea', 'moa1', 'moa2', 'moa3',
                            'moaND1', 'moaND2', 'moaND3', 'wingmass', 'wingAR', 'bodyL',
                            'maxbodywidth', 'bodymass', 'Ixx_bw', 'Iyy_bw', 'Izz_bw', 'Ixz_bw',
                            'wbf1', 'wbf2', 'CWing_loading', 'BandWmass', 'effective_HW_loading',
                            'L1', 'head_L', 'thorax_L', 'abdomen_L', 'head_L_PBL', 'thorax_L_PBL', 'abdomen_L_PBL',
                            'name', 'id', 'specimen', 'header', 'description'];
    
    // Check if any cell in the row matches header keywords
    for (let cell of row) {
        const cellLower = cell.trim().toLowerCase();
        // Check if cell matches or is partially similar to column names
        for (let keyword of headerKeywords) {
            if (cellLower === keyword || cellLower === keyword.toLowerCase() || 
                keyword.includes(cellLower) || cellLower.includes(keyword)) {
                return true;
            }
        }
        
        // Also check if cell looks like a typical header (plural, contains "name", etc.)
        if (cellLower.includes('name') || cellLower.includes('id') || 
            cellLower.includes('species') || cellLower.includes('specimen')) {
            return true;
        }
    }
    
    // Check if all non-empty cells in first row are short (typical of headers)
    // and none are numbers
    const nonEmptyCells = row.filter(cell => cell.trim() !== '');
    if (nonEmptyCells.length > 0 && 
        nonEmptyCells.every(cell => cell.trim().length < 30) &&
        nonEmptyCells.some(cell => isNaN(parseFloat(cell)))) {
        // If we have short non-numeric values, likely headers
        return nonEmptyCells.every(cell => isNaN(parseFloat(cell.trim())));
    }
    
    return false;
}

// Parse CSV content
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const rows = [];
    
    for (let i = 0; i < lines.length; i++) {
        // Simple CSV parsing - handles quoted values
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        if (values.some(v => v !== '')) {
            rows.push(values);
        }
    }
    
    return rows;
}

// Handle male CSV upload
function handleMaleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);
        
        if (rows.length === 0) {
            alert('CSV file is empty');
            return;
        }
        
        // Check if first row is a header row (contains column names)
        let startIndex = 0;
        const firstRow = rows[0];
        if (isHeaderRow(firstRow)) {
            startIndex = 1;
        }
        
        if (startIndex >= rows.length) {
            alert('CSV file contains only headers');
            return;
        }
        
        // Check if data is empty or only contains empty rows
        const hasExistingData = maleData.some(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );
        
        let newRowsCount = rows.length - startIndex;
        
        if (!hasExistingData) {
            // Replace existing empty rows
            maleData = [];
        }
        
        const previousCount = maleData.length;
        
        // Process each row starting from startIndex
        for (let i = startIndex; i < rows.length; i++) {
            const values = rows[i];
            const rowNum = hasExistingData ? previousCount + (i - startIndex) + 1 : (i - startIndex) + 1;
            const speciesName = values[0] || `Row ${rowNum}`;
            const dataRow = createDataRow(speciesName);
            
            // Map remaining values to columns
            for (let j = 1; j < values.length && j - 1 < columns.length; j++) {
                const value = values[j].trim();
                if (value) {
                    dataRow[columns[j - 1]] = value;
                }
            }
            
            maleData.push(dataRow);
        }
        
        selectedMaleRow = null;
        renderMaleTable();
        const actionWord = hasExistingData ? 'Added' : 'Loaded';
        alert(`${actionWord} ${newRowsCount} male specimens. Total: ${maleData.length} rows`);
    };
    
    reader.readAsText(file);
}

// Handle female CSV upload
function handleFemaleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);
        
        if (rows.length === 0) {
            alert('CSV file is empty');
            return;
        }
        
        // Check if first row is a header row (contains column names)
        let startIndex = 0;
        const firstRow = rows[0];
        if (isHeaderRow(firstRow)) {
            startIndex = 1;
        }
        
        if (startIndex >= rows.length) {
            alert('CSV file contains only headers');
            return;
        }
        
        // Store count of new rows being added
        const newRowsCount = rows.length - startIndex;
        const previousCount = femaleData.length;
        
        // Append to existing female data
        for (let i = startIndex; i < rows.length; i++) {
            const values = rows[i];
            const speciesName = values[0] || `Row ${previousCount + (i - startIndex) + 1}`;
            const dataRow = createDataRow(speciesName);
            
            // Map remaining values to columns
            for (let j = 1; j < values.length && j - 1 < columns.length; j++) {
                const value = values[j].trim();
                if (value) {
                    dataRow[columns[j - 1]] = value;
                }
            }
            
            femaleData.push(dataRow);
        }
        
        selectedFemaleRow = null;
        renderFemaleTable();
        alert(`Added ${newRowsCount} female specimens. Total: ${femaleData.length} rows`);
    };
    
    reader.readAsText(file);
}

// Format numbers for display (handles scientific notation)
function formatNumber(num) {
    if (isNaN(num)) return 'N/A';
    // For very small or very large numbers, use scientific notation
    if (Math.abs(num) < 0.00001 || Math.abs(num) > 1000000) {
        return num.toExponential(4);
    }
    return num.toFixed(4);
}

// Validate scientific notation and numbers
function isValidNumber(value) {
    if (value === '' || value === null) return true;
    // Matches regular numbers and scientific notation (e.g., 1.23E-05, 1E+10, etc.)
    return /^[+-]?(\d+\.?\d*|\d*\.\d+)([eE][+-]?\d+)?$/.test(value.trim());
}

// Render male table
function renderMaleTable() {
    const tbody = document.getElementById('maleBody');
    tbody.innerHTML = '';

    maleData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = index;
        tr.className = selectedMaleRow === index ? 'selected' : '';

        // Row number/species name - clickable to select
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.style.cursor = 'pointer';
        rowNumTd.style.minWidth = '100px';
        
        // Create species name input
        const speciesInput = document.createElement('input');
        speciesInput.type = 'text';
        speciesInput.value = row.species || '';
        speciesInput.placeholder = 'Species';
        speciesInput.style.width = '100%';
        speciesInput.addEventListener('input', (e) => {
            maleData[index].species = e.target.value;
        });
        speciesInput.onclick = (e) => {
            e.stopPropagation();
        };
        rowNumTd.appendChild(speciesInput);
        rowNumTd.onclick = (e) => {
            if (e.target !== speciesInput) {
                e.stopPropagation();
                selectedMaleRow = selectedMaleRow === index ? null : index;
                renderMaleTable();
            }
        };
        tr.appendChild(rowNumTd);

        // Data columns
        columns.forEach((col, colIdx) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = row[col] || '';
            input.placeholder = '';
            input.dataset.col = col;
            input.dataset.rowIdx = index;
            
            // Use addEventListener for more reliable event handling
            input.addEventListener('input', function(e) {
                const value = this.value.trim();
                // Accept any input while typing
                maleData[index][col] = value;
            });
            
            input.addEventListener('paste', function(e) {
                // Allow default paste behavior
                setTimeout(() => {
                    const value = this.value.trim();
                    maleData[index][col] = value;
                }, 10);
            });
            
            input.addEventListener('blur', function(e) {
                // Validate on blur - warn if invalid
                const value = this.value.trim();
                if (value && !isValidNumber(value)) {
                    console.warn(`Invalid number format in ${col}: "${value}"`);
                }
            });
            
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// Render female table
function renderFemaleTable() {
    const tbody = document.getElementById('femaleBody');
    tbody.innerHTML = '';

    femaleData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = index;
        tr.className = selectedFemaleRow === index ? 'selected' : '';

        // Row number/species name - clickable to select
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.style.cursor = 'pointer';
        rowNumTd.style.minWidth = '100px';
        
        // Create species name input
        const speciesInput = document.createElement('input');
        speciesInput.type = 'text';
        speciesInput.value = row.species || '';
        speciesInput.placeholder = 'Species';
        speciesInput.style.width = '100%';
        speciesInput.addEventListener('input', (e) => {
            femaleData[index].species = e.target.value;
        });
        speciesInput.onclick = (e) => {
            e.stopPropagation();
        };
        rowNumTd.appendChild(speciesInput);
        rowNumTd.onclick = (e) => {
            if (e.target !== speciesInput) {
                e.stopPropagation();
                selectedFemaleRow = selectedFemaleRow === index ? null : index;
                renderFemaleTable();
            }
        };
        tr.appendChild(rowNumTd);

        // Data columns
        columns.forEach((col, colIdx) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = row[col] || '';
            input.placeholder = '';
            input.dataset.col = col;
            input.dataset.rowIdx = index;
            
            // Use addEventListener for more reliable event handling
            input.addEventListener('input', function(e) {
                const value = this.value.trim();
                // Accept any input while typing
                femaleData[index][col] = value;
            });
            
            input.addEventListener('paste', function(e) {
                // Allow default paste behavior
                setTimeout(() => {
                    const value = this.value.trim();
                    femaleData[index][col] = value;
                }, 10);
            });
            
            input.addEventListener('blur', function(e) {
                // Validate on blur - warn if invalid
                const value = this.value.trim();
                if (value && !isValidNumber(value)) {
                    console.warn(`Invalid number format in ${col}: "${value}"`);
                }
            });
            
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// Compile data and generate graph
// Global variables for graph navigation
let allGraphs = [];
let currentGraphIndex = 0;

function compileAndGraph() {
    // Filter out empty rows
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    if (validMaleData.length === 0 && validFemaleData.length === 0) {
        alert('Please enter at least some data before compiling.');
        return;
    }

    // Create individual graphs for each variable
    allGraphs = [];

    columns.forEach((column, colIdx) => {
        const diffs = [];
        
        // Calculate all pairwise differentials for this variable
        validMaleData.forEach((maleRow, maleIdx) => {
            validFemaleData.forEach((femaleRow, femaleIdx) => {
                const maleVal = parseFloat(maleRow[column]);
                const femaleVal = parseFloat(femaleRow[column]);

                if (!isNaN(maleVal) && !isNaN(femaleVal)) {
                    const differential = femaleVal - maleVal;
                    diffs.push({
                        value: differential,
                        maleRowIdx: maleIdx + 1,
                        femaleRowIdx: femaleIdx + 1,
                        maleSpecies: maleRow.species || `Male Row ${maleIdx + 1}`,
                        femaleSpecies: femaleRow.species || `Female Row ${femaleIdx + 1}`,
                        maleVal: maleVal,
                        femaleVal: femaleVal
                    });
                }
            });
        });

        if (diffs.length === 0) return; // Skip if no data

        // Create trace for this variable
        const xValues = diffs.map((_, idx) => idx + 1);
        const yValues = diffs.map(d => d.value);
        const hoverText = diffs.map(d => 
            `<b>${d.maleSpecies} (Male Row ${d.maleRowIdx}) vs ${d.femaleSpecies} (Female Row ${d.femaleRowIdx})</b><br>` +
            `Male Value: ${formatNumber(d.maleVal)}<br>` +
            `Female Value: ${formatNumber(d.femaleVal)}<br>` +
            `<b>Differential: ${formatNumber(d.value)}</b>`
        );

        const trace = {
            x: xValues,
            y: yValues,
            mode: 'markers+lines',
            type: 'scatter',
            hovertext: hoverText,
            hoverinfo: 'text',
            marker: {
                size: 8,
                color: '#667eea',
                opacity: 0.8,
                line: {
                    color: '#764ba2',
                    width: 2
                }
            },
            line: {
                color: '#667eea',
                width: 2
            }
        };

        // Create layout for this variable
        const layout = {
            title: {
                text: `<b>${column}</b><br><sub>All pairwise male-female differentials</sub>`,
                font: { size: 18 }
            },
            xaxis: {
                title: 'Pairwise Comparison Index',
                showgrid: true,
                zeroline: false,
                gridwidth: 1,
                gridcolor: '#e0e0e0'
            },
            yaxis: {
                title: 'Differential (Female - Male)',
                showgrid: true,
                zeroline: true,
                zerolinewidth: 2,
                zerolinecolor: '#999',
                gridwidth: 1,
                gridcolor: '#e0e0e0'
            },
            plot_bgcolor: '#fafafa',
            paper_bgcolor: 'white',
            hovermode: 'closest',
            showlegend: false,
            margin: {
                t: 100,
                b: 80,
                l: 100,
                r: 80
            },
            responsive: true,
            autosize: true,
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                size: 12,
                color: '#333'
            }
        };

        allGraphs.push({
            column: column,
            trace: trace,
            layout: layout
        });
    });

    if (allGraphs.length === 0) {
        alert('No valid data to graph. Please ensure both male and female data have numeric values.');
        return;
    }

    // Display the first graph
    currentGraphIndex = 0;
    displayCurrentGraph();

    // Show navigation controls
    document.getElementById('graphNavigationControls').style.display = 'flex';
    updateNavigationButtons();

    // Log summary statistics
    console.log('Graphs Generated Successfully');
    console.log(`Total Graph Variables: ${allGraphs.length}`);
    console.log(`Total Male Saturniidae: ${validMaleData.length}`);
    console.log(`Total Female Saturniidae: ${validFemaleData.length}`);
    console.log(`Total Comparisons per Variable: ${validMaleData.length * validFemaleData.length}`);
}

function displayCurrentGraph() {
    if (allGraphs.length === 0) return;

    const currentGraph = allGraphs[currentGraphIndex];
    
    // Clear previous graph
    const graphContainer = document.getElementById('graphContainer');
    graphContainer.innerHTML = '';
    graphContainer.className = 'graph-container has-graph';

    // Update layout with responsive settings
    const layout = {
        ...currentGraph.layout,
        autosize: true,
        width: graphContainer.parentElement.offsetWidth - 60, // Account for padding
        height: 600
    };

    // Create graph
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot('graphContainer', [currentGraph.trace], layout, config);

    // Update label
    updateGraphLabel();

    // Scroll graph into view with smooth scrolling
    setTimeout(() => {
        graphContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function updateGraphLabel() {
    const label = document.getElementById('currentGraphLabel');
    const graph = allGraphs[currentGraphIndex];
    label.textContent = `${graph.column} (${currentGraphIndex + 1} of ${allGraphs.length})`;
}

function navigateToNextGraph() {
    if (currentGraphIndex < allGraphs.length - 1) {
        currentGraphIndex++;
        displayCurrentGraph();
        updateNavigationButtons();
    }
}

function navigateToPreviousGraph() {
    if (currentGraphIndex > 0) {
        currentGraphIndex--;
        displayCurrentGraph();
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');

    prevBtn.disabled = currentGraphIndex === 0;
    nextBtn.disabled = currentGraphIndex === allGraphs.length - 1;
}


// Handle window resize for responsive graphs
window.addEventListener('resize', () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer && graphContainer.classList.contains('has-graph') && allGraphs.length > 0) {
        const currentGraph = allGraphs[currentGraphIndex];
        const width = graphContainer.parentElement.offsetWidth - 60;
        const height = 600;
        Plotly.relayout('graphContainer', { width: width, height: height });
    }
});

// Keyboard navigation for graphs
document.addEventListener('keydown', (event) => {
    if (allGraphs.length > 0) {
        if (event.key === 'ArrowLeft') {
            navigateToPreviousGraph();
        } else if (event.key === 'ArrowRight') {
            navigateToNextGraph();
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTables();
});
