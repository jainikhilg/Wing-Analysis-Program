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
    console.log('[DRAG] dragover event');
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    
    // Find the drag zone (could be the target itself or a parent)
    let dropZone = event.target.closest('.drag-drop-zone');
    if (!dropZone) {
        dropZone = event.target;
    }
    
    if (dropZone && dropZone.classList) {
        console.log('[DRAG] Adding drag-over class');
        dropZone.classList.add('drag-over');
    }
}

// Handle drag leave event
function handleDragLeave(event) {
    console.log('[DRAG] dragleave event');
    event.preventDefault();
    event.stopPropagation();
    
    // Only remove drag-over if we're actually leaving the drop zone
    const dropZone = event.target.closest('.drag-drop-zone');
    if (dropZone) {
        // Check if we're leaving the zone entirely (not just moving to a child)
        if (event.target === dropZone || 
            (event.clientX < dropZone.getBoundingClientRect().left ||
             event.clientX > dropZone.getBoundingClientRect().right ||
             event.clientY < dropZone.getBoundingClientRect().top ||
             event.clientY > dropZone.getBoundingClientRect().bottom)) {
            console.log('[DRAG] Removing drag-over class');
            dropZone.classList.remove('drag-over');
        }
    }
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

// Process multiple CSV files and add rows in order
function processMultipleCSVFiles(fileList, tableName) {
    if (!fileList || fileList.length === 0) {
        console.error('[PROCESS] No files provided');
        return;
    }
    
    // Get the data array and render function for this table
    const isMALE = tableName === 'male';
    const targetArray = isMALE ? maleData : femaleData;
    const renderFn = isMALE ? renderMaleTable : renderFemaleTable;
    
    // Convert FileList to array and filter CSV files
    const csvFiles = Array.from(fileList).filter(f => 
        f.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFiles.length === 0) {
        alert('❌ Please select only CSV files');
        return;
    }
    
    console.log(`[PROCESS] Processing ${csvFiles.length} file(s) for ${tableName} table`);
    
    let completedFiles = 0;
    let totalRowsAdded = 0;
    const allRows = [];
    
    // Process each file
    csvFiles.forEach((file, idx) => {
        console.log(`[PROCESS] Starting to read file ${idx + 1}/${csvFiles.length}: ${file.name}`);
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const parsedRows = parseCSV(csvText);
                
                if (!parsedRows || parsedRows.length === 0) {
                    console.warn(`[PROCESS] File ${file.name} is empty`);
                    completedFiles++;
                    checkIfDone();
                    return;
                }
                
                // Skip header row
                let startRow = 0;
                if (isHeaderRow(parsedRows[0])) {
                    startRow = 1;
                }
                
                // Extract data rows
                for (let i = startRow; i < parsedRows.length; i++) {
                    const csvRow = parsedRows[i];
                    const speciesName = (csvRow[0] || '').trim() || `Specimen`;
                    
                    // Create new data row
                    const dataRow = {
                        species: speciesName
                    };
                    
                    // Add all columns
                    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
                        const csvColIdx = colIdx + 1; // CSV has species in column 0
                        dataRow[columns[colIdx]] = (csvRow[csvColIdx] || '').trim();
                    }
                    
                    allRows.push(dataRow);
                    totalRowsAdded++;
                }
                
                console.log(`[PROCESS] File ${idx + 1} complete: added ${parsedRows.length - startRow} rows`);
                completedFiles++;
                checkIfDone();
                
            } catch (error) {
                console.error(`[PROCESS] Error processing file ${file.name}:`, error);
                completedFiles++;
                checkIfDone();
            }
        };
        
        reader.onerror = (e) => {
            console.error(`[PROCESS] Failed to read file: ${file.name}`);
            completedFiles++;
            checkIfDone();
        };
        
        reader.readAsText(file);
    });
    
    // Check if all files are done processing
    function checkIfDone() {
        if (completedFiles === csvFiles.length) {
            // All files done, now update the table
            console.log(`[PROCESS] All files processed. Adding ${totalRowsAdded} rows to ${tableName} table`);
            
            if (isMALE) {
                // Count empty rows at the start to fill them first
                let emptyRowsAtStart = 0;
                for (let row of maleData) {
                    const hasData = columns.some(col => row[col] && row[col].trim() !== '');
                    if (!hasData && (!row.species || row.species.trim() === '')) {
                        emptyRowsAtStart++;
                    } else {
                        break; // Stop counting when we hit a non-empty row
                    }
                }
                
                // Fill empty rows first, then append remaining
                if (emptyRowsAtStart > 0 && allRows.length > 0) {
                    const rowsToFill = Math.min(emptyRowsAtStart, allRows.length);
                    for (let i = 0; i < rowsToFill; i++) {
                        maleData[i] = allRows[i];
                    }
                    if (allRows.length > rowsToFill) {
                        maleData.push(...allRows.slice(rowsToFill));
                    }
                } else {
                    maleData.push(...allRows);
                }
                
                selectedMaleRow = null;
            } else {
                // Count empty rows at the start to fill them first
                let emptyRowsAtStart = 0;
                for (let row of femaleData) {
                    const hasData = columns.some(col => row[col] && row[col].trim() !== '');
                    if (!hasData && (!row.species || row.species.trim() === '')) {
                        emptyRowsAtStart++;
                    } else {
                        break; // Stop counting when we hit a non-empty row
                    }
                }
                
                // Fill empty rows first, then append remaining
                if (emptyRowsAtStart > 0 && allRows.length > 0) {
                    const rowsToFill = Math.min(emptyRowsAtStart, allRows.length);
                    for (let i = 0; i < rowsToFill; i++) {
                        femaleData[i] = allRows[i];
                    }
                    if (allRows.length > rowsToFill) {
                        femaleData.push(...allRows.slice(rowsToFill));
                    }
                } else {
                    femaleData.push(...allRows);
                }
                
                selectedFemaleRow = null;
            }
            
            // Render the table
            renderFn();
            
            alert(`✅ Loaded ${csvFiles.length} file(s)\n✓ Added ${totalRowsAdded} row(s)\n✓ Total: ${targetArray.length} rows`);
            console.log(`[PROCESS] Complete! Table now has ${targetArray.length} rows`);
        }
    }
}

// Handle male CSV upload
function handleMaleCSVUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    processMultipleCSVFiles(files, 'male');
}

// Handle female CSV upload
function handleFemaleCSVUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    processMultipleCSVFiles(files, 'female');
}

// Handle male CSV drop
function handleMaleDrop(event) {
    console.log('[DRAG] Male drop event triggered');
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = document.getElementById('maleDragZone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
    
    const files = event.dataTransfer.files;
    console.log(`[DRAG] Dropped ${files.length} files on male zone`);
    
    if (!files || files.length === 0) {
        console.warn('[DRAG] No files in drop event');
        return;
    }
    
    processMultipleCSVFiles(files, 'male');
}

// Handle female CSV drop
function handleFemaleDrop(event) {
    console.log('[DRAG] Female drop event triggered');
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = document.getElementById('femaleDragZone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
    
    const files = event.dataTransfer.files;
    console.log(`[DRAG] Dropped ${files.length} files on female zone`);
    
    if (!files || files.length === 0) {
        console.warn('[DRAG] No files in drop event');
        return;
    }
    
    processMultipleCSVFiles(files, 'female');
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
            layout: layout,
            diffs: diffs
        });
    });

    if (allGraphs.length === 0) {
        alert('No valid data to graph. Please ensure both male and female data have numeric values.');
        return;
    }

    // Store graph data for export
    currentGraphData = allGraphs.map(g => ({
        column: g.column,
        diffs: g.diffs
    }));

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

    // Show export button group for pairwise graphs
    document.getElementById('graphExportGroup').style.display = 'block';
    document.getElementById('sdiExportGroup').style.display = 'none';

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
    // Check if in SDI pairwise mode
    if (sdiPairwiseData && currentGraphIndex === -1) {
        navigateToSDIPairwiseNext();
        return;
    }
    
    if (currentGraphIndex < allGraphs.length - 1) {
        currentGraphIndex++;
        displayCurrentGraph();
        updateNavigationButtons();
    }
}

function navigateToPreviousGraph() {
    // Check if in SDI pairwise mode
    if (sdiPairwiseData && currentGraphIndex === -1) {
        navigateToSDIPairwisePrev();
        return;
    }
    
    if (currentGraphIndex > 0) {
        currentGraphIndex--;
        displayCurrentGraph();
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');

    // Check if in SDI pairwise mode
    if (sdiPairwiseData && currentGraphIndex === -1) {
        // In pairwise mode, disable based on pairwise data length
        prevBtn.disabled = currentSDIPairwiseIndex === 0;
        nextBtn.disabled = currentSDIPairwiseIndex === sdiPairwiseData.length - 1;
    } else {
        // In normal graph mode
        prevBtn.disabled = currentGraphIndex === 0;
        nextBtn.disabled = currentGraphIndex === allGraphs.length - 1;
    }
}


// Generate Sexual Dimorphism Index graph
function generateSexualDimorphismIndex() {
    // Reset SDI pairwise data
    sdiPairwiseData = null;
    currentSDIPairwiseIndex = 0;
    
    // Filter out empty rows
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    if (validMaleData.length === 0 || validFemaleData.length === 0) {
        alert('Please enter data for both male and female specimens before generating SDI.');
        return;
    }

    // Calculate SDI for each variable
    const sdiData = [];

    columns.forEach((column) => {
        // Calculate mean of male values
        const maleValues = validMaleData
            .map(row => parseFloat(row[column]))
            .filter(val => !isNaN(val));
        
        // Calculate mean of female values
        const femaleValues = validFemaleData
            .map(row => parseFloat(row[column]))
            .filter(val => !isNaN(val));

        if (maleValues.length > 0 && femaleValues.length > 0) {
            const maleMean = maleValues.reduce((a, b) => a + b, 0) / maleValues.length;
            const femaleMean = femaleValues.reduce((a, b) => a + b, 0) / femaleValues.length;

            // Calculate SDI: (mean_female / mean_male) - 1
            if (maleMean !== 0) {
                const sdi = (femaleMean / maleMean) - 1;
                sdiData.push({
                    variable: column,
                    sdi: sdi,
                    maleMean: maleMean,
                    femaleMean: femaleMean,
                    maleCount: maleValues.length,
                    femaleCount: femaleValues.length
                });
            }
        }
    });

    if (sdiData.length === 0) {
        alert('No valid numeric data to calculate Sexual Dimorphism Index.');
        return;
    }

    // Create trace for SDI graph
    const xLabels = sdiData.map(d => d.variable);
    const yValues = sdiData.map(d => d.sdi);
    const hoverText = sdiData.map(d => 
        `<b>${d.variable}</b><br>` +
        `Male Mean (n=${d.maleCount}): ${formatNumber(d.maleMean)}<br>` +
        `Female Mean (n=${d.femaleCount}): ${formatNumber(d.femaleMean)}<br>` +
        `<b>SDI: ${formatNumber(d.sdi)}</b>`
    );

    // Determine colors based on positive/negative SDI
    const colors = yValues.map(val => val >= 0 ? '#667eea' : '#f76062');

    const trace = {
        x: xLabels,
        y: yValues,
        mode: 'markers+lines',
        type: 'scatter',
        hovertext: hoverText,
        hoverinfo: 'text',
        marker: {
            size: 10,
            color: colors,
            opacity: 0.8,
            line: {
                color: colors,
                width: 2
            }
        },
        line: {
            color: '#999',
            width: 2
        }
    };

    const layout = {
        title: {
            text: '<b>Sexual Dimorphism Index (SDI)</b><br><sub>(Mean Female / Mean Male) - 1</sub>',
            font: { size: 20 }
        },
        xaxis: {
            title: 'Morphometric Variables',
            showgrid: true,
            zeroline: false,
            gridwidth: 1,
            gridcolor: '#e0e0e0',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Sexual Dimorphism Index',
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
            t: 120,
            b: 150,
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

    const graphContainer = document.getElementById('graphContainer');
    graphContainer.innerHTML = '';
    graphContainer.className = 'graph-container has-graph sdi-graph';

    const width = graphContainer.parentElement.offsetWidth - 60;
    const height = 700;

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    const finalLayout = {
        ...layout,
        width: width,
        height: height
    };

    Plotly.newPlot('graphContainer', [trace], finalLayout, config);

    // Show SDI export group, hide pairwise export group
    document.getElementById('sdiExportGroup').style.display = 'block';
    document.getElementById('graphExportGroup').style.display = 'none';

    // Reset graph navigation for SDI view
    document.getElementById('graphNavigationControls').style.display = 'none';
    currentGraphIndex = -1; // Flag to indicate SDI view

    // Log summary
    console.log('Sexual Dimorphism Index Generated Successfully');
    console.log(`Total Variables Analyzed: ${sdiData.length}`);
    console.log(`Male Specimens: ${validMaleData.length}`);
    console.log(`Female Specimens: ${validFemaleData.length}`);

    // Scroll graph into view
    setTimeout(() => {
        graphContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Generate Mean Differences Summary
function generateMeanDifferencesSummary() {
    // Filter out empty rows
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    if (validMaleData.length === 0 || validFemaleData.length === 0) {
        alert('Please enter data for both male and female specimens.');
        return;
    }

    const summaryData = [];

    columns.forEach((column) => {
        // Get male values
        const maleValues = validMaleData
            .map(row => parseFloat(row[column]))
            .filter(val => !isNaN(val));
        
        // Get female values
        const femaleValues = validFemaleData
            .map(row => parseFloat(row[column]))
            .filter(val => !isNaN(val));

        if (maleValues.length > 0 && femaleValues.length > 0) {
            const maleMean = calculateMean(maleValues);
            const femaleMean = calculateMean(femaleValues);
            
            // Mean pairwise difference (Female Mean - Male Mean)
            const meanDifference = femaleMean - maleMean;
            
            // Sexual Dimorphism Index
            let sdi = null;
            if (maleMean !== 0) {
                sdi = (femaleMean / maleMean) - 1;
            }

            summaryData.push({
                variable: column,
                maleMean: maleMean,
                femaleMean: femaleMean,
                meanDifference: meanDifference,
                sdi: sdi,
                maleCount: maleValues.length,
                femaleCount: femaleValues.length
            });
        }
    });

    if (summaryData.length === 0) {
        alert('No valid numeric data found.');
        return;
    }

    const summaryContainer = document.getElementById('summaryContainer');
    const resultsDiv = document.getElementById('summaryResultsTable');
    resultsDiv.innerHTML = '';

    let html = '<div class="summary-table-wrapper">';
    html += '<table class="summary-data-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>Data Factor</th>';
    html += '<th>Male Mean</th>';
    html += '<th>Female Mean</th>';
    html += '<th>Mean Pairwise Difference<br>(Female - Male)</th>';
    html += '<th>Sexual Dimorphism Index<br>(SDI)</th>';
    html += '<th>t-value</th>';
    html += '<th>p-value</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    summaryData.forEach((item, index) => {
        // Perform t-test for this variable
        const maleValues = validMaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        const femaleValues = validFemaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        
        const tTestResult = performTTest(maleValues, femaleValues);
        const tValue = tTestResult ? formatNumber(tTestResult.tValue) : 'N/A';
        const pValue = tTestResult ? formatNumber(tTestResult.pValue) : 'N/A';
        const isSignificant = tTestResult && tTestResult.pValue < 0.05;
        const sigClass = isSignificant ? 'significant-marker' : '';
        
        const rowClass = index % 2 === 0 ? 'even' : 'odd';
        html += `<tr class="${rowClass}">`;
        html += `<td class="variable-name"><strong>${item.variable}</strong></td>`;
        html += `<td>${formatNumber(item.maleMean)}</td>`;
        html += `<td>${formatNumber(item.femaleMean)}</td>`;
        
        // Mean difference - highlight if significant
        const diffColor = Math.abs(item.meanDifference) > (Math.abs(item.maleMean) * 0.1) ? 'highlight' : '';
        html += `<td class="difference ${diffColor}">${formatNumber(item.meanDifference)}</td>`;
        
        // SDI - highlight if significant
        const sdiColor = item.sdi !== null && Math.abs(item.sdi) > 0.1 ? 'highlight' : '';
        html += `<td class="sdi ${sdiColor}">${item.sdi !== null ? formatNumber(item.sdi) : 'N/A'}</td>`;
        
        // T-value
        html += `<td class="${sigClass}">${tValue}</td>`;
        
        // P-value
        html += `<td class="${sigClass}"><strong>${pValue}${isSignificant ? ' *' : ''}</strong></td>`;
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '<p class="note" style="margin-top: 10px; font-size: 0.9em;">* indicates p < 0.05 (statistically significant)</p>';
    html += '</div>';

    // Add summary statistics
    html += '<div class="summary-stats">';
    html += '<h3>Summary Statistics</h3>';
    html += '<div class="stats-grid">';
    
    const allDifferences = summaryData.map(s => s.meanDifference);
    const allSDI = summaryData.map(s => s.sdi).filter(s => s !== null);
    
    const avgDifference = calculateMean(allDifferences);
    const avgSDI = calculateMean(allSDI);
    const maxDifference = Math.max(...allDifferences.map(d => Math.abs(d)));
    const maxSDI = Math.max(...allSDI.map(s => Math.abs(s)));
    
    html += `
        <div class="stat-box">
            <h4>Mean Pairwise Differences</h4>
            <p><strong>Average:</strong> ${formatNumber(avgDifference)}</p>
            <p><strong>Max Absolute:</strong> ${formatNumber(maxDifference)}</p>
        </div>
        <div class="stat-box">
            <h4>Sexual Dimorphism Index</h4>
            <p><strong>Average:</strong> ${formatNumber(avgSDI)}</p>
            <p><strong>Max Absolute:</strong> ${formatNumber(maxSDI)}</p>
        </div>
    `;
    
    html += '</div>';
    html += '</div>';

    resultsDiv.innerHTML = html;
    summaryContainer.style.display = 'block';
    
    // Store data for export
    currentSummaryData = summaryData;

    // Scroll to results
    setTimeout(() => {
        summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    console.log('Mean Differences Summary Generated Successfully');
}

// Calculate mean of an array
function calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculate standard deviation
function calculateStdDev(values, mean) {
    if (values.length < 2) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

// Get critical value for two-tailed t-test at alpha = 0.05
// Using common lookup table for critical values
function getCriticalValue(df) {
    // Critical values for two-tailed test at alpha = 0.05
    const criticalValues = {
        1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
        6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
        11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
        16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
        25: 2.060, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000,
        80: 1.990, 100: 1.984, 120: 1.980
    };
    
    // Find closest df in table
    if (criticalValues[df]) return criticalValues[df];
    
    for (let d in criticalValues) {
        if (d > df) return criticalValues[d];
    }
    return 1.960; // Approximate for very large df
}

// Calculate p-value from t-statistic and degrees of freedom
// Uses approximation of t-distribution
function calculatePValue(tValue, df) {
    // For very large df, approximate to normal distribution
    if (df > 1000) {
        // Normal distribution approximation
        const zValue = Math.abs(tValue);
        // Approximation using error function
        const erfApprox = Math.pow(1 - Math.exp(-1.26 * zValue * zValue), 0.5);
        const pValue = (1 - erfApprox) * 2; // Two-tailed
        return Math.max(0.0001, Math.min(0.9999, pValue));
    }
    
    // Use lookup table for common df values
    const pValueTable = {
        // df: [t_value_1: p_value_1, t_value_2: p_value_2, ...]
        // For two-tailed test
        1: [[1.0, 0.4], [1.5, 0.25], [3.08, 0.1], [6.31, 0.05], [12.7, 0.01], [63.7, 0.001]],
        2: [[1.0, 0.386], [1.5, 0.228], [2.92, 0.1], [4.30, 0.05], [9.92, 0.01], [31.6, 0.001]],
        3: [[1.0, 0.383], [1.5, 0.220], [2.35, 0.1], [3.18, 0.05], [5.84, 0.01], [12.9, 0.001]],
        4: [[1.0, 0.381], [1.5, 0.215], [2.13, 0.1], [2.78, 0.05], [4.60, 0.01], [8.61, 0.001]],
        5: [[1.0, 0.380], [1.5, 0.213], [2.01, 0.1], [2.57, 0.05], [4.03, 0.01], [6.86, 0.001]]
    };
    
    // If df is in table, interpolate
    if (pValueTable[df]) {
        const absT = Math.abs(tValue);
        const table = pValueTable[df];
        
        for (let i = 0; i < table.length - 1; i++) {
            if (absT >= table[i][0] && absT < table[i + 1][0]) {
                // Linear interpolation
                const t1 = table[i][0], p1 = table[i][1];
                const t2 = table[i + 1][0], p2 = table[i + 1][1];
                return p1 + (absT - t1) * (p2 - p1) / (t2 - t1);
            }
        }
        
        // If beyond table range
        if (absT >= table[table.length - 1][0]) {
            return table[table.length - 1][1];
        }
        return table[0][1];
    }
    
    // For other df values, use approximation based on t-distribution
    // Simplified approximation
    const absT = Math.abs(tValue);
    const c1 = 0.1;
    const c2 = 0.5;
    const c3 = 1.0;
    
    // Approximation formula for p-value
    let pVal = Math.exp(-c1 * absT - c2 * Math.log(df) - c3 * Math.log(absT));
    if (absT < 0.5) pVal = 1 - absT * 0.5;
    else if (absT < 2) pVal = Math.exp(-0.5 * absT);
    else pVal = Math.exp(-0.5 * Math.sqrt(df) * Math.log(absT / Math.sqrt(df)));
    
    // Multiply by 2 for two-tailed test
    pVal = Math.min(1, pVal * 2);
    
    return Math.max(0.0001, Math.min(0.9999, pVal));
}


// Perform Welch's t-test (doesn't assume equal variances)
function performTTest(group1, group2) {
    // Remove non-numeric values
    const values1 = group1.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const values2 = group2.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (values1.length < 2 || values2.length < 2) {
        return null;
    }
    
    const n1 = values1.length;
    const n2 = values2.length;
    const mean1 = calculateMean(values1);
    const mean2 = calculateMean(values2);
    const sd1 = calculateStdDev(values1, mean1);
    const sd2 = calculateStdDev(values2, mean2);
    
    // Standard error
    const se1 = sd1 / Math.sqrt(n1);
    const se2 = sd2 / Math.sqrt(n2);
    const se = Math.sqrt(se1 * se1 + se2 * se2);
    
    // t-value
    const tValue = (mean1 - mean2) / se;
    
    // Degrees of freedom (Welch's approximation)
    const numerator = Math.pow(se1 * se1 + se2 * se2, 2);
    const denominator = (Math.pow(se1, 4) / (n1 - 1)) + (Math.pow(se2, 4) / (n2 - 1));
    let df = Math.round(numerator / denominator);
    if (df < 1) df = 1;
    
    const criticalValue = getCriticalValue(df);
    const absT = Math.abs(tValue);
    const isSignificant = absT > criticalValue;
    
    // Calculate p-value
    const pValue = calculatePValue(tValue, df);
    
    return {
        n1: n1,
        n2: n2,
        mean1: mean1,
        mean2: mean2,
        sd1: sd1,
        sd2: sd2,
        se1: se1,
        se2: se2,
        se: se,
        tValue: tValue,
        df: df,
        criticalValue: criticalValue,
        isSignificant: isSignificant,
        pValue: pValue
    };
}

// Generate T-Test Results
function generateTTestResults() {
    // Filter out empty rows
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    if (validMaleData.length < 2 || validFemaleData.length < 2) {
        alert('Please enter at least 2 male and 2 female specimens for t-test analysis.');
        return;
    }

    const ttestContainer = document.getElementById('ttestContainer');
    const resultsDiv = document.getElementById('ttestResultsTable');
    resultsDiv.innerHTML = '';

    let html = '<div class="ttest-table-wrapper">';
    const tTestResults = [];

    columns.forEach((column) => {
        const maleValues = validMaleData.map(row => row[column]);
        const femaleValues = validFemaleData.map(row => row[column]);
        
        const result = performTTest(maleValues, femaleValues);
        
        if (!result) return;

        // Store result for export
        tTestResults.push({
            variable: column,
            ...result
        });

        const significanceText = result.isSignificant 
            ? '<span class="significant">REJECT NULL HYPOTHESIS (Significant difference)</span>' 
            : '<span class="not-significant">ACCEPT NULL HYPOTHESIS (No significant difference)</span>';

        html += `
            <div class="ttest-variable-card">
                <h3>${column}</h3>
                <div class="ttest-grid">
                    <div class="ttest-column">
                        <h4>Descriptive Statistics</h4>
                        <table class="ttest-data-table">
                            <tr>
                                <th></th>
                                <th>Male</th>
                                <th>Female</th>
                            </tr>
                            <tr>
                                <td><strong>Sample Size (n)</strong></td>
                                <td>${result.n1}</td>
                                <td>${result.n2}</td>
                            </tr>
                            <tr>
                                <td><strong>Mean</strong></td>
                                <td>${formatNumber(result.mean1)}</td>
                                <td>${formatNumber(result.mean2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Std. Deviation</strong></td>
                                <td>${formatNumber(result.sd1)}</td>
                                <td>${formatNumber(result.sd2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Std. Error</strong></td>
                                <td>${formatNumber(result.se1)}</td>
                                <td>${formatNumber(result.se2)}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="ttest-column">
                        <h4>Calculation Steps</h4>
                        <div class="ttest-calc">
                            <p><strong>Step 1: Calculate Standard Error</strong></p>
                            <p class="formula">SE = √(SE₁² + SE₂²)</p>
                            <p class="calculation">SE = √(${formatNumber(result.se1)}² + ${formatNumber(result.se2)}²)</p>
                            <p class="result">SE = ${formatNumber(result.se)}</p>
                            
                            <p><strong>Step 2: Calculate t-value</strong></p>
                            <p class="formula">t = (Mean₁ - Mean₂) / SE</p>
                            <p class="calculation">t = (${formatNumber(result.mean1)} - ${formatNumber(result.mean2)}) / ${formatNumber(result.se)}</p>
                            <p class="result">t = ${formatNumber(result.tValue)}</p>
                            
                            <p><strong>Step 3: Degrees of Freedom (Welch's)</strong></p>
                            <p class="result">df = ${result.df}</p>
                            
                            <p><strong>Step 4: Critical Value (α = 0.05, two-tailed)</strong></p>
                            <p class="result">t_critical = ±${formatNumber(result.criticalValue)}</p>
                            
                            <p><strong>Step 5: P-Value (two-tailed)</strong></p>
                            <p class="result">p-value = ${formatNumber(result.pValue)}</p>
                            
                            <p><strong>Step 6: Decision</strong></p>
                            <p class="decision">|t| = ${formatNumber(Math.abs(result.tValue))} ${Math.abs(result.tValue) > result.criticalValue ? '>' : '<'} ${formatNumber(result.criticalValue)}</p>
                            <p class="decision">p-value = ${formatNumber(result.pValue)} ${result.pValue < 0.05 ? '<' : '≥'} 0.05</p>
                            <p class="result">${significanceText}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
    ttestContainer.style.display = 'block';
    
    // Store data for export
    currentTTestData = tTestResults;

    // Scroll to results
    setTimeout(() => {
        ttestContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    console.log('T-Test Analysis Generated Successfully');
}

// Global variables for export data
let currentSummaryData = [];
let currentTTestData = [];
let currentGraphData = [];

// Helper function to download a file
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export Summary Data to CSV
function exportSummaryDataCSV() {
    if (currentSummaryData.length === 0) {
        alert('Please generate Mean Differences Summary first.');
        return;
    }

    // Filter out empty rows to match the original analysis
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    let csv = 'Data Factor,Male Mean,Female Mean,Mean Pairwise Difference,Sexual Dimorphism Index,t-value,p-value,Significant\n';
    currentSummaryData.forEach(item => {
        const sdi = item.sdi !== null ? item.sdi.toString() : 'N/A';
        
        // Calculate t-test for this variable
        const maleValues = validMaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        const femaleValues = validFemaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        
        const tTestResult = performTTest(maleValues, femaleValues);
        const tValue = tTestResult ? tTestResult.tValue.toFixed(6) : 'N/A';
        const pValue = tTestResult ? tTestResult.pValue.toFixed(4) : 'N/A';
        const isSignificant = tTestResult && tTestResult.pValue < 0.05 ? 'Yes' : 'No';
        
        csv += `${item.variable},${item.maleMean.toFixed(6)},${item.femaleMean.toFixed(6)},${item.meanDifference.toFixed(6)},${sdi},${tValue},${pValue},${isSignificant}\n`;
    });

    downloadFile(csv, 'mean_differences_summary.csv', 'text/csv');
}

// Export Summary Data to JSON
function exportSummaryDataJSON() {
    if (currentSummaryData.length === 0) {
        alert('Please generate Mean Differences Summary first.');
        return;
    }

    // Filter out empty rows to match the original analysis
    const validMaleData = maleData.filter(row => 
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );
    const validFemaleData = femaleData.filter(row =>
        Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
    );

    // Enrich data with t-test results
    const enrichedData = currentSummaryData.map(item => {
        const maleValues = validMaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        const femaleValues = validFemaleData
            .map(row => parseFloat(row[item.variable]))
            .filter(val => !isNaN(val));
        
        const tTestResult = performTTest(maleValues, femaleValues);
        
        return {
            ...item,
            tValue: tTestResult ? tTestResult.tValue : null,
            pValue: tTestResult ? tTestResult.pValue : null,
            isSignificant: tTestResult ? tTestResult.pValue < 0.05 : null
        };
    });

    const jsonData = {
        timestamp: new Date().toISOString(),
        analysisType: 'Mean Differences Summary with T-Test Results',
        totalVariables: enrichedData.length,
        significantVariables: enrichedData.filter(d => d.isSignificant).length,
        data: enrichedData
    };

    downloadFile(JSON.stringify(jsonData, null, 2), 'mean_differences_summary.json', 'application/json');
}

// Export T-Test Data to CSV
function exportTTestDataCSV() {
    if (currentTTestData.length === 0) {
        alert('Please generate T-Test Analysis first.');
        return;
    }

    let csv = 'Data Factor,Male N,Female N,Male Mean,Female Mean,Male StdDev,Female StdDev,t-value,p-value,Degrees of Freedom,Critical Value,Significant,Decision\n';
    currentTTestData.forEach(item => {
        const decision = item.isSignificant ? 'REJECT NULL' : 'ACCEPT NULL';
        csv += `${item.variable},${item.n1},${item.n2},${item.mean1.toFixed(6)},${item.mean2.toFixed(6)},${item.sd1.toFixed(6)},${item.sd2.toFixed(6)},${item.tValue.toFixed(6)},${item.pValue.toFixed(4)},${item.df},${item.criticalValue.toFixed(6)},${item.isSignificant},${decision}\n`;
    });

    downloadFile(csv, 'ttest_analysis.csv', 'text/csv');
}

// Export T-Test Data to JSON
function exportTTestDataJSON() {
    if (currentTTestData.length === 0) {
        alert('Please generate T-Test Analysis first.');
        return;
    }

    const jsonData = {
        timestamp: new Date().toISOString(),
        analysisType: 'Student\'s T-Test Analysis',
        alpha: 0.05,
        hypothesis: {
            null: 'No significant difference between male and female means',
            alternative: 'Significant difference between male and female means'
        },
        data: currentTTestData
    };

    downloadFile(JSON.stringify(jsonData, null, 2), 'ttest_analysis.json', 'application/json');
}

// Export Graph Data to CSV
function exportGraphDataCSV() {
    if (currentGraphData.length === 0) {
        alert('Please generate graphs first.');
        return;
    }

    let csv = 'Variable,Pair Index,Pairwise Difference,Male Value,Female Value,Male Specimen,Female Specimen\n';
    
    currentGraphData.forEach(item => {
        item.diffs.forEach((diff, idx) => {
            csv += `${item.column},${idx + 1},${diff.value},${diff.maleVal},${diff.femaleVal},${diff.maleSpecies},${diff.femaleSpecies}\n`;
        });
    });

    downloadFile(csv, 'pairwise_differentials.csv', 'text/csv');
}

// Export Graph Data to JSON
function exportGraphDataJSON() {
    if (currentGraphData.length === 0) {
        alert('Please generate graphs first.');
        return;
    }

    const jsonData = {
        timestamp: new Date().toISOString(),
        analysisType: 'Pairwise Differentials',
        data: currentGraphData
    };

    downloadFile(JSON.stringify(jsonData, null, 2), 'pairwise_differentials.json', 'application/json');
}

// Print Summary Data
function printSummaryData() {
    if (currentSummaryData.length === 0) {
        alert('Please generate Mean Differences Summary first.');
        return;
    }

    const printWindow = window.open('', '', 'height=800,width=1200');
    let html = `
        <html>
        <head>
            <title>Mean Differences Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; border-bottom: 3px solid #fa5252; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: linear-gradient(135deg, #fa5252 0%, #fd7e14 100%); color: white; padding: 12px; text-align: center; }
                td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; }
                tr:nth-child(even) { background: #f9f9f9; }
                .highlight { background: #ffe0e6; font-weight: bold; }
                .print-date { color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>Mean Pairwise Differences & Sexual Dimorphism Index Report</h1>
            <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
            <table>
                <tr>
                    <th>Data Factor</th>
                    <th>Male Mean</th>
                    <th>Female Mean</th>
                    <th>Mean Pairwise Difference<br>(Female - Male)</th>
                    <th>Sexual Dimorphism Index (SDI)</th>
                </tr>
    `;

    currentSummaryData.forEach(item => {
        const diffHighlight = Math.abs(item.meanDifference) > (Math.abs(item.maleMean) * 0.1) ? 'highlight' : '';
        const sdiHighlight = item.sdi !== null && Math.abs(item.sdi) > 0.1 ? 'highlight' : '';
        html += `
            <tr>
                <td><strong>${item.variable}</strong></td>
                <td>${item.maleMean.toFixed(4)}</td>
                <td>${item.femaleMean.toFixed(4)}</td>
                <td class="${diffHighlight}">${item.meanDifference.toFixed(4)}</td>
                <td class="${sdiHighlight}">${item.sdi !== null ? item.sdi.toFixed(4) : 'N/A'}</td>
            </tr>
        `;
    });

    html += `
            </table>
            <script>window.print();</script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// Print T-Test Data
function printTTestData() {
    if (currentTTestData.length === 0) {
        alert('Please generate T-Test Analysis first.');
        return;
    }

    const printWindow = window.open('', '', 'height=900,width=1400');
    let html = `
        <html>
        <head>
            <title>Student's T-Test Analysis Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
                h1 { color: #333; border-bottom: 3px solid #20c997; padding-bottom: 10px; }
                .hypothesis { background: #f0f8ff; padding: 15px; border-left: 4px solid #20c997; margin: 15px 0; }
                .var-section { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .var-section h3 { color: #667eea; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th { background: #667eea; color: white; padding: 8px; text-align: left; font-size: 10px; }
                td { padding: 6px; border-bottom: 1px solid #ddd; }
                .result-yes { color: #f5576c; font-weight: bold; }
                .result-no { color: #20c997; font-weight: bold; }
                .print-date { color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>Student's T-Test Analysis Report</h1>
            <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
            <div class="hypothesis">
                <strong>Null Hypothesis (H₀):</strong> There is no significant difference between male and female means.<br>
                <strong>Alternative Hypothesis (H₁):</strong> There is a significant difference between male and female means.<br>
                <strong>Significance Level (α):</strong> 0.05 (two-tailed test)
            </div>
    `;

    currentTTestData.forEach(item => {
        const decisionClass = item.isSignificant ? 'result-yes' : 'result-no';
        const decisionText = item.isSignificant ? 'REJECT NULL HYPOTHESIS' : 'ACCEPT NULL HYPOTHESIS';
        
        html += `
            <div class="var-section">
                <h3>${item.variable}</h3>
                <table>
                    <tr>
                        <th colspan="2">Descriptive Statistics</th>
                    </tr>
                    <tr>
                        <td><strong>Sample Size (n)</strong></td>
                        <td>Male: ${item.n1} | Female: ${item.n2}</td>
                    </tr>
                    <tr>
                        <td><strong>Mean</strong></td>
                        <td>Male: ${item.mean1.toFixed(4)} | Female: ${item.mean2.toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Std. Deviation</strong></td>
                        <td>Male: ${item.sd1.toFixed(4)} | Female: ${item.sd2.toFixed(4)}</td>
                    </tr>
                </table>
                <table>
                    <tr>
                        <th colspan="2">Test Results</th>
                    </tr>
                    <tr>
                        <td><strong>t-value</strong></td>
                        <td>${item.tValue.toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Degrees of Freedom</strong></td>
                        <td>${item.df}</td>
                    </tr>
                    <tr>
                        <td><strong>Critical Value (±)</strong></td>
                        <td>${item.criticalValue.toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Decision</strong></td>
                        <td class="${decisionClass}">${decisionText}</td>
                    </tr>
                </table>
            </div>
        `;
    });

    html += `
            <script>window.print();</script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// Print Pairwise Difference Graph
function printPairwiseGraph() {
    if (allGraphs.length === 0 || currentGraphIndex === -1) {
        alert('Please generate the Pairwise Differences graph first.');
        return;
    }

    const currentGraph = allGraphs[currentGraphIndex];
    const graphContainer = document.getElementById('graphContainer');

    // Use Plotly to get the SVG image of the current graph
    Plotly.downloadImage(graphContainer, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: `pairwise_differences_${currentGraph.column}`
    });
}

// Download All Pairwise Graphs
function downloadAllPairwiseGraphs() {
    if (allGraphs.length === 0) {
        alert('Please generate the Pairwise Differences graphs first.');
        return;
    }

    const graphContainer = document.getElementById('graphContainer');
    const totalGraphs = allGraphs.length;
    let downloadedCount = 0;

    // Create a temporary container for off-screen graph generation
    const tempContainer = document.createElement('div');
    tempContainer.id = 'tempGraphContainer';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1200px';
    tempContainer.style.height = '800px';
    document.body.appendChild(tempContainer);

    // Update UI to show progress
    const originalButtonText = event.target.textContent;
    event.target.textContent = `⏳ Downloading (0/${totalGraphs})...`;
    event.target.disabled = true;

    // Download each graph with a delay
    allGraphs.forEach((graph, index) => {
        setTimeout(() => {
            const layout = {
                ...graph.layout,
                autosize: false,
                width: 1200,
                height: 800
            };

            const config = {
                responsive: false,
                displayModeBar: false,
                displaylogo: false
            };

            // Create graph in temporary container
            Plotly.newPlot('tempGraphContainer', [graph.trace], layout, config);

            // Trigger download
            setTimeout(() => {
                Plotly.downloadImage('tempGraphContainer', {
                    format: 'png',
                    width: 1200,
                    height: 800,
                    filename: `pairwise_differences_${index + 1}_${graph.column}`
                });

                downloadedCount++;
                event.target.textContent = `⏳ Downloading (${downloadedCount}/${totalGraphs})...`;

                // Remove temp container after last download
                if (downloadedCount === totalGraphs) {
                    document.body.removeChild(tempContainer);
                    event.target.textContent = originalButtonText;
                    event.target.disabled = false;
                    alert(`Successfully downloaded all ${totalGraphs} graphs!`);
                }
            }, 100);
        }, index * 500); // 500ms delay between downloads to prevent overwhelming the browser
    });
}

// Print SDI Graph
function printSDIGraph() {
    if (currentGraphIndex !== -1) {
        alert('Please switch to Sexual Dimorphism Index view first.');
        return;
    }

    const graphContainer = document.getElementById('graphContainer');

    // Use Plotly to download the SDI graph as PNG
    Plotly.downloadImage(graphContainer, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: 'sexual_dimorphism_index'
    });
}

// Export SDI Data to CSV
function exportSDIDataCSV() {
    if (currentSummaryData.length === 0) {
        alert('Please generate Sexual Dimorphism Index first.');
        return;
    }

    let csv = 'Variable,Male Mean,Female Mean,Sexual Dimorphism Index\n';
    currentSummaryData.forEach(item => {
        const sdi = item.sdi !== null ? item.sdi.toFixed(6) : 'N/A';
        csv += `${item.variable},${item.maleMean.toFixed(6)},${item.femaleMean.toFixed(6)},${sdi}\n`;
    });

    downloadFile(csv, 'sexual_dimorphism_index.csv', 'text/csv');
}

// Export SDI Pairwise Data to CSV
function exportSDIPairwiseCSV() {
    if (!sdiPairwiseData || sdiPairwiseData.length === 0) {
        // Generate if not already generated
        sdiPairwiseData = generateSDIPairwiseData();
        if (!sdiPairwiseData || sdiPairwiseData.length === 0) {
            alert('Please generate Sexual Dimorphism Index Pairwise data first by clicking "View Pairwise Differences".');
            return;
        }
    }

    // Same format as Compile & Generate Graph CSV but with SDI values instead of pairwise differences
    let csv = 'Variable,Pair Index,SDI Pairwise,Male Value,Female Value,Male Specimen,Female Specimen\n';
    
    sdiPairwiseData.forEach(item => {
        item.diffs.forEach((diff, idx) => {
            csv += `${item.column},${idx + 1},${diff.sdiDiff.toFixed(6)},${diff.maleValue.toFixed(6)},${diff.femaleValue.toFixed(6)},${diff.maleSpecies},${diff.femaleSpecies}\n`;
        });
    });

    downloadFile(csv, 'sdi_pairwise_differences.csv', 'text/csv');
}

// Export Pairwise Differences Data to CSV
function exportPairwiseDifferencesCSV() {
    if (currentGraphData.length === 0) {
        alert('Please generate Compile & Generate Graph first.');
        return;
    }

    let csv = 'Variable,Pair Index,Pairwise Difference,Male Value,Female Value,Male Specimen,Female Specimen\n';
    
    currentGraphData.forEach(item => {
        item.diffs.forEach((diff, idx) => {
            csv += `${item.column},${idx + 1},${diff.value.toFixed(6)},${diff.maleVal.toFixed(6)},${diff.femaleVal.toFixed(6)},${diff.maleSpecies},${diff.femaleSpecies}\n`;
        });
    });

    downloadFile(csv, 'pairwise_differences.csv', 'text/csv');
}

// Export Comprehensive CSV combining all analyses
function exportComprehensiveCSV() {
    console.log('exportComprehensiveCSV called');
    
    // Check if all required data is available
    if (!currentSummaryData || currentSummaryData.length === 0) {
        alert('Missing: Please generate "Mean Differences Summary" first.');
        return;
    }
    if (!currentGraphData || currentGraphData.length === 0) {
        alert('Missing: Please generate "Compile & Generate Graph" first.');
        return;
    }
    if (!currentTTestData || currentTTestData.length === 0) {
        alert('Missing: Please generate "Student\'s T-Test Analysis" first.');
        return;
    }

    console.log('Building comprehensive CSV with all pairwise details and SDI pairwise...');

    // Generate SDI pairwise data if not already generated
    let sdiPairwiseDataLocal = sdiPairwiseData;
    if (!sdiPairwiseDataLocal || sdiPairwiseDataLocal.length === 0) {
        sdiPairwiseDataLocal = generateSDIPairwiseData();
    }

    // Build comprehensive data with pairwise information
    const comprehensiveData = [];
    
    // Iterate through graph data (pairwise data) and enrich with all other information
    currentGraphData.forEach(graphItem => {
        const variable = graphItem.column;
        
        // Find corresponding summary data
        const summaryItem = currentSummaryData.find(s => s.variable === variable);
        
        // Find corresponding T-test data
        const tTestItem = currentTTestData.find(t => t.variable === variable);
        
        // Find corresponding SDI pairwise data
        let sdiPairwiseItem = null;
        if (sdiPairwiseDataLocal) {
            sdiPairwiseItem = sdiPairwiseDataLocal.find(s => s.column === variable);
        }
        
        // For each pairwise comparison in this variable
        graphItem.diffs.forEach((diff, pairwiseIdx) => {
            // Find matching SDI pairwise data
            let sdiPairwise = 'N/A';
            if (sdiPairwiseItem) {
                const matchingSdiDiff = sdiPairwiseItem.diffs.find(d => 
                    d.maleSpecies === diff.maleSpecies && 
                    d.femaleSpecies === diff.femaleSpecies &&
                    Math.abs(d.maleValue - diff.maleVal) < 0.0001
                );
                if (matchingSdiDiff) {
                    sdiPairwise = matchingSdiDiff.sdiDiff.toFixed(6);
                }
            }
            
            const row = {
                variable: variable,
                pairwiseIndex: pairwiseIdx + 1,
                maleSpecimen: diff.maleSpecies || 'Unknown',
                femaleSpecimen: diff.femaleSpecies || 'Unknown',
                maleValue: diff.maleVal.toFixed(6),
                femaleValue: diff.femaleVal.toFixed(6),
                pairwiseDifference: diff.value.toFixed(6),
                sdiPairwise: sdiPairwise,
                maleMean: summaryItem ? summaryItem.maleMean.toFixed(6) : 'N/A',
                femaleMean: summaryItem ? summaryItem.femaleMean.toFixed(6) : 'N/A',
                maleStdDev: tTestItem ? tTestItem.sd1.toFixed(6) : 'N/A',
                femaleStdDev: tTestItem ? tTestItem.sd2.toFixed(6) : 'N/A',
                meanPairwiseDifference: summaryItem ? summaryItem.meanDifference.toFixed(6) : 'N/A',
                sexualDimorphismIndex: summaryItem ? (summaryItem.sdi !== null ? summaryItem.sdi.toFixed(6) : 'N/A') : 'N/A',
                tValue: tTestItem ? tTestItem.tValue.toFixed(6) : 'N/A',
                pValue: tTestItem ? tTestItem.pValue.toFixed(6) : 'N/A',
                degreesOfFreedom: tTestItem ? tTestItem.df : 'N/A',
                criticalValue: tTestItem ? tTestItem.criticalValue.toFixed(6) : 'N/A',
                significant: tTestItem ? (tTestItem.isSignificant ? 'Yes' : 'No') : 'N/A',
                decision: tTestItem ? (tTestItem.isSignificant ? 'REJECT NULL' : 'ACCEPT NULL') : 'N/A'
            };
            
            comprehensiveData.push(row);
        });
    });

    console.log('Data prepared with', comprehensiveData.length, 'pairwise rows');

    // Build CSV header with all columns including SDI pairwise
    let csv = 'Variable,Pair Index,Male Specimen,Female Specimen,Male Value,Female Value,Pairwise Difference,SDI Pairwise,Male Mean,Female Mean,Male Std Dev,Female Std Dev,Mean Pairwise Difference,Sexual Dimorphism Index,t-value,p-value,Degrees of Freedom,Critical Value,Significant,Decision\n';
    
    // Add data rows
    comprehensiveData.forEach(row => {
        csv += `${row.variable},${row.pairwiseIndex},${row.maleSpecimen},${row.femaleSpecimen},${row.maleValue},${row.femaleValue},${row.pairwiseDifference},${row.sdiPairwise},${row.maleMean},${row.femaleMean},${row.maleStdDev},${row.femaleStdDev},${row.meanPairwiseDifference},${row.sexualDimorphismIndex},${row.tValue},${row.pValue},${row.degreesOfFreedom},${row.criticalValue},${row.significant},${row.decision}\n`;
    });

    console.log('Calling downloadFile...');
    downloadFile(csv, 'comprehensive_analysis.csv', 'text/csv');
    
    // Also upload to Google Drive if user is signed in
    if (googleAuth) {
        uploadToDrive(csv, 'comprehensive_analysis.csv');
    }
    
    console.log('Download triggered successfully');
}

// Comprehensive PDF Download Function
function downloadComprehensivePDF() {
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        alert('PDF library is loading. Please try again in a moment.');
        return;
    }

    try {
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⏳ Generating PDF (this may take 10-15 seconds)...';

        // Filter valid data
        const validMaleData = maleData.filter(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );
        const validFemaleData = femaleData.filter(row =>
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );

        if (validMaleData.length === 0 || validFemaleData.length === 0) {
            button.disabled = false;
            button.textContent = originalText;
            alert('Please enter data for both male and female specimens.');
            return;
        }

        // Create main container element
        const container = document.createElement('div');
        container.id = 'pdf-render-container-' + Date.now();
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '800px';
        container.style.backgroundColor = 'white';
        container.style.color = '#000';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.padding = '20px';
        container.style.lineHeight = '1.4';

        // ===== TITLE PAGE =====
        const titleDiv = document.createElement('div');
        titleDiv.style.pageBreakAfter = 'always';
        titleDiv.style.textAlign = 'center';
        titleDiv.style.paddingTop = '100px';
        titleDiv.innerHTML = `
            <h1 style="font-size: 32px; margin: 20px 0; color: #333;">Biological Data Analysis Report</h1>
            <p style="font-size: 16px; color: #666; margin: 10px 0;">Moth Specimen Comparison Study</p>
            <p style="font-size: 13px; color: #999; margin-top: 40px;">Report Generated: ${new Date().toLocaleString()}</p>
        `;
        container.appendChild(titleDiv);

        // ===== MALE DATA SECTION =====
        const maleSection = document.createElement('div');
        maleSection.style.pageBreakAfter = 'always';
        maleSection.style.paddingTop = '20px';
        
        let maleHTML = `<h2 style="font-size: 24px; margin: 20px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Male Moth Data</h2>`;
        maleHTML += `<p style="color: #666; font-size: 12px; margin: 10px 0;">Sample Size: ${validMaleData.length} specimens</p>`;
        maleHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 9px; margin: 15px 0;">`;
        maleHTML += `<tr style="background-color: #667eea; color: white;"><th style="border: 1px solid #999; padding: 6px; text-align: left;">Species</th>`;
        
        columns.forEach(col => {
            maleHTML += `<th style="border: 1px solid #999; padding: 4px; text-align: center; font-size: 8px;">${col}</th>`;
        });
        maleHTML += `</tr>`;

        validMaleData.forEach((row, idx) => {
            const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#ffffff';
            maleHTML += `<tr style="background-color: ${bgColor};">`;
            maleHTML += `<td style="border: 1px solid #ddd; padding: 4px; font-weight: bold; font-size: 9px;">${row.species || 'N/A'}</td>`;
            
            columns.forEach(col => {
                const val = row[col] !== '' ? parseFloat(row[col]).toFixed(2) : '-';
                maleHTML += `<td style="border: 1px solid #ddd; padding: 3px; text-align: right; font-size: 8px;">${val}</td>`;
            });
            maleHTML += `</tr>`;
        });

        maleHTML += `</table>`;
        maleSection.innerHTML = maleHTML;
        container.appendChild(maleSection);

        // ===== FEMALE DATA SECTION =====
        const femaleSection = document.createElement('div');
        femaleSection.style.pageBreakAfter = 'always';
        femaleSection.style.paddingTop = '20px';
        
        let femaleHTML = `<h2 style="font-size: 24px; margin: 20px 0 15px 0; color: #333; border-bottom: 2px solid #764ba2; padding-bottom: 10px;">Female Moth Data</h2>`;
        femaleHTML += `<p style="color: #666; font-size: 12px; margin: 10px 0;">Sample Size: ${validFemaleData.length} specimens</p>`;
        femaleHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 9px; margin: 15px 0;">`;
        femaleHTML += `<tr style="background-color: #764ba2; color: white;"><th style="border: 1px solid #999; padding: 6px; text-align: left;">Species</th>`;
        
        columns.forEach(col => {
            femaleHTML += `<th style="border: 1px solid #999; padding: 4px; text-align: center; font-size: 8px;">${col}</th>`;
        });
        femaleHTML += `</tr>`;

        validFemaleData.forEach((row, idx) => {
            const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#ffffff';
            femaleHTML += `<tr style="background-color: ${bgColor};">`;
            femaleHTML += `<td style="border: 1px solid #ddd; padding: 4px; font-weight: bold; font-size: 9px;">${row.species || 'N/A'}</td>`;
            
            columns.forEach(col => {
                const val = row[col] !== '' ? parseFloat(row[col]).toFixed(2) : '-';
                femaleHTML += `<td style="border: 1px solid #ddd; padding: 3px; text-align: right; font-size: 8px;">${val}</td>`;
            });
            femaleHTML += `</tr>`;
        });

        femaleHTML += `</table>`;
        femaleSection.innerHTML = femaleHTML;
        container.appendChild(femaleSection);

        // ===== MEAN DIFFERENCES SUMMARY =====
        if (currentTTestData && currentTTestData.length > 0) {
            const summarySection = document.createElement('div');
            summarySection.style.pageBreakAfter = 'always';
            summarySection.style.paddingTop = '20px';
            
            let summaryHTML = `<h2 style="font-size: 24px; margin: 20px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Statistical Summary</h2>`;
            summaryHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 9px; margin: 15px 0;">`;
            summaryHTML += `<tr style="background-color: #667eea; color: white;">
                <th style="border: 1px solid #999; padding: 6px; text-align: left;">Variable</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">Male Mean</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">Female Mean</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">Difference</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">t-value</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">p-value</th>
                <th style="border: 1px solid #999; padding: 6px; text-align: center;">Sig.</th>
            </tr>`;

            currentTTestData.forEach((item, idx) => {
                const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#ffffff';
                const sigColor = item.isSignificant ? '#fff3cd' : bgColor;
                const sigText = item.isSignificant ? '✓ YES' : 'NO';
                
                summaryHTML += `<tr style="background-color: ${sigColor};">
                    <td style="border: 1px solid #ddd; padding: 4px; font-weight: bold; font-size: 8px;">${item.variable}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 8px;">${parseFloat(item.mean1).toFixed(3)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 8px;">${parseFloat(item.mean2).toFixed(3)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 8px;">${(item.mean2 - item.mean1).toFixed(3)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 8px;">${parseFloat(item.tValue).toFixed(3)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 8px;">${parseFloat(item.pValue).toFixed(4)}</td>
                    <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-weight: bold; font-size: 8px;">${sigText}</td>
                </tr>`;
            });

            summaryHTML += `</table>`;
            summaryHTML += `<p style="color: #666; font-size: 10px; margin-top: 15px;"><strong>Note:</strong> Significant at p &lt; 0.05</p>`;
            summarySection.innerHTML = summaryHTML;
            container.appendChild(summarySection);
        }

        // ===== T-TEST DETAILS (3 per page) =====
        if (currentTTestData && currentTTestData.length > 0) {
            let itemsPerPage = 3;
            let pageCount = Math.ceil(currentTTestData.length / itemsPerPage);

            for (let pageNum = 0; pageNum < pageCount; pageNum++) {
                const tTestPage = document.createElement('div');
                tTestPage.style.pageBreakAfter = pageNum < pageCount - 1 ? 'always' : 'auto';
                tTestPage.style.paddingTop = '20px';
                
                let pageHTML = pageNum === 0 ? `<h2 style="font-size: 22px; margin: 0 0 20px 0; color: #333;">Detailed T-Test Analysis</h2>` : '';
                
                const startIdx = pageNum * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, currentTTestData.length);

                for (let i = startIdx; i < endIdx; i++) {
                    const item = currentTTestData[i];
                    const decisionText = item.isSignificant ? '✓ SIGNIFICANT' : 'NOT SIGNIFICANT';
                    const decisionColor = item.isSignificant ? '#c41e3a' : '#28a745';
                    
                    pageHTML += `
                        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; background-color: #fafafa;">
                            <h3 style="font-size: 13px; color: #333; margin: 0 0 10px 0;">${item.variable}</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 10px;">
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #999; padding: 4px; text-align: left;">Statistic</th>
                                    <th style="border: 1px solid #999; padding: 4px; text-align: center;">Male</th>
                                    <th style="border: 1px solid #999; padding: 4px; text-align: center;">Female</th>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 3px;"><strong>N</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item.n1}</td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item.n2}</td>
                                </tr>
                                <tr style="background-color: #f9f9f9;">
                                    <td style="border: 1px solid #ddd; padding: 3px;"><strong>Mean</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${parseFloat(item.mean1).toFixed(4)}</td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${parseFloat(item.mean2).toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 3px;"><strong>SD</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${parseFloat(item.sd1).toFixed(4)}</td>
                                    <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${parseFloat(item.sd2).toFixed(4)}</td>
                                </tr>
                            </table>
                            <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 8px; font-size: 9px;">
                                <p style="margin: 3px 0;"><strong>t-value:</strong> ${parseFloat(item.tValue).toFixed(4)}</p>
                                <p style="margin: 3px 0;"><strong>df:</strong> ${item.df}</p>
                                <p style="margin: 3px 0;"><strong>p-value:</strong> ${parseFloat(item.pValue).toFixed(4)}</p>
                                <p style="margin: 3px 0; color: ${decisionColor}; font-weight: bold;"><strong>Decision:</strong> ${decisionText}</p>
                            </div>
                        </div>
                    `;
                }

                tTestPage.innerHTML = pageHTML;
                container.appendChild(tTestPage);
            }
        }

        // ===== FOOTER PAGE =====
        const footerDiv = document.createElement('div');
        footerDiv.style.paddingTop = '40px';
        footerDiv.innerHTML = `
            <div style="border-top: 2px solid #ddd; padding-top: 20px;">
                <h3 style="font-size: 16px; margin-bottom: 15px; color: #333;">Report Summary</h3>
                <ul style="font-size: 11px; color: #666; line-height: 1.8; padding-left: 20px;">
                    <li><strong>Male specimens:</strong> ${validMaleData.length}</li>
                    <li><strong>Female specimens:</strong> ${validFemaleData.length}</li>
                    <li><strong>Variables analyzed:</strong> ${columns.length}</li>
                    <li><strong>Statistical test:</strong> Welch's t-test</li>
                    <li><strong>Significance level:</strong> α = 0.05</li>
                    <li><strong>Significant differences:</strong> ${currentTTestData.filter(x => x.isSignificant).length}</li>
                </ul>
                <p style="font-size: 10px; color: #999; margin-top: 20px;">Generated by Biological Data Analysis Tool</p>
            </div>
        `;
        container.appendChild(footerDiv);

        // Add to DOM so html2pdf can render it
        document.body.appendChild(container);

        // Delay to ensure rendering
        setTimeout(() => {
            const opt = {
                margin: [5, 5, 5, 5],
                filename: `moth_analysis_${new Date().toISOString().split('T')[0]}.pdf`,
                html2canvas: { 
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    allowTaint: true
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                }
            };

            html2pdf()
                .set(opt)
                .from(container)
                .save()
                .then(() => {
                    // Remove container from DOM
                    if (document.body.contains(container)) {
                        document.body.removeChild(container);
                    }
                    
                    button.disabled = false;
                    button.textContent = originalText;
                    alert('✓ PDF downloaded successfully! Check your Downloads folder.');
                })
                .catch(err => {
                    console.error('PDF error:', err);
                    if (document.body.contains(container)) {
                        document.body.removeChild(container);
                    }
                    
                    button.disabled = false;
                    button.textContent = originalText;
                    alert('Error generating PDF. Check browser console for details.');
                });
        }, 500);

    } catch (error) {
        console.error('Error:', error);
        if (event.target) {
            event.target.disabled = false;
            event.target.textContent = 'Download Comprehensive Report';
        }
        alert('Error: ' + error.message);
    }
}

// WORKING PDF DOWNLOAD - USING jsPDF WITH TEXT-BASED GENERATION
function downloadComprehensivePDF_NEW() {
    const button = event.target;
    button.disabled = true;
    button.textContent = '⏳ Generating...';

    try {
        // Check if jsPDF is available
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }

        const validMaleData = maleData.filter(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );
        const validFemaleData = femaleData.filter(row =>
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
        );

        if (validMaleData.length === 0 || validFemaleData.length === 0) {
            button.disabled = false;
            button.textContent = 'Download Comprehensive Report';
            alert('Enter data for both male and female specimens.');
            return;
        }

        // Create PDF doc
        const jsPDF = window.jsPDF.jsPDF;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 15;

        // Helper function to add page break
        function newPage() {
            doc.addPage();
            yPos = 15;
        }

        // Helper function to add text
        function addText(text, size = 12, bold = false) {
            if (yPos + size/2 > pageHeight - 10) newPage();
            doc.setFontSize(size);
            doc.setFont('arial', bold ? 'bold' : 'normal');
            doc.text(text, 15, yPos);
            yPos += size/2 + 2;
            return yPos;
        }

        // Helper function to add table
        function addTable(headers, rows) {
            if (yPos + 20 > pageHeight - 10) newPage();
            
            const colWidth = (pageWidth - 30) / headers.length;
            const rowHeight = 6;
            let xPos = 15;

            // Headers
            doc.setFontSize(9);
            doc.setFont('arial', 'bold');
            doc.setFillColor(200, 200, 200);
            headers.forEach((header, i) => {
                doc.rect(xPos, yPos, colWidth, rowHeight, 'F');
                doc.text(header, xPos + 1, yPos + 4);
                xPos += colWidth;
            });
            yPos += rowHeight;

            // Rows
            doc.setFont('arial', 'normal');
            rows.forEach((row, r) => {
                if (yPos + rowHeight > pageHeight - 10) {
                    yPos += rowHeight;
                    newPage();
                }
                xPos = 15;
                if (r % 2 === 0) {
                    doc.setFillColor(240, 240, 240);
                    doc.rect(15, yPos, pageWidth - 30, rowHeight, 'F');
                }
                row.forEach((cell, i) => {
                    doc.text(String(cell).substring(0, 15), xPos + 1, yPos + 4);
                    xPos += colWidth;
                });
                yPos += rowHeight;
            });
            yPos += 3;
        }

        // PAGE 1: TITLE
        doc.setFontSize(24);
        doc.setFont('arial', 'bold');
        doc.text('Biological Data Analysis Report', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('arial', 'normal');
        doc.text('Moth Specimen Comparison Study', pageWidth / 2, pageHeight / 2, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Report Date: ' + new Date().toLocaleString(), pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        newPage();

        // PAGE 2: MALE DATA
        addText('Male Specimens (n=' + validMaleData.length + ')', 14, true);
        const maleHeaders = ['Species', ...columns.slice(0, 6)];
        const maleRows = validMaleData.map(row => [
            row.species || '-',
            ...columns.slice(0, 6).map(c => row[c] !== '' ? parseFloat(row[c]).toFixed(2) : '-')
        ]);
        addTable(maleHeaders, maleRows);
        newPage();

        // PAGE 3: FEMALE DATA
        addText('Female Specimens (n=' + validFemaleData.length + ')', 14, true);
        const femaleHeaders = ['Species', ...columns.slice(0, 6)];
        const femaleRows = validFemaleData.map(row => [
            row.species || '-',
            ...columns.slice(0, 6).map(c => row[c] !== '' ? parseFloat(row[c]).toFixed(2) : '-')
        ]);
        addTable(femaleHeaders, femaleRows);
        newPage();

        // PAGE 4: STATISTICAL SUMMARY
        if (currentTTestData && currentTTestData.length > 0) {
            addText('Statistical Analysis Summary', 14, true);
            const statHeaders = ['Variable', 'Male Mean', 'Female Mean', 'Difference', 't-value', 'p-value', 'Significant'];
            const statRows = currentTTestData.map(item => [
                item.variable,
                item.mean1.toFixed(3),
                item.mean2.toFixed(3),
                (item.mean2 - item.mean1).toFixed(3),
                item.tValue.toFixed(3),
                item.pValue.toFixed(4),
                item.isSignificant ? 'YES' : 'NO'
            ]);
            addTable(statHeaders, statRows);
            newPage();
        }

        // PAGES 5+: DETAILED T-TEST RESULTS
        if (currentTTestData && currentTTestData.length > 0) {
            addText('Detailed T-Test Results', 14, true);
            currentTTestData.forEach((item, idx) => {
                if (yPos + 30 > pageHeight - 10) newPage();
                
                addText('Variable: ' + item.variable, 11, true);
                addText('Male (n=' + item.n1 + '):');
                addText('  Mean = ' + item.mean1.toFixed(4) + ', SD = ' + item.sd1.toFixed(4));
                addText('Female (n=' + item.n2 + '):');
                addText('  Mean = ' + item.mean2.toFixed(4) + ', SD = ' + item.sd2.toFixed(4));
                addText('Results:');
                addText('  t-value = ' + item.tValue.toFixed(4));
                addText('  p-value = ' + item.pValue.toFixed(4));
                addText('  Significant = ' + (item.isSignificant ? 'YES (p < 0.05)' : 'NO (p >= 0.05)'));
                yPos += 3;
            });
            newPage();
        }

        // LAST PAGE: SUMMARY
        addText('Report Summary', 14, true);
        addText('Total Male Specimens: ' + validMaleData.length);
        addText('Total Female Specimens: ' + validFemaleData.length);
        addText('Total Variables Analyzed: ' + columns.length);
        addText('Significant Differences Found: ' + (currentTTestData ? currentTTestData.filter(x => x.isSignificant).length : 0));
        addText('Report Generated: ' + new Date().toLocaleString());

        // Save PDF
        const filename = 'moth_analysis_' + new Date().toISOString().split('T')[0] + '.pdf';
        doc.save(filename);

        button.disabled = false;
        button.textContent = 'Download Comprehensive Report';
        alert('✓ PDF downloaded successfully!');

    } catch (err) {
        console.error('PDF Error:', err);
        button.disabled = false;
        button.textContent = 'Download Comprehensive Report';
        alert('Error generating PDF: ' + err.message);
    }
}

// Replace old function with new one
downloadComprehensivePDF = downloadComprehensivePDF_NEW;

// Helper function to convert table to HTML with proper styling
function getTableHTML(table) {
    if (!table) return '';
    
    let html = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">';
    
    // Process header
    const thead = table.querySelector('thead');
    if (thead) {
        html += '<thead>';
        const headerRows = thead.querySelectorAll('tr');
        headerRows.forEach(row => {
            html += '<tr style="background-color: #f2f2f2;">';
            row.querySelectorAll('th, td').forEach(cell => {
                html += `<th style="border: 1px solid #999; padding: 6px; text-align: left; font-weight: bold;">${cell.textContent.trim()}</th>`;
            });
            html += '</tr>';
        });
        html += '</thead>';
    }
    
    // Process body
    const tbody = table.querySelector('tbody');
    if (tbody) {
        html += '<tbody>';
        let rowIndex = 0;
        const bodyRows = tbody.querySelectorAll('tr');
        bodyRows.forEach(row => {
            const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
            html += `<tr style="background-color: ${bgColor};">`;
            row.querySelectorAll('th, td').forEach(cell => {
                html += `<td style="border: 1px solid #999; padding: 6px; text-align: left;">${cell.textContent.trim()}</td>`;
            });
            html += '</tr>';
            rowIndex++;
        });
        html += '</tbody>';
    }
    
    html += '</table>';
    return html;
}

// Add styling for table clones in PDF
const style = document.createElement('style');
style.textContent = `
    @media print {
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        th, td {
            border: 1px solid #999;
            padding: 5px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        h1, h2 {
            margin-top: 20px;
            margin-bottom: 15px;
        }
        .significant-marker {
            color: #c41e3a;
            font-weight: bold;
        }
    }
`;
document.head.appendChild(style);


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

// Variable to track SDI pairwise view state
let sdiPairwiseData = null;
let currentSDIPairwiseIndex = 0;

// Generate SDI Pairwise Differences
function generateSDIPairwiseData() {
    // Filter out empty rows but PRESERVE original indices
    const validMaleIndices = [];
    const validMaleData = [];
    maleData.forEach((row, idx) => {
        if (Object.values(row).some(val => val !== '' && val !== null && val !== undefined)) {
            validMaleIndices.push(idx);
            validMaleData.push(row);
        }
    });

    const validFemaleIndices = [];
    const validFemaleData = [];
    femaleData.forEach((row, idx) => {
        if (Object.values(row).some(val => val !== '' && val !== null && val !== undefined)) {
            validFemaleIndices.push(idx);
            validFemaleData.push(row);
        }
    });

    if (validMaleData.length === 0 || validFemaleData.length === 0) {
        return null;
    }

    // Calculate pairwise SDI differences - ALL COMBINATIONS
    const pairwiseSDI = [];

    columns.forEach((column) => {
        const maleValueMap = [];
        const femaleValueMap = [];
        
        // Map values with their original indices and species info
        validMaleData.forEach((row, idx) => {
            const val = parseFloat(row[column]);
            if (!isNaN(val)) {
                maleValueMap.push({
                    value: val,
                    originalIndex: validMaleIndices[idx],
                    species: row.species || 'N/A',
                    rowNum: validMaleIndices[idx] + 1
                });
            }
        });

        validFemaleData.forEach((row, idx) => {
            const val = parseFloat(row[column]);
            if (!isNaN(val)) {
                femaleValueMap.push({
                    value: val,
                    originalIndex: validFemaleIndices[idx],
                    species: row.species || 'N/A',
                    rowNum: validFemaleIndices[idx] + 1
                });
            }
        });

        if (maleValueMap.length > 0 && femaleValueMap.length > 0) {
            const diffs = [];
            
            // Generate ALL pairwise combinations
            for (let m = 0; m < maleValueMap.length; m++) {
                for (let f = 0; f < femaleValueMap.length; f++) {
                    const maleData = maleValueMap[m];
                    const femaleData = femaleValueMap[f];
                    
                    if (maleData.value !== 0) {
                        const sdiDiff = (femaleData.value / maleData.value) - 1;
                        diffs.push({
                            pairId: `M${m + 1}-F${f + 1}`,
                            maleRowNum: maleData.rowNum,
                            femaleRowNum: femaleData.rowNum,
                            maleSpecies: maleData.species,
                            femaleSpecies: femaleData.species,
                            maleValue: maleData.value,
                            femaleValue: femaleData.value,
                            sdiDiff: sdiDiff
                        });
                    }
                }
            }

            if (diffs.length > 0) {
                pairwiseSDI.push({
                    column: column,
                    diffs: diffs
                });
            }
        }
    });

    return pairwiseSDI;
}

// Toggle SDI Pairwise View
function toggleSDIPairwise() {
    const button = event.target;
    
    // Check if we're already in pairwise mode
    if (sdiPairwiseData && currentGraphIndex === -1) {
        // Switch back to SDI overview
        generateSexualDimorphismIndex();
        button.textContent = '📊 View Pairwise Differences';
        return;
    }
    
    if (!sdiPairwiseData) {
        sdiPairwiseData = generateSDIPairwiseData();
    }

    if (!sdiPairwiseData || sdiPairwiseData.length === 0) {
        alert('Unable to generate SDI pairwise differences. Please ensure you have valid data.');
        return;
    }

    currentGraphIndex = -1; // Indicate we're in SDI pairwise mode
    currentSDIPairwiseIndex = 0;
    displaySDIPairwiseGraph();
    button.textContent = '📊 View SDI Overview';
}

// Display SDI Pairwise Graph
function displaySDIPairwiseGraph() {
    const graphData = sdiPairwiseData[currentSDIPairwiseIndex];
    const xLabels = graphData.diffs.map((d) => d.pairId);
    const yValues = graphData.diffs.map(d => d.sdiDiff);
    
    const hoverText = graphData.diffs.map(d => {
        const maleDisplay = d.maleSpecies !== 'N/A' ? `${d.maleSpecies}` : `Male Specimen`;
        const femaleDisplay = d.femaleSpecies !== 'N/A' ? `${d.femaleSpecies}` : `Female Specimen`;
        
        return `<b style="font-size:14px;">Pair: ${d.pairId}</b><br>` +
               `<br>` +
               `<b style="color:#667eea; font-size:13px;">♂ MALE SPECIMEN</b><br>` +
               `Row Number: ${d.maleRowNum}<br>` +
               `Species: ${maleDisplay}<br>` +
               `Value: ${formatNumber(d.maleValue)}<br>` +
               `<br>` +
               `<b style="color:#f76062; font-size:13px;">♀ FEMALE SPECIMEN</b><br>` +
               `Row Number: ${d.femaleRowNum}<br>` +
               `Species: ${femaleDisplay}<br>` +
               `Value: ${formatNumber(d.femaleValue)}<br>` +
               `<br>` +
               `<b style="color:#333; font-size:13px;">Sexual Dimorphism Index</b><br>` +
               `Pairwise SDI: ${formatNumber(d.sdiDiff)}<br>` +
               `Formula: (${femaleDisplay} / ${maleDisplay}) - 1`;
    });


    const colors = yValues.map(val => val >= 0 ? '#667eea' : '#f76062');

    const trace = {
        x: xLabels,
        y: yValues,
        mode: 'markers+lines',
        type: 'scatter',
        hovertext: hoverText,
        hoverinfo: 'text',
        marker: {
            size: 10,
            color: colors,
            opacity: 0.8,
            line: {
                color: colors,
                width: 2
            }
        },
        line: {
            color: '#999',
            width: 2
        }
    };

    const layout = {
        title: {
            text: `<b>Sexual Dimorphism Index Pairwise Differences - ${graphData.column}</b><br><sub>All Specimen Pair Combinations (${graphData.diffs.length} pairs total)</sub>`,
            font: { size: 18 }
        },
        xaxis: {
            title: 'Specimen Pairs (Male-Female)',
            showgrid: true,
            zeroline: false,
            gridwidth: 1,
            gridcolor: '#e0e0e0'
        },
        yaxis: {
            title: 'Pairwise SDI Difference',
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
            t: 130,
            b: 100,
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

    const graphContainer = document.getElementById('graphContainer');
    const width = graphContainer.parentElement.offsetWidth - 60;
    const height = 600;

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    const finalLayout = {
        ...layout,
        width: width,
        height: height
    };

    Plotly.newPlot('graphContainer', [trace], finalLayout, config);

    // Update navigation controls
    const navControls = document.getElementById('graphNavigationControls');
    if (navControls) {
        navControls.style.display = 'flex';
        document.getElementById('currentGraphLabel').textContent = `SDI Pairwise: ${graphData.column} (${currentSDIPairwiseIndex + 1} of ${sdiPairwiseData.length}) | ${graphData.diffs.length} pairs`;
        // Update button disabled states
        updateNavigationButtons();
    }

    // Update button to show current view
    const toggleButton = document.querySelector('[onclick="toggleSDIPairwise()"]');
    if (toggleButton) {
        toggleButton.textContent = '📊 View SDI Overview';
    }
}

// Navigate to next SDI pairwise variable
function navigateToSDIPairwiseNext() {
    if (!sdiPairwiseData || sdiPairwiseData.length === 0) return;
    currentSDIPairwiseIndex = (currentSDIPairwiseIndex + 1) % sdiPairwiseData.length;
    displaySDIPairwiseGraph();
}

// Navigate to previous SDI pairwise variable
function navigateToSDIPairwisePrev() {
    if (!sdiPairwiseData || sdiPairwiseData.length === 0) return;
    currentSDIPairwiseIndex = (currentSDIPairwiseIndex - 1 + sdiPairwiseData.length) % sdiPairwiseData.length;
    displaySDIPairwiseGraph();
}


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

// TEST FUNCTION: Populate sample data for testing
function populateSampleData() {
    // Clear existing data
    maleData = [];
    femaleData = [];

    // Male sample data - 3 specimens
    const maleSpecimens = [
        { species: 'Moth Species A', data: [245.2, 18.5, 2840, 0.65, 0.55, 0.48, 0.82, 0.71, 0.63, 2.1, 7.2, 8.5, 4.2, 0.95, 0.045, 0.038, 0.052, 0.008, 2.45, 1.85, 0.82, 1.2, 0.34, 127, 8.5, 3.2, 2.1, 0.067, 0.025, 0.017] },
        { species: 'Moth Species B', data: [252.1, 19.2, 2950, 0.68, 0.58, 0.51, 0.85, 0.74, 0.66, 2.3, 7.5, 8.8, 4.5, 1.02, 0.048, 0.041, 0.055, 0.009, 2.52, 1.95, 0.85, 1.25, 0.36, 132, 9.0, 3.4, 2.2, 0.070, 0.027, 0.019] },
        { species: 'Moth Species C', data: [238.5, 17.8, 2720, 0.62, 0.52, 0.45, 0.79, 0.68, 0.60, 2.0, 7.0, 8.2, 4.0, 0.92, 0.042, 0.036, 0.050, 0.007, 2.38, 1.75, 0.79, 1.15, 0.32, 124, 8.2, 3.1, 2.0, 0.065, 0.024, 0.016] }
    ];

    // Female sample data - 2 specimens
    const femaleSpecimens = [
        { species: 'Moth Species A', data: [268.5, 20.1, 3100, 0.72, 0.62, 0.54, 0.92, 0.80, 0.71, 2.5, 7.8, 9.2, 4.8, 1.15, 0.056, 0.048, 0.062, 0.011, 2.78, 2.15, 0.92, 1.38, 0.41, 145, 9.8, 3.7, 2.5, 0.077, 0.031, 0.022] },
        { species: 'Moth Species B', data: [275.2, 21.0, 3250, 0.75, 0.65, 0.57, 0.95, 0.83, 0.74, 2.7, 8.1, 9.5, 5.1, 1.22, 0.059, 0.051, 0.065, 0.012, 2.88, 2.28, 0.95, 1.45, 0.43, 152, 10.2, 3.9, 2.6, 0.080, 0.033, 0.024] }
    ];

    // Populate male data
    maleSpecimens.forEach(specimen => {
        const row = createDataRow(specimen.species);
        specimen.data.forEach((val, idx) => {
            row[columns[idx]] = val;
        });
        maleData.push(row);
    });

    // Populate female data
    femaleSpecimens.forEach(specimen => {
        const row = createDataRow(specimen.species);
        specimen.data.forEach((val, idx) => {
            row[columns[idx]] = val;
        });
        femaleData.push(row);
    });

    // Render tables
    renderMaleTable();
    renderFemaleTable();

    console.log('Sample data populated successfully!');
    console.log(`Male specimens: ${maleData.length}`);
    console.log(`Female specimens: ${femaleData.length}`);

    // Auto-generate analysis
    setTimeout(() => {
        generateMeanDifferencesSummary();
        generateTTestResults();
    }, 500);

    alert('✓ Sample data loaded! \n\nData is ready for testing. Click "Compile & Generate Graph" to generate visualizations.');
}

// ====== GOOGLE DRIVE INTEGRATION ======
let googleAuth = null;
let lastGeneratedCSV = null;
let lastGeneratedFilename = null;

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
        callback: handleSignInCallback
    });
    
    google.accounts.id.renderButton(
        document.getElementById('googleSignInContainer'),
        { 
            theme: 'outline', 
            size: 'large',
            text: 'signin_with'
        }
    );
}

function handleSignInCallback(response) {
    console.log('Google Sign-In successful');
    googleAuth = response;
    alert('✓ Successfully signed in with Google! CSV will be uploaded to Drive.');
}

// Upload CSV to Google Drive
function uploadToDrive(csvContent, filename) {
    if (!googleAuth) {
        console.log('Not signed in to Google. Skipping Drive upload.');
        return;
    }

    // Transform filename: "comprehensive_analysis.csv" → "comprehensiveanalysis.csv"
    const nameWithoutExt = filename.replace('.csv', '');
    const nameParts = nameWithoutExt.split('_');
    const transformedName = (nameParts.slice(0, 2).join('')) + '.csv';
    
    console.log('Uploading to Google Drive as:', transformedName);

    // Use Google Drive API to upload
    const metadata = {
        name: transformedName,
        mimeType: 'text/csv'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([csvContent], { type: 'text/csv' }));

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&access_token=' + googleAuth.credential, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            console.log('✓ File uploaded to Google Drive:', data.id);
            alert('✓ File uploaded to Google Drive as: ' + transformedName);
        } else {
            console.error('Error uploading to Drive:', data);
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('========================================');
    console.log('✓ Page loaded - initializing...');
    console.log(`✓ maleData array exists: ${maleData !== undefined}`);
    console.log(`✓ femaleData array exists: ${femaleData !== undefined}`);
    console.log(`✓ columns defined: ${columns.length} columns`);
    console.log('========================================');
    
    initializeTables();
    
    // Initialize Google Sign-In (will show error if credentials not configured)
    try {
        initializeGoogleSignIn();
    } catch (e) {
        console.log('Google Sign-In not available - local download only');
    }
    
    // Add keyboard shortcut: Press 'T' to load test data
    document.addEventListener('keypress', (event) => {
        if (event.key === 't' || event.key === 'T') {
            const ctrlOrCmd = event.ctrlKey || event.metaKey;
            if (ctrlOrCmd) {
                event.preventDefault();
                populateSampleData();
            }
        }
    });
});
