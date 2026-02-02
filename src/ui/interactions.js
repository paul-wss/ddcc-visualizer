// user interactions and event handlers
import state from '../core/state.js';
import { CANVAS_CONFIG } from '../core/constants.js';

// lazy imports to avoid circular dependencies
let renderVisualization;
let highlightConvexHull;
let updateGroupSelector;

export function setVisualizationFunctions(render, highlight) {
  renderVisualization = render;
  highlightConvexHull = highlight;
}

export function setUIFunctions(updateSelector) {
  updateGroupSelector = updateSelector;
}

// add point to current group
export function addPointToGroup(event) {
  if (!state.currentGroup) {
    console.warn("no group selected.");
    return;
  }
  
  const x = event.offsetX;
  const y = event.offsetY;

  state.currentGroup.addPoint(x, y);
  console.log(`point added: x=${x}, y=${y}`);

  if (renderVisualization) renderVisualization();
}

// delete point from current group
export function deletePointFromGroup(event) {
  if (!state.currentGroup) {
    console.warn("no group selected.");
    return;
  }
  
  const x = event.offsetX;
  const y = event.offsetY;

  let pointToDelete = state.currentGroup.points.find((point) => {
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    return distance <= CANVAS_CONFIG.CLICK_TOLERANCE;
  });

  if (pointToDelete) {
    state.currentGroup.deletePoint(pointToDelete);
  }

  if (renderVisualization) renderVisualization();
}

// find disk under mouse
export function getHoveredDisk(mouseX, mouseY) {
  let hoveredDisk = null;
  let distanceToEdge = Infinity;

  state.pointGroups.forEach((pointGroup) => {
    if (pointGroup.disk) {
      const dx = mouseX - pointGroup.disk.center.x;
      const dy = mouseY - pointGroup.disk.center.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      const edgeDistance = Math.abs(distance - pointGroup.disk.radius);
      if (edgeDistance < distanceToEdge) {
        distanceToEdge = edgeDistance;
        hoveredDisk = pointGroup.disk;
      }
    }
  });

  return [hoveredDisk, distanceToEdge];
}

// find fpvd vertex or edge under mouse
export function getHoveredVertexOrEdgeFPVD(x, y) {
  const tolerance = CANVAS_CONFIG.EDGE_TOLERANCE;

  // check vertices
  for (let group of state.pointGroups) {
    for (const vertex of group.farthestPointVoronoiDiagram.vertices) {
      const distance = Math.sqrt((vertex.x - x) ** 2 + (vertex.y - y) ** 2);
      if (distance <= tolerance) {
        state.draggedGroup = group;
        return { type: "vertex", vertex };
      }
    }
  }

  // check edges
  for (let group of state.pointGroups) {
    for (const edge of group.farthestPointVoronoiDiagram.edges) {
      const projection = projectPointOntoLineSegment(edge.start, edge.end, { x, y });
      const distance = Math.sqrt((projection.x - x) ** 2 + (projection.y - y) ** 2);
      if (distance <= tolerance) {
        state.draggedGroup = group;
        return { type: "edge", edge, exactPoint: projection };
      }
    }
  }

  return null;
}

// project point onto line segment
function projectPointOntoLineSegment(start, end, point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx ** 2 + dy ** 2;

  if (lengthSquared === 0) return null;

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    x: start.x + clampedT * dx,
    y: start.y + clampedT * dy,
  };
}

// select hull points for disk creation
export function selectHullPoints(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  const addHullPoint = (point, group) => {
    state.svg
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", CANVAS_CONFIG.POINT_RADIUS)
      .attr("class", "selected-point")
      .style("fill", "yellow");
      
    if (state.selectedHullPoints.length === 0) {
      state.currentGroup = group;
      if (highlightConvexHull) highlightConvexHull(state.currentGroup);
      if (updateGroupSelector) updateGroupSelector();
    }
    state.selectedHullPoints.push(point);
  };
  
  const removeHullPoint = (point) => {
    state.svg
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", CANVAS_CONFIG.POINT_RADIUS)
      .style("fill", "blue");
      
    state.selectedHullPoints = state.selectedHullPoints.filter((p) => p !== point);
    
    if (state.selectedHullPoints.length === 0) {
      state.currentGroup = null;
      state.svg.selectAll(".highlighted-hull").remove();
      if (updateGroupSelector) updateGroupSelector();
    }
  };

  for (let group of state.pointGroups) {
    for (let point of group.convexHull) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      
      if (distance < CANVAS_CONFIG.CLICK_TOLERANCE) {
        if (state.currentGroup != null && state.currentGroup !== group) {
          for (let oldPoint of state.currentGroup.points) {
            removeHullPoint(oldPoint);
          }
          addHullPoint(point, group);
        } else if (!state.selectedHullPoints.includes(point)) {
          addHullPoint(point, group);
        } else {
          removeHullPoint(point);
        }
      }
    }
  }
}
