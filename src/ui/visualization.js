// svg rendering and visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import state from '../core/state.js';
import GeometryUtils from '../core/GeometryUtils.js';
import { MODES, CANVAS_CONFIG } from '../core/constants.js';
import { 
  addPointToGroup, 
  deletePointFromGroup, 
  selectHullPoints,
  getHoveredDisk,
  getHoveredVertexOrEdgeFPVD,
  setVisualizationFunctions,
  setUIFunctions
} from './interactions.js';
import { renderForestVisualization } from './treeVisualization.js';
import { updateGroupSelector } from './uiControls.js';

// Set up lazy references to avoid circular imports
setUIFunctions(updateGroupSelector);

// initialize svg with event handlers
export function initSVG() {
  const coordinateDisplay = document.getElementById("coordinateDisplay");
  
  state.svg = d3
    .select("#visualization")
    .html("")
    .append("svg")
    .attr("width", CANVAS_CONFIG.WIDTH)
    .attr("height", CANVAS_CONFIG.HEIGHT);

  // click handler
  state.svg.on("click", function (event) {
    switch (state.currentMode) {
      case MODES.ADD_POINTS:
        addPointToGroup(event);
        break;
      case MODES.DELETE_POINTS:
        deletePointFromGroup(event);
        break;
      case MODES.LOCKED:
        console.log("no mode active. no action possible.");
        break;
      case MODES.SELECT_HULL_POINTS:
        selectHullPoints(event);
        break;
    }
  });

  // mousedown handler
  state.svg.on("mousedown", function (event) {
    const [x, y] = d3.pointer(event);
    
    if (state.currentMode === MODES.MOVE_POINTS) {
      for (let pointGroup of state.pointGroups) {
        for (let point of pointGroup.points) {
          const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
          if (distance < CANVAS_CONFIG.CLICK_TOLERANCE) {
            state.isDragging = true;
            state.draggedPoint = point;
            state.draggedGroup = pointGroup;
            break;
          }
        }
      }
    } else if (state.currentMode === MODES.RESIZE_DISKS_MANUALLY) {
      const [hoveredDisk, distanceToEdge] = getHoveredDisk(
        event.offsetX,
        event.offsetY
      );

      if (hoveredDisk && distanceToEdge < CANVAS_CONFIG.EDGE_TOLERANCE) {
        state.resizingDisk = hoveredDisk;
        state.isResizing = true;
      }
    } else if (state.currentMode === MODES.RESIZE_DISKS_VIA_FPVD) {
      const hoveredVertexOrEdge = getHoveredVertexOrEdgeFPVD(x, y);
      if (hoveredVertexOrEdge) {
        state.isDragging = true;
      }
    }
  });

  // mousemove handler
  state.svg.on("mousemove", function (event) {
    const [rawX, rawY] = d3.pointer(event);
    const x = Math.max(0, Math.round(rawX));
    const y = Math.max(0, Math.round(rawY));

    coordinateDisplay.textContent = `X: ${x}, Y: ${y}`;
    
    handleMouseMove(event, x, y);
  });

  // mouseup handler
  state.svg.on("mouseup", function () {
    if (state.currentMode === MODES.MOVE_POINTS && state.isDragging) {
      state.isDragging = false;
      state.draggedPoint = null;
      state.draggedGroup = null;
      renderVisualization();
    } else if (state.currentMode === MODES.RESIZE_DISKS_MANUALLY) {
      state.isResizing = false;
      state.resizingDisk = null;
      state.svg.style("cursor", "default");
      renderVisualization();
    } else if (state.currentMode === MODES.RESIZE_DISKS_VIA_FPVD) {
      state.isDragging = false;
      renderVisualization();
    }
  });

  // mouseleave handler
  state.svg.on("mouseleave", function () {
    if (state.isDragging) {
      state.isDragging = false;
      state.draggedPoint = null;
      state.draggedGroup = null;
      renderVisualization();
    }
  });

  return state.svg;
}

// handle mouse movement based on mode
function handleMouseMove(event, x, y) {
  if (state.currentMode === MODES.MOVE_POINTS) {
    if (state.draggedPoint) {
      state.svg.style("cursor", "move");
      if (state.isDragging) {
        state.draggedPoint.x = x;
        state.draggedPoint.y = y;
        state.draggedGroup.updatePointGroup();
      }
    } else {
      state.svg.style("cursor", "default");
    }
    renderVisualization();
  } else if (state.currentMode === MODES.RESIZE_DISKS_MANUALLY) {
    const [hoveredDisk, distanceToEdge] = getHoveredDisk(event.offsetX, event.offsetY);

    if (hoveredDisk && distanceToEdge < CANVAS_CONFIG.EDGE_TOLERANCE) {
      state.svg.style("cursor", "ns-resize");
    } else {
      state.svg.style("cursor", "default");
    }
    
    if (state.isResizing && state.resizingDisk) {
      const dx = event.offsetX - state.resizingDisk.center.x;
      const dy = event.offsetY - state.resizingDisk.center.y;
      const newRadius = Math.sqrt(dx ** 2 + dy ** 2);

      if (newRadius > 0) {
        state.resizingDisk.radius = newRadius;
      }
      renderVisualization();
    }
  } else if (state.currentMode === MODES.RESIZE_DISKS_VIA_FPVD) {
    handleFPVDResize(event, x, y);
  }
}

// handle fpvd-based disk resizing
function handleFPVDResize(event, x, y) {
  const hoveredVertexOrEdge = getHoveredVertexOrEdgeFPVD(event.offsetX, event.offsetY);
  let pointGroup1, pointGroup2, tangentialPoint;
  
  if (state.selectedHierarchyEdge) {
    pointGroup1 = state.selectedHierarchyEdge.group1.group;
    pointGroup2 = state.selectedHierarchyEdge.group2.group;
  }
  
  const draggedGroupSelectedInHierarchy =
    state.draggedGroup &&
    (state.draggedGroup === pointGroup1 || state.draggedGroup === pointGroup2);

  if (draggedGroupSelectedInHierarchy) {
    tangentialPoint = GeometryUtils.calculateTangentialPoint(pointGroup1, pointGroup2);
    if (tangentialPoint) state.tangentialPoints.push(tangentialPoint);
  }

  if (hoveredVertexOrEdge) {
    state.svg.style("cursor", "move");
  } else {
    state.svg.style("cursor", "default");
  }

  if (hoveredVertexOrEdge && state.isDragging) {
    if (hoveredVertexOrEdge.type === "vertex") {
      state.draggedGroup.setDiskFromThreePoints(hoveredVertexOrEdge.vertex.points);
    } else if (hoveredVertexOrEdge.type === "edge") {
      state.draggedGroup.setDiskFromTwoPointsAndCenter(
        hoveredVertexOrEdge.edge.points,
        hoveredVertexOrEdge.exactPoint
      );
    }
    
    if (draggedGroupSelectedInHierarchy && tangentialPoint) {
      if (state.draggedGroup === pointGroup1) {
        GeometryUtils.calculateNewDiskWithoutIntersection(pointGroup2, pointGroup1);
      } else {
        GeometryUtils.calculateNewDiskWithoutIntersection(pointGroup1, pointGroup2);
      }
      tangentialPoint = GeometryUtils.calculateTangentialPoint(pointGroup1, pointGroup2);
      if (tangentialPoint) state.tangentialPoints.push(tangentialPoint);
    }
    renderVisualization();
  }
}

// render complete visualization
export function renderVisualization() {
  state.svg = initSVG();

  if (!Array.isArray(state.pointGroups) || state.pointGroups.length === 0) {
    console.warn("Keine PointGroups gefunden, nichts zu rendern.");
    return;
  }

  state.pointGroups.forEach((group, groupIndex) => {
    renderPoints(group, groupIndex);
    renderDisk(group);
    renderFPVD(group, groupIndex);
    renderConvexHull(group);
    renderGroupName(group);
    renderTangentialPoints();
  });

  renderForestVisualization();
}

// render group points
function renderPoints(group, groupIndex) {
  if (!state.displayOptions.SHOW_POINTS) return;
  
  state.svg
    .selectAll(`.point-group-${groupIndex}`)
    .data(group.points)
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", CANVAS_CONFIG.POINT_RADIUS)
    .style("fill", "blue");
}

// render disk with validity indicator
function renderDisk(group) {
  if (!state.displayOptions.SHOW_DISKS || !group.disk) return;
  
  const disk = group.disk;
  const allDisks = state.pointGroups.flatMap((g) => g.disk);
  const diskCoversPoints = GeometryUtils.checkIfDiskCoversPoints(disk, group.convexHull);
  const diskCollides = GeometryUtils.checkIfDiskCollides(disk, allDisks);

  const isValid = diskCoversPoints && !diskCollides;
  const color = isValid ? "blue" : "red";
  const crossColor = isValid ? "green" : "red";

  // Disk-Kreis
  state.svg
    .append("circle")
    .attr("cx", disk.center.x)
    .attr("cy", disk.center.y)
    .attr("r", disk.radius)
    .style("fill", "none")
    .style("stroke", color);

  // Kreuz in der Mitte
  state.svg
    .append("line")
    .attr("x1", disk.center.x - 5)
    .attr("y1", disk.center.y)
    .attr("x2", disk.center.x + 5)
    .attr("y2", disk.center.y)
    .style("stroke", crossColor)
    .style("stroke-width", 2)
    .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);

  state.svg
    .append("line")
    .attr("x1", disk.center.x)
    .attr("y1", disk.center.y - 5)
    .attr("x2", disk.center.x)
    .attr("y2", disk.center.y + 5)
    .style("stroke", crossColor)
    .style("stroke-width", 2)
    .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);
}

// render farthest-point voronoi diagram
function renderFPVD(group, groupIndex) {
  if (!group.farthestPointVoronoiDiagram) return;
  
  const { vertices, edges } = group.farthestPointVoronoiDiagram;

  if (state.displayOptions.SHOW_INNER_FPVD) {
    // Innere Vertices
    state.svg
      .selectAll(`.inner-vertex-${groupIndex}`)
      .data(vertices.filter((v) => !v.isInfinite))
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 2)
      .style("fill", "green");

    // Innere Edges
    state.svg
      .selectAll(`.inner-edge-${groupIndex}`)
      .data(edges.filter((e) => !e.isInfinite))
      .enter()
      .append("line")
      .attr("x1", (d) => d.start.x)
      .attr("y1", (d) => d.start.y)
      .attr("x2", (d) => d.end.x)
      .attr("y2", (d) => d.end.y)
      .style("stroke", "green")
      .style("stroke-width", 1);
  }

  if (state.displayOptions.SHOW_OUTER_FPVD) {
    // outer vertices
    state.svg
      .selectAll(`.outer-vertex-${groupIndex}`)
      .data(vertices.filter((v) => v.isInfinite))
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 2)
      .style("fill", "green");

    // outer edges
    state.svg
      .selectAll(`.outer-edge-${groupIndex}`)
      .data(edges.filter((e) => e.isInfinite))
      .enter()
      .append("line")
      .attr("x1", (d) => d.start.x)
      .attr("y1", (d) => d.start.y)
      .attr("x2", (d) => d.end.x)
      .attr("y2", (d) => d.end.y)
      .style("stroke", "green")
      .style("stroke-width", 1);
  }
}

// render convex hull
function renderConvexHull(group) {
  if (!state.displayOptions.SHOW_CONVEX_HULLS || !group.convexHull) return;
  
  state.svg
    .append("polygon")
    .attr("points", group.convexHull.map((d) => [d.x, d.y]).join(" "))
    .style("fill", "none")
    .style("stroke", "orange")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "4,4");
}

// render group name
function renderGroupName(group) {
  if (!state.displayOptions.SHOW_NAME || !group.name) return;
  
  const xPos = group.points[0]?.x;
  const yPos = group.points[0]?.y - 10;
  
  state.svg
    .append("text")
    .attr("x", xPos)
    .attr("y", yPos)
    .text(group.name)
    .style("fill", "black")
    .style("font-size", "12px")
    .style("text-anchor", "middle");
}

// render tangent point trace
function renderTangentialPoints() {
  if (!state.displayOptions.TRACE_TANGENTIAL_POINTS) return;
  if (!Array.isArray(state.tangentialPoints) || state.tangentialPoints.length === 0) return;

  const maxDistance = 10;
  const filteredSegments = [];
  
  for (let i = 0; i < state.tangentialPoints.length - 1; i++) {
    const pointA = state.tangentialPoints[i];
    const pointB = state.tangentialPoints[i + 1];

    const distance = Math.sqrt(
      (pointB.x - pointA.x) ** 2 + (pointB.y - pointA.y) ** 2
    );

    if (distance <= maxDistance) {
      filteredSegments.push([pointA, pointB]);
    }
  }

  const lineGenerator = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);

  filteredSegments.forEach((segment) => {
    state.svg
      .append("path")
      .datum(segment)
      .attr("d", lineGenerator)
      .style("fill", "none")
      .style("stroke", "red")
      .style("stroke-width", 2);
  });
}

// highlight convex hull
export function highlightConvexHull(group) {
  const hull = group.convexHull;

  if (!hull) {
    alert("This group does not have a convex hull.");
    return;
  }

  state.svg.selectAll(".highlighted-hull").remove();

  state.svg
    .append("polygon")
    .attr("class", "highlighted-hull")
    .attr("points", hull.map((d) => `${d.x},${d.y}`).join(" "))
    .style("fill", "none")
    .style("stroke", "yellow")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "4,4");
}

// Initialize the lazy references after functions are defined
setVisualizationFunctions(renderVisualization, highlightConvexHull);
