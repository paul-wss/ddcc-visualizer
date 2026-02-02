# DDCC Visualizer
An interactive tool for visualizing disk-based covering calculations using Farthest-Point Voronoi Diagrams (FPVD).

Originally built between September 2024 and February 2025. Open-sourced in 2026.

---

## Project Summary

This project implements and visualizes advanced computational geometry algorithms for disk covering and collision detection. The tool supports group-based point management, convex hull computation, disk generation from hull points, and tree-based collision/proximity analysis. The implementation focuses on clarity, modularity, and interactive exploration of geometric structures.

---

![Example Screenshot](assets/example_screenshot.png)

## Features

- **Point Group Management**: Create, edit, and delete point groups
- **Convex Hull Calculation**: Automatic computation using the Graham Scan algorithm
- **Farthest-Point Voronoi Diagram (FPVD)**: Visualization of the Voronoi structure
- **Disk Generation**: Create disks from 2-3 selected hull points
- **Collision Detection**: Automatic detection and visualization of disk collisions
- **Tree Hierarchy**: Display of collision and proximity trees
- **Import/Export**: JSON-based saving and loading of configurations

---

## Architecture Overview

```
ddcc-visualizer/
├── src/
│   ├── core/                 # Core logic
│   │   ├── GeometryUtils.js  # Geometric algorithms
│   │   ├── PointGroup.js     # Point group class
│   │   ├── constants.js      # Constants and configuration
│   │   └── state.js          # Application state
│   │
│   ├── ui/                   # UI components
│   │   ├── visualization.js  # SVG rendering
│   │   ├── treeVisualization.js  # Tree hierarchy
│   │   ├── interactions.js   # User interactions
│   │   └── uiControls.js     # UI controls
│   │
│   ├── utils/                # Utility functions
│   │   └── testDataGenerator.js  # Test data generation
│   │
│   ├── app.js                # Main application
│   └── index.js              # Module exports
│
├── assets/
│   └── icons/                # Icons and favicons
│
├── data/
│   └── examples/             # Example JSON files
│
├── index.html                # HTML entry point
├── styles.css                # Stylesheets
├── package.json              # NPM configuration
└── README.md                 # This file
```

---

## Usage

### Interaction Modes

1. **Locked**: No interaction possible
2. **Add Points**: Add points to the selected group
3. **Delete Points**: Remove points from the group
4. **Move Points**: Move points via drag & drop
5. **Select Hull Points**: Select hull points for disk creation
6. **Resize Disks via FPVD**: Adjust disks along the FPVD
7. **Resize Disks Manually**: Change disk size manually

### Typical Workflow

1. Create a group ("Create new group")
2. Select "Add points" mode and add points
3. Select "Select hull points for disk" mode
4. Select 2-3 hull points
5. Click "Generate Disk from selected hull points"
6. Resize, remove collisions etc.

### Data Import/Export

- **Save file**: Export all groups as JSON
- **Load file**: Import previously saved JSON files

---

## Technologies

- **D3.js v7**: SVG visualization
- **Vanilla JavaScript (ES6 Modules)**: No framework dependencies
- **CSS3**: Modern styling

---

## Development

```bash
# Start the server
npm start

# Then open in your browser:
# http://localhost:8080
```

---

## License

ISC
