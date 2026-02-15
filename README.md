# Biological Data Analysis Tool

A web-based application for analyzing and comparing biological specimen data between male and female samples across 30+ morphometric variables.

## Features

- **Dual Data Entry**: Separate sections for male and female specimen data
- **Dynamic Row Management**: 
  - Add new rows for data entry
  - Delete selected rows
  - Row numbering for easy reference
- **31 Morphometric Variables**:
  - Wing measurements: wingL, mean_chordL, wingarea
  - Moment of inertia: moa1, moa2, moa3, moaND1, moaND2, moaND3
  - Wing properties: wingmass, wingAR, CWing_loading, BandWmass, effective_HW_loading
  - Body measurements: bodyL, maxbodywidth, bodymass
  - Inertia tensors: Ixx_bw, Iyy_bw, Izz_bw, Ixz_bw
  - Wing beat frequencies: wbf1, wbf2
  - Anatomical segments: L1, head_L, thorax_L, abdomen_L
  - Proportional measurements: head_L_PBL, thorax_L_PBL, abdomen_L_PBL

- **Interactive Graph Visualization**:
  - Generates comparison graphs showing differentials (Female - Male) for each variable
  - Hover over data points to see:
    - Variable name
    - Male specimen row number and value
    - Female specimen row number and value
    - Calculated differential
  - Multiple traces for each variable with distinct colors
  - Reference line at y=0 showing no differential
  - Responsive design adapts to screen size

## How to Use

1. **Enter Data**:
   - Navigate to the Male Specimens section
   - Enter numerical data for each variable in the table
   - Click "+ Add Row" to add more male specimens
   - Repeat for Female Specimens section

2. **Manage Rows**:
   - Click on a row to select it (highlighted in blue)
   - Click "Delete Row" to remove the selected row
   - Leave cells empty if data is unavailable

3. **Generate Analysis**:
   - Click "📊 Compile & Generate Graph" button
   - The system will calculate differentials between all male-female pairs
   - Interactive graph appears showing results for all variables
   - Hover over points to see detailed row information

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Plotly.js for interactive graph visualization
- All data stored client-side (no server required)
- Responsive design works on desktop, tablet, and mobile devices
- Supports decimal values for precise measurements

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── script.js           # Application logic and interactivity
└── README.md          # This file
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Modern mobile browsers

## Notes

- Empty rows are automatically filtered out during compilation
- At least one data entry is required to generate a graph
- The differential is always calculated as: Female value - Male value
- Positive differentials indicate female specimens are larger/greater
- Negative differentials indicate male specimens are larger/greater

## Future Enhancements

- Data export to CSV/Excel
- Statistical analysis summary
- Custom variable selection for graphs
- Data validation and error checking
- Local storage for data persistence
- Multiple species comparison
# Wing-Analysis-Program
