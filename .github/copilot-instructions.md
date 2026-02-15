## Biological Data Analysis Tool - Project Setup

This is a standalone web application for comparing biological specimen data between male and female samples. It requires no build process or external dependencies beyond a modern web browser.

### Project Overview
- **Type**: Vanilla JavaScript Web Application
- **Purpose**: Data entry and comparative analysis of morphometric variables
- **Architecture**: Client-side only, no backend required
- **Key Libraries**: Plotly.js (for interactive graphs)

### Project Components

#### Core Files
- **index.html**: Main UI structure with data tables and graph container
- **styles.css**: Responsive design with gradient headers and interactive elements
- **script.js**: Application logic for data management, row operations, and graph generation

#### Features Implemented
- ✅ Dual data entry sections (Male and Female)
- ✅ Dynamic row addition and deletion with visual selection
- ✅ 31 morphometric variables across multiple categories
- ✅ Interactive Plotly graph with hover tooltips showing row information
- ✅ Automatic differential calculation (Female - Male values)
- ✅ Responsive design for all screen sizes
- ✅ Client-side data storage with no persistence (loads fresh each session)

### How to Run

1. **Option A - Direct File Opening**:
   - Open `index.html` in any modern web browser
   - Use Ctrl+O (or Cmd+O on Mac) to open the file dialog

2. **Option B - Local Server (Recommended)**:
   - Navigate to the project directory in terminal
   - Run: `python -m http.server 8000` or `python3 -m http.server 8000`
   - Open browser to: `http://localhost:8000`

3. **Option C - Using VS Code Live Server**:
   - Install the "Live Server" extension
   - Right-click on `index.html`
   - Select "Open with Live Server"

### Development Notes

- All data is stored in JavaScript variables (`maleData`, `femaleData`)
- Row selection uses CSS highlighting (blue background)
- Graph generation filters empty rows automatically
- Plotly handles all graph rendering and interactivity
- No external API calls or dependencies beyond Plotly CDN

### Customization

To add more variables:
1. Update the `columns` array in `script.js`
2. Add corresponding table headers in `index.html` within both tables
3. The rest is handled automatically

To modify graph styling:
1. Edit the `layout` object in the `compileAndGraph()` function
2. Adjust colors in the `traces` generation section

### Browser Requirements

- Modern ES6 JavaScript support
- Number input type support
- CSS Grid/Flexbox capability
- ES6 arrow functions and template literals

All modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+) are fully supported.
