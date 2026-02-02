// main application and event listeners
import PointGroup from './core/PointGroup.js';
import GeometryUtils from './core/GeometryUtils.js';
import state from './core/state.js';
import { MODES, TREE_MODES } from './core/constants.js';
import { initSVG, renderVisualization } from './ui/visualization.js';
import { renderForestVisualization, resetTreeHierarchy } from './ui/treeVisualization.js';
import { updateGroupSelector } from './ui/uiControls.js';
import { generateTestData } from './utils/testDataGenerator.js';

// ============================================
// initialization
// ============================================

// initialize svg
state.svg = initSVG();

// ============================================
// event listeners: file operations
// ============================================

document.getElementById("load-json").addEventListener("click", () => {
  console.log("load button clicked!");
  
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  
  input.onchange = (event) => {
    console.log("file selected:", event.target.files[0]);
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      console.log("JSON-Daten geladen:", data);

      state.pointGroups = (data.pointGroups || []).map((groupData) => {
        return new PointGroup(
          groupData.name,
          groupData.points,
          groupData.disk,
          groupData.farthestPointVoronoiDiagram,
          groupData.convexHull
        );
      });
      
      state.tangentialPoints = [];
      updateGroupSelector();
      renderVisualization();
    };
    
    reader.readAsText(file);
  };
  
  input.click();
});

document.getElementById("save-json").addEventListener("click", () => {
  const data = {
    pointGroups: state.pointGroups.map((group) => ({
      name: group.name,
      points: group.points,
      disk: group.disk,
      farthestPointVoronoiDiagram: group.farthestPointVoronoiDiagram,
      convexHull: group.convexHull,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ddcc_data.json";
  a.click();
  URL.revokeObjectURL(url);
});

// ============================================
// event listeners: test data and reset
// ============================================

document.getElementById("generateTestDataButton").addEventListener("click", generateTestData);

document.getElementById("reset").addEventListener("click", () => {
  state.pointGroups = [];
  state.selectedHierarchyEdge = null;
  state.tangentialPoints = [];
  state.currentGroup = null;
  updateGroupSelector();
  resetTreeHierarchy();
  initSVG();
});

// ============================================
// event listeners: mode selection
// ============================================

document.getElementById("modeSelector").addEventListener("change", (event) => {
  state.selectedHullPoints = [];
  
  switch (event.target.value) {
    case MODES.ADD_POINTS:
      state.currentMode = MODES.ADD_POINTS;
      console.log("add points mode activated. click to add points.");
      break;
    case MODES.DELETE_POINTS:
      state.currentMode = MODES.DELETE_POINTS;
      console.log("delete points mode activated. click point to delete.");
      break;
    case MODES.MOVE_POINTS:
      state.currentMode = MODES.MOVE_POINTS;
      console.log("move points mode activated. click point to move.");
      break;
    case MODES.LOCKED:
      state.currentMode = MODES.LOCKED;
      console.log("no mode active. no action possible.");
      break;
    case MODES.SELECT_HULL_POINTS:
      state.currentMode = MODES.SELECT_HULL_POINTS;
      console.log("hull point selection mode activated. select 2 hull points and click 'add disk to group'");
      break;
    case MODES.RESIZE_DISKS_VIA_FPVD:
      state.currentMode = MODES.RESIZE_DISKS_VIA_FPVD;
      console.log("Resizing the disks via the Farthest-Point Voronoi Diagram.");
      break;
    case MODES.RESIZE_DISKS_MANUALLY:
      state.currentMode = MODES.RESIZE_DISKS_MANUALLY;
      console.log("Resizing disks mode activated. Drag and Drop a disk boundary.");
      break;
  }
});

// ============================================
// event listeners: group management
// ============================================

document.getElementById("groupSelector").addEventListener("change", (event) => {
  const selectedIndex = event.target.value;
  
  if (selectedIndex !== "none") {
    state.currentGroup = state.pointGroups[selectedIndex];
    console.log(`selected group: ${state.currentGroup.name}`);
  } else {
    state.currentGroup = null;
  }
});

document.getElementById("addGroupButton").addEventListener("click", () => {
  const groupName = prompt("Please input the name of the new group:");

  if (groupName) {
    state.currentGroup = new PointGroup(groupName);
    state.pointGroups.push(state.currentGroup);

    console.log(`Added new group ${state.currentGroup.name} and set it as current group`);

    updateGroupSelector();
    renderForestVisualization();
  }
});

document.getElementById("addDiskButton").addEventListener("click", function () {
  if (state.selectedHullPoints.length === 2) {
    state.currentGroup.setDiskFromTwoPoints(state.selectedHullPoints);
    renderVisualization();
    state.selectedHullPoints = [];
  } else if (state.selectedHullPoints.length === 3) {
    state.currentGroup.setDiskFromThreePoints(state.selectedHullPoints);
    renderVisualization();
    state.selectedHullPoints = [];
  } else {
    alert("Please select 2 or 3 points.");
    if (state.selectedHullPoints.length > 3) {
      state.selectedHullPoints = [];
    }
  }
});

// ============================================
// event listeners: display options
// ============================================

document.querySelectorAll('.dropdown-content input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", (event) => {
    const option = event.target.getAttribute("data-option");
    state.displayOptions[option] = event.target.checked;
    renderVisualization();
  });
});

// ============================================
// event listeners: tree view
// ============================================

document.getElementById("treeModeSelector").addEventListener("change", (event) => {
  switch (event.target.value) {
    case TREE_MODES.COLLISIONS:
      state.currentTreeMode = TREE_MODES.COLLISIONS;
      console.log("Collision tree-view-mode activated.");
      break;
    case TREE_MODES.PROXIMITY:
      state.currentTreeMode = TREE_MODES.PROXIMITY;
      console.log("Proximity tree-view-mode activated.");
      break;
  }
  renderForestVisualization();
});

// ============================================
// event listeners: collision resolution
// ============================================

document.getElementById("resolveCollision").addEventListener("click", () => {
  if (state.selectedHierarchyEdge == null) {
    console.error("No edge selected to resolve collision.");
    return;
  }

  try {
    const resolveDirectionSelector = document.getElementById("resolveDirectionSelector");
    let pointGroupA, pointGroupB;

    if (resolveDirectionSelector.value === "moveParent") {
      pointGroupA = state.selectedHierarchyEdge.group1.group;
      pointGroupB = state.selectedHierarchyEdge.group2.group;
    } else if (resolveDirectionSelector.value === "moveChild") {
      pointGroupA = state.selectedHierarchyEdge.group2.group;
      pointGroupB = state.selectedHierarchyEdge.group1.group;
    } else {
      console.error("Invalid resolve direction selected.");
      return;
    }

    try {
      const newDisk = GeometryUtils.calculateNewDiskWithoutIntersection(
        pointGroupA,
        pointGroupB
      );

      console.log(`Collision resolved for edge between ${pointGroupA.name} and ${pointGroupB.name}.`);
      console.log("New disk for PointGroup A:", newDisk);

      state.selectedHierarchyEdge = null;
    } catch (error) {
      console.error(
        `Error resolving collision for edge between ${pointGroupA.name} and ${pointGroupB.name}:`,
        error.message
      );
    }

    renderVisualization();
  } catch (error) {
    console.error("Error resolving collision chain:", error.message);
  }
});

export { state, renderVisualization };
