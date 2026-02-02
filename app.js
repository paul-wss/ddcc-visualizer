import PointGroup from "./pointGroup.js";
import GeometryUtils from "./GeometryUtils.js"; // Importiere die GeometryUtils-Klasse

// Properties

let svg = null; // Globale svg-Variable korrekt initialisieren
const coordinateDisplay = document.getElementById("coordinateDisplay"); // Property to display the current coordinates

let pointGroups = [];
let currentGroup = null; // Die aktuelle Gruppe, in die Punkte hinzugefügt werden sollen

const modes = {
  LOCKED: "locked",
  ADD_POINTS: "add_points",
  DELETE_POINTS: "delete_points",
  MOVE_POINTS: "move_points",
  SELECT_HULL_POINTS: "select_hull_points",
  RESIZE_DISKS_VIA_FPVD: "resize_disks_via_FPVD",
  RESIZE_DISKS_MANUALLY: "resize_disks_manually",
  MOVE_DISKS_MANUALLY: "move_disks_manually",
};

let currentMode = modes.LOCKED; // Den aktuellen Modus, standardmäßig auf "locked" setzen

// attributes to change tree view
const treeModes = {
  COLLISIONS: "collisions",
  PROXIMITY: "proximity",
};

let currentTreeMode = treeModes.COLLISIONS;

// to hide certain elements in the editor
const displayOptions = {
  SHOW_NAME: true,
  SHOW_POINTS: true,
  SHOW_DISKS: true,
  SHOW_CONVEX_HULLS: true,
  SHOW_INNER_FPVD: true,
  SHOW_OUTER_FPVD: true,
  TRACE_TANGENTIAL_POINTS: true,
};

// Statusvariablen für Drag-and-Drop
let isDragging = false;
let draggedPoint = null;
let draggedGroup = null;

let selectedHullPoints = []; // selectedHullPoints for generating a disk
// let currentSelectedGroup = null; // group from which the points are currently selected

let resizingDisk = null; // Aktuell aktive Disk zum Resizen
let isResizing = false; // Ob gerade ein Resize-Vorgang läuft

let selectedHierarchyEdge = null; // Globale Variable für ausgewählte Kante
let tangentialPoints = [];

// #region EventListener

document.getElementById("load-json").addEventListener("click", () => {
  console.log("Load-Button geklickt!"); // Debug-Log
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    console.log("Datei ausgewählt:", event.target.files[0]); // Debug-Log
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      console.log("JSON-Daten geladen:", data); // Debug-Log

      // JSON-Daten in PointGroup-Objekte laden
      pointGroups = (data.pointGroups || []).map((groupData) => {
        return new PointGroup(
          groupData.name,
          groupData.points,
          groupData.disk,
          groupData.farthestPointVoronoiDiagram,
          groupData.convexHull
        );
      });
      tangentialPoints = [];
      updateGroupSelector();
      renderVisualization();
    };
    reader.readAsText(file);
  };
  input.click();
});

document.getElementById("save-json").addEventListener("click", () => {
  const data = {
    pointGroups: pointGroups.map((group) => ({
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

// Button hinzufügen und Event-Listener binden
document
  .getElementById("generateTestDataButton")
  .addEventListener("click", generateTestData);

document.getElementById("reset").addEventListener("click", () => {
  pointGroups = [];
  selectedHierarchyEdge = null;
  tangentialPoints = [];
  currentGroup = null;
  updateGroupSelector();
  resetTreeHierarchy();
  initSVG();
});

// Event-Listener for the mode selector dropdown-menu
document.getElementById("modeSelector").addEventListener("change", (event) => {
  selectedHullPoints = []; // Zurücksetzen der Auswahl beim Wechseln des Modus
  switch (event.target.value) {
    case modes.ADD_POINTS:
      currentMode = modes.ADD_POINTS;
      console.log(
        "Hinzufügen-Modus aktiviert. Klicken Sie, um Punkte hinzuzufügen."
      );
      break;
    case modes.DELETE_POINTS:
      currentMode = modes.DELETE_POINTS;
      console.log(
        "Löschen-Modus aktiviert. Klicken Sie auf einen Punkt, um ihn zu löschen."
      );
      break;
    case modes.MOVE_POINTS:
      currentMode = modes.MOVE_POINTS;
      console.log(
        "Bewegen-Modus aktiviert. Klicken Sie auf einen Punkt, um ihn zu verschieben."
      );
      break;
    case modes.LOCKED:
      currentMode = modes.LOCKED;
      console.log("Kein Modus aktiviert. Keine Aktion möglich.");
      break;
    case modes.SELECT_HULL_POINTS:
      currentMode = modes.SELECT_HULL_POINTS;
      console.log(
        "Hull-Points-Selection Mode activated. Select 2 hull points and click on 'Add Disk to Group'"
      );
      break;
    case modes.RESIZE_DISKS_VIA_FPVD:
      currentMode = modes.RESIZE_DISKS_VIA_FPVD;
      console.log(
        "Resizing the disks via the Farthest-Point Voronoi Diagram. Slide the center of the circle, i.e. the cross along the edges of the FPVD."
      );
      break;
    case modes.RESIZE_DISKS_MANUALLY:
      currentMode = modes.RESIZE_DISKS_MANUALLY;
      console.log(
        "Resizing disks mode activated. Drag and Drop a disk boundary"
      );
      break;
  }
});

// Event-Listener für das Group-Dropdown
document.getElementById("groupSelector").addEventListener("change", (event) => {
  const selectedIndex = event.target.value;
  if (selectedIndex !== "none") {
    currentGroup = pointGroups[selectedIndex]; // Wähle die Gruppe aus
    console.log(`Ausgewählte Gruppe: ${currentGroup.name}`);
  } else {
    currentGroup = null; // Keine Gruppe ausgewählt
  }
});

document.getElementById("addGroupButton").addEventListener("click", () => {
  // Abfrage des Gruppennamens
  const groupName = prompt("Please input the name of the new group:");

  // Falls der Benutzer einen Namen eingegeben hat
  if (groupName) {
    // Neue Gruppe erstellen
    currentGroup = new PointGroup(groupName);

    // Neue Gruppe zu pointGroups hinzufügen
    pointGroups.push(currentGroup);

    console.log(
      `Added new group ${currentGroup.name} and set it as current group`
    );

    // groupSelector aktualisieren
    updateGroupSelector();

    // refresh tree view
    renderForestVisualization();
  }
});

document.getElementById("addDiskButton").addEventListener("click", function () {
  /* if (!currentGroup) {
    alert("Please select a group");
    return;
  } */
  // Prüfe, ob 2-3 Punkte ausgewählt wurden
  if (selectedHullPoints.length === 2) {
    currentGroup.setDiskFromTwoPoints(selectedHullPoints); // vorher currentSelectedGroup
    renderVisualization();
    selectedHullPoints = [];
    // currentGroup = null; // vorher currentSelectedGroup
    // updateGroupSelector(); // vielleicht die und die Zeile davor entfernen
  } else if (selectedHullPoints.length === 3) {
    currentGroup.setDiskFromThreePoints(selectedHullPoints); // vorher currentSelectedGroup
    renderVisualization();
    selectedHullPoints = [];
  } else {
    alert("Please select 2 or 3 points.");
    if (selectedHullPoints.length > 3) {
      selectedHullPoints = [];
    }
  }
});

// Event-Listener für die Checkboxen
document
  .querySelectorAll('.dropdown-content input[type="checkbox"]')
  .forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const option = event.target.getAttribute("data-option");
      displayOptions[option] = event.target.checked;

      // Visualisierung basierend auf den Optionen aktualisieren
      renderVisualization();
    });
  });

document
  .getElementById("treeModeSelector")
  .addEventListener("change", (event) => {
    switch (event.target.value) {
      case treeModes.COLLISIONS:
        currentTreeMode = treeModes.COLLISIONS;
        console.log(
          "Collision tree-view-mode activated. Parent-child relationships will now be generated solely via disk collisions"
        );
        break;
      case treeModes.PROXIMITY:
        currentTreeMode = treeModes.PROXIMITY;
        console.log(
          "Proximity tree-view-mode activated. Parent-child relationships will now be generated via the nearest disk among other groups"
        );
        break;
    }
    renderForestVisualization();
  });

/*document.getElementById("resolveCollisionChain").addEventListener("click", () => {
  if (pointGroups.length < 2) {
    console.error("Not enough point groups to resolve collision chain.");
    return;
  }

  try {
    const pointGroupA = pointGroups[0];
    const pointGroupB = pointGroups[1];

    const newDisk = GeometryUtils.calculateNewDiskWithoutIntersectionNumerically(pointGroupA, pointGroupB);

    console.log("Collision resolved. New disk for PointGroup A:", newDisk);

    // Optional: Update visualization if applicable
    renderVisualization();
  } catch (error) {
    console.error("Error resolving collision chain:", error.message);
  }
});*/

document.getElementById("resolveCollision").addEventListener("click", () => {
  if (selectedHierarchyEdge == null) {
    console.error("No edge selected to resolve collision.");
    return;
  }

  try {
    // Iteriere über alle ausgewählten Kanten
    const resolveDirectionSelector = document.getElementById(
      "resolveDirectionSelector"
    );
    let pointGroupA, pointGroupB;

    if (resolveDirectionSelector.value === "moveParent") {
      pointGroupA = selectedHierarchyEdge.group1.group;
      pointGroupB = selectedHierarchyEdge.group2.group;
    } else if (resolveDirectionSelector.value === "moveChild") {
      pointGroupA = selectedHierarchyEdge.group2.group;
      pointGroupB = selectedHierarchyEdge.group1.group;
    } else {
      console.error("Invalid resolve direction selected.");
      return;
    }

    try {
      // Berechne die neue Disk für PointGroup A, um die Kollision mit PointGroup B zu lösen
      const newDisk = GeometryUtils.calculateNewDiskWithoutIntersection(
        pointGroupA,
        pointGroupB
      );

      console.log(
        `Collision resolved for edge between ${pointGroupA.name} and ${pointGroupB.name}.`
      );
      console.log("New disk for PointGroup A:", newDisk);

      // Entferne die Edge aus selectedHierarchyEdges
      selectedHierarchyEdge = null;
    } catch (error) {
      console.error(
        `Error resolving collision for edge between ${pointGroupA.name} and ${pointGroupB.name}:`,
        error.message
      );
    }

    // Optional: Update visualization if applicable
    renderVisualization();
  } catch (error) {
    console.error("Error resolving collision chain:", error.message);
  }
});

// #endregion

// #region Edit
// Funktion zum Hinzufügen eines Punktes
function addPointToGroup(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  // Den Punkt zur PointGroup hinzufügen
  currentGroup.addPoint(x, y);
  console.log(`Punkt hinzugefügt: x=${x}, y=${y}`);

  renderVisualization();
}

// Event-Handler für das Löschen eines Punktes
function deletePointFromGroup(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  // Prüfen, ob die Distanz zum Punkt kleiner als 10 Pixel ist
  let pointToDelete = null;

  if (currentGroup) {
    // Stelle sicher, dass eine Gruppe ausgewählt wurde
    pointToDelete = currentGroup.points.find((point) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      return distance <= 10; // Gibt den Punkt zurück, wenn er im Umkreis von 10 Pixeln liegt
    });
  }

  if (pointToDelete) {
    currentGroup.deletePoint(pointToDelete); // Lösche den Punkt aus der PointGroup
  }

  // Alle Punkte neu zeichnen (möglicherweise durch einen eigenen Redraw-Mechanismus)
  renderVisualization();
}

/* // Funktion zum Bewegen eines Punktes
function movePointInGroup(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  // Prüfen, ob der Klick in der Nähe eines vorhandenen Punktes liegt
  for (let point of pointGroup.points) {
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    if (distance < 10) {
      // Punkt verschieben
      point.x = x;
      point.y = y;
      break;
    }
  }

  // Alle Punkte neu zeichnen
  renderVisualization();
} */

function getHoveredDisk(mouseX, mouseY) {
  let hoveredDisk = null;
  let distanceToEdge = Infinity;

  pointGroups.forEach((pointGroup) => {
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

function getHoveredVertexOrEdgeFPVD(x, y) {
  const tolerance = 5; // Pixel-Toleranz für die Erkennung
  const hovered = null;

  // Vertices prüfen
  for (let group of pointGroups) {
    for (const vertex of group.farthestPointVoronoiDiagram.vertices) {
      const distance = Math.sqrt((vertex.x - x) ** 2 + (vertex.y - y) ** 2);
      if (distance <= tolerance) {
        draggedGroup = group;
        return { type: "vertex", vertex };
      }
    }
  }

  // Edges prüfen
  for (let group of pointGroups) {
    for (const edge of group.farthestPointVoronoiDiagram.edges) {
      const projection = projectPointOntoLineSegment(edge.start, edge.end, {
        x,
        y,
      });
      const distance = Math.sqrt(
        (projection.x - x) ** 2 + (projection.y - y) ** 2
      );
      if (distance <= tolerance) {
        draggedGroup = group;
        return { type: "edge", edge, exactPoint: projection };
      }
    }
  }

  return hovered;
}

function projectPointOntoLineSegment(start, end, point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx ** 2 + dy ** 2;

  if (lengthSquared === 0) return null; // Linie hat keine Länge

  const t =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;

  // Projektion innerhalb des Liniensegments begrenzen
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    x: start.x + clampedT * dx,
    y: start.y + clampedT * dy,
  };
}

function distanceFromPointToLineSegment(point, start, end) {
  const projection = projectPointOntoLineSegment(start, end, point);
  if (!projection) return Infinity;

  const dx = point.x - projection.x;
  const dy = point.y - projection.y;

  return Math.sqrt(dx ** 2 + dy ** 2);
}

function selectHullPoints(event) {
  const x = event.offsetX;
  const y = event.offsetY;

  const addHullPoint = (point, group) => {
    svg
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 3)
      .attr("class", "selected-point")
      .style("fill", "yellow");
    if (selectedHullPoints.length === 0) {
      currentGroup = group; // vorher currentSelectedGroup
      highlightConvexHull(currentGroup);
      updateGroupSelector();
    }
    selectedHullPoints.push(point);
  };
  const removeHullPoint = (point) => {
    svg
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 3)
      .style("fill", "blue");
    selectedHullPoints = selectedHullPoints.filter((p) => p !== point);
    if (selectedHullPoints.length === 0) {
      currentGroup = null; // reset current group when last point was deselected // vorher currentSelectedGroup
      svg.selectAll(".highlighted-hull").remove(); // remove highlighted hull
      updateGroupSelector();
    }
  };
  // Prüfe, ob der Klick auf einem Punkt eines Convex Hulls liegt
  for (let group of pointGroups) {
    for (let point of group.convexHull) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance < 10) {
        // Füge den Punkt zur Auswahl hinzu, falls noch nicht vorhanden
        if (currentGroup != null && currentGroup !== group) {
          // vorher beide links im Vergleich currentSelectedGroup
          for (let oldPoint of currentGroup.points) {
            removeHullPoint(oldPoint);
          }
          addHullPoint(point, group);
          //console.error("Please select a point in the same group as the previously selected point!")
          //return;
        } else if (!selectedHullPoints.includes(point)) {
          addHullPoint(point, group);
        } else {
          removeHullPoint(point);
        }
      }
    }
  }
}

// #endregion
// #region Visualization

/* // Funktion zum Zeichnen aller Punkte im SVG
function redrawPoints() {
  // Entferne alle bisherigen Punkte
  svg.selectAll("circle").remove();

  // Zeichne alle Punkte neu
  pointGroup.points.forEach(point => {
    svg.append("circle")
       .attr("cx", point.x)
       .attr("cy", point.y)
       .attr("r", 5)
       .style("fill", "red");
  });
} */

function updateGroupSelector() {
  const groupSelector = document.getElementById("groupSelector");
  groupSelector.innerHTML = '<option value="none">-Select group-</option>';

  pointGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = group.name;

    // Überprüfe, ob die aktuelle Gruppe ausgewählt ist
    if (currentGroup && pointGroups[index] === currentGroup) {
      option.selected = true;
    }

    groupSelector.appendChild(option);
  });
}

function initSVG() {
  svg = d3
    .select("#visualization")
    .html("") // SVG-Inhalt zurücksetzen
    .append("svg")
    .attr("width", 1500)
    .attr("height", 1500);

  // Event-Listener für das SVG hinzufügen
  svg.on("click", function (event) {
    switch (currentMode) {
      case modes.ADD_POINTS:
        addPointToGroup(event);
        break;
      case modes.DELETE_POINTS:
        deletePointFromGroup(event);
        break;
      /* case Modes.MOVE:
        movePointInGroup(event);
        break; */
      case modes.LOCKED:
        console.log("Kein Modus aktiv. Keine Aktion möglich.");
        break;
      case modes.SELECT_HULL_POINTS:
        selectHullPoints(event);
        break;
    }
  });

  // Event-Listener für das SVG zum Bewegen von Punkten
  svg.on("mousedown", function (event) {
    const [x, y] = d3.pointer(event);
    if (currentMode === modes.MOVE_POINTS) {
      // Prüfen, ob der Klick in der Nähe eines vorhandenen Punktes liegt
      for (let pointGroup of pointGroups)
        for (let point of pointGroup.points) {
          const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
          if (distance < 10) {
            // Start Dragging
            isDragging = true;
            draggedPoint = point;
            draggedGroup = pointGroup;
            //pointGroup.updatePointGroup();
            break;
          }
        }
    } else if (currentMode === modes.RESIZE_DISKS_MANUALLY) {
      const [hoveredDisk, distanceToEdge] = getHoveredDisk(
        event.offsetX,
        event.offsetY
      );

      if (hoveredDisk && distanceToEdge < 5) {
        resizingDisk = hoveredDisk;
        isResizing = true;
      }
    } else if (currentMode === modes.RESIZE_DISKS_VIA_FPVD) {
      const hoveredVertexOrEdge = getHoveredVertexOrEdgeFPVD(x, y);

      if (hoveredVertexOrEdge) {
        isDragging = true;
      }
    }
  });

  svg.on("mousemove", function (event) {
    const [rawX, rawY] = d3.pointer(event);

    // Koordinaten auf ganze Zahlen runden
    const x = Math.max(0, Math.round(rawX));
    const y = Math.max(0, Math.round(rawY));

    // Koordinaten im Anzeigefeld aktualisieren
    coordinateDisplay.textContent = `X: ${x}, Y: ${y}`;
    if (currentMode === modes.MOVE_POINTS) {
      if (draggedPoint) {
        svg.style("cursor", "move");
        if (isDragging) {
          // Punkt während des Draggens aktualisieren
          draggedPoint.x = x;
          draggedPoint.y = y;
          draggedGroup.updatePointGroup();
        }
      } else {
        svg.style("cursor", "default");
      }

      renderVisualization();
    } else if (currentMode === modes.RESIZE_DISKS_MANUALLY) {
      const [hoveredDisk, distanceToEdge] = getHoveredDisk(
        event.offsetX,
        event.offsetY
      );

      if (hoveredDisk && distanceToEdge < 5) {
        // Näher am Rand
        svg.style("cursor", "ns-resize");
      } else {
        svg.style("cursor", "default");
      }
      if (isResizing && resizingDisk) {
        const dx = event.offsetX - resizingDisk.center.x;
        const dy = event.offsetY - resizingDisk.center.y;
        const newRadius = Math.sqrt(dx ** 2 + dy ** 2);

        if (newRadius > 0) {
          resizingDisk.radius = newRadius;
        }
        renderVisualization();
      }
    } else if (currentMode === modes.RESIZE_DISKS_VIA_FPVD) {
      const hoveredVertexOrEdge = getHoveredVertexOrEdgeFPVD(
        event.offsetX,
        event.offsetY
      );
      let pointGroup1, pointGroup2, tangentialPoint;
      if (selectedHierarchyEdge) {
        pointGroup1 = selectedHierarchyEdge.group1.group;
        pointGroup2 = selectedHierarchyEdge.group2.group;
      }
      const draggedGroupSelectedInHierarchy =
        draggedGroup &&
        (draggedGroup == pointGroup1 || draggedGroup == pointGroup2);

      if (draggedGroupSelectedInHierarchy) {
        tangentialPoint = GeometryUtils.calculateTangentialPoint(
          pointGroup1,
          pointGroup2
        );
        // Save the tangential point
        if (tangentialPoint) tangentialPoints.push(tangentialPoint);
      }

      if (hoveredVertexOrEdge) {
        svg.style("cursor", "move");
      } else {
        svg.style("cursor", "default");
      }

      if (hoveredVertexOrEdge && isDragging) {
        if (hoveredVertexOrEdge.type === "vertex") {
          // Dragging auf einem Vertex
          draggedGroup.setDiskFromThreePoints(
            hoveredVertexOrEdge.vertex.points
          );
        } else if (hoveredVertexOrEdge.type === "edge") {
          // Dragging auf einer Edge
          draggedGroup.setDiskFromTwoPointsAndCenter(
            hoveredVertexOrEdge.edge.points,
            hoveredVertexOrEdge.exactPoint
          );
        }
        if (draggedGroupSelectedInHierarchy && tangentialPoint) {
          if (draggedGroup == pointGroup1) {
            // Adjust the disks
            GeometryUtils.calculateNewDiskWithoutIntersection(
              pointGroup2,
              pointGroup1
            );
          } else {
            GeometryUtils.calculateNewDiskWithoutIntersection(
              pointGroup1,
              pointGroup2
            );
          }
          tangentialPoint = GeometryUtils.calculateTangentialPoint(
            pointGroup1,
            pointGroup2
          );
          // Save the tangential point
          if (tangentialPoint) tangentialPoints.push(tangentialPoint);
        }
        renderVisualization();
      }
    }
  });

  svg.on("mouseup", function () {
    if (currentMode === modes.MOVE_POINTS && isDragging) {
      // Dragging beenden
      isDragging = false;
      draggedPoint = null;
      //draggedGroup.updatePointGroup();
      draggedGroup = null;

      renderVisualization();
    } else if (currentMode === modes.RESIZE_DISKS_MANUALLY) {
      isResizing = false;
      resizingDisk = null;
      svg.style("cursor", "default");

      renderVisualization();
    } else if (currentMode === modes.RESIZE_DISKS_VIA_FPVD) {
      isDragging = false;

      renderVisualization();
    }
  });

  svg.on("mouseleave", function () {
    if (isDragging) {
      // Falls die Maus das SVG verlässt, Dragging abbrechen
      isDragging = false;
      draggedPoint = null;
      //draggedGroup.updatePointGroup();
      draggedGroup = null;

      // Visualisierung aktualisieren (nur den Punkt zeichnen)
      renderVisualization();
    }
  });

  return svg;
}

// Initialisiere svg durch direkten Aufruf
svg = initSVG();

function renderVisualization() {
  // Initialisiere SVG neu, um alte Inhalte zu entfernen
  svg = initSVG();

  // Überprüfen, ob pointGroups existiert und nicht leer ist
  if (!Array.isArray(pointGroups) || pointGroups.length === 0) {
    console.warn("Keine PointGroups gefunden, nichts zu rendern.");
    return;
  }

  // Visualisierung der PointGroups
  pointGroups.forEach((group, groupIndex) => {
    // Punkte visualisieren
    if (displayOptions.SHOW_POINTS) {
      svg
        .selectAll(`.point-group-${groupIndex}`)
        .data(group.points)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 3)
        .style("fill", "blue");
    }

    // Eine Disk visualisieren
    if (displayOptions.SHOW_DISKS && group.disk) {
      const disk = group.disk;
      const allDisks = pointGroups.flatMap((group) => group.disk);
      const diskCoversPoints = GeometryUtils.checkIfDiskCoversPoints(
        disk,
        group.convexHull
      );
      const diskCollides = GeometryUtils.checkIfDiskCollides(disk, allDisks);

      if (diskCoversPoints && !diskCollides) {
        svg
          .append("circle")
          .attr("cx", disk.center.x)
          .attr("cy", disk.center.y)
          .attr("r", disk.radius)
          .style("fill", "none")
          .style("stroke", "blue");

        // Grünes, schiefes Kreuz in der Mitte des Kreises (45 Grad geneigt)
        svg
          .append("line")
          .attr("x1", disk.center.x - 5)
          .attr("y1", disk.center.y)
          .attr("x2", disk.center.x + 5)
          .attr("y2", disk.center.y)
          .style("stroke", "green")
          .style("stroke-width", 2)
          .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);

        svg
          .append("line")
          .attr("x1", disk.center.x)
          .attr("y1", disk.center.y - 5)
          .attr("x2", disk.center.x)
          .attr("y2", disk.center.y + 5)
          .style("stroke", "green")
          .style("stroke-width", 2)
          .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);
      } else {
        svg
          .append("circle")
          .attr("cx", disk.center.x)
          .attr("cy", disk.center.y)
          .attr("r", disk.radius)
          .style("fill", "none")
          .style("stroke", "red");

        // Rotes, schiefes Kreuz in der Mitte des Kreises (45 Grad geneigt)
        svg
          .append("line")
          .attr("x1", disk.center.x - 5)
          .attr("y1", disk.center.y)
          .attr("x2", disk.center.x + 5)
          .attr("y2", disk.center.y)
          .style("stroke", "red")
          .style("stroke-width", 2)
          .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);

        svg
          .append("line")
          .attr("x1", disk.center.x)
          .attr("y1", disk.center.y - 5)
          .attr("x2", disk.center.x)
          .attr("y2", disk.center.y + 5)
          .style("stroke", "red")
          .style("stroke-width", 2)
          .attr("transform", `rotate(45, ${disk.center.x}, ${disk.center.y})`);
      }
    }

    // Farthest-Point Voronoi-Diagramm visualisieren
    if (group.farthestPointVoronoiDiagram) {
      const { vertices, edges } = group.farthestPointVoronoiDiagram;

      if (displayOptions.SHOW_INNER_FPVD) {
        // Vertices mit isInfinite=false als kleine Punkte darstellen
        svg
          .selectAll(`.inner-vertex-${groupIndex}`)
          .data(vertices.filter((vertex) => !vertex.isInfinite)) // Nur isInfinite=false
          .enter()
          .append("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", 2)
          .style("fill", "green");

        // Edges mit isInfinite=false visualisieren
        svg
          .selectAll(`.inner-edge-${groupIndex}`)
          .data(edges.filter((edge) => !edge.isInfinite)) // Nur isInfinite=false
          .enter()
          .append("line")
          .attr("x1", (d) => d.start.x)
          .attr("y1", (d) => d.start.y)
          .attr("x2", (d) => d.end.x)
          .attr("y2", (d) => d.end.y)
          .style("stroke", "green")
          .style("stroke-width", 1);
      }

      if (displayOptions.SHOW_OUTER_FPVD) {
        // Vertices mit isInfinite=true als kleine Punkte darstellen
        svg
          .selectAll(`.outer-vertex-${groupIndex}`)
          .data(vertices.filter((vertex) => vertex.isInfinite)) // Nur isInfinite=true
          .enter()
          .append("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", 2)
          .style("fill", "green");

        // Edges mit isInfinite=true visualisieren
        svg
          .selectAll(`.outer-edge-${groupIndex}`)
          .data(edges.filter((edge) => edge.isInfinite)) // Nur isInfinite=true
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

    // Wenn ein Convex Hull vorhanden ist, als gestrichelte Linie darstellen
    if (displayOptions.SHOW_CONVEX_HULLS && group.convexHull) {
      svg
        .append("polygon")
        .attr("points", group.convexHull.map((d) => [d.x, d.y]).join(" "))
        .style("fill", "none")
        .style("stroke", "orange")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "4,4"); // Diese Linie ist jetzt gestrichelt
    }

    // Den Namen der Gruppe anzeigen
    if (displayOptions.SHOW_NAME && group.name) {
      const xPos = group.points[0]?.x; // Position für den Text (z.B. erster Punkt der Gruppe)
      const yPos = group.points[0]?.y - 10; // Etwas oberhalb des ersten Punktes
      svg
        .append("text")
        .attr("x", xPos)
        .attr("y", yPos)
        .text(group.name)
        .style("fill", "black")
        .style("font-size", "12px")
        .style("text-anchor", "middle");
    }

    if (displayOptions.TRACE_TANGENTIAL_POINTS) {
      /*// Tangentialpunkte visualisieren
      if (Array.isArray(tangentialPoints) && tangentialPoints.length > 0) {
        // Sort points if necessary (optional, depending on how tangentialPoints is structured)
        const sortedPoints = [...tangentialPoints]; // Sort if needed, e.g., by x or y coordinate

        // Generate a path string
        const lineGenerator = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        svg.append("path")
            .datum(sortedPoints)
            .attr("d", lineGenerator)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 1);


      }*/

      // Tangentialpunkte visualisieren
      if (Array.isArray(tangentialPoints) && tangentialPoints.length > 0) {
        const maxDistance = 10; // Maximum distance to connect points

        // Filter points to only connect nearby points
        const filteredSegments = [];
        for (let i = 0; i < tangentialPoints.length - 1; i++) {
          const pointA = tangentialPoints[i];
          const pointB = tangentialPoints[i + 1];

          // Calculate distance between points
          const distance = Math.sqrt(
            (pointB.x - pointA.x) ** 2 + (pointB.y - pointA.y) ** 2
          );

          if (distance <= maxDistance) {
            // Add segment if distance is within threshold
            filteredSegments.push([pointA, pointB]);
          }
        }

        // Generate a path for each segment
        const lineGenerator = d3
          .line()
          .x((d) => d.x)
          .y((d) => d.y);

        filteredSegments.forEach((segment) => {
          svg
            .append("path")
            .datum(segment)
            .attr("d", lineGenerator)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 2);
        });
      }
    }
  });

  renderForestVisualization();
}

function highlightConvexHull(group) {
  const hull = group.convexHull;

  if (!hull) {
    alert("This group does not have a convex hull.");
    return;
  }

  // Entferne alte Highlights
  svg.selectAll(".highlighted-hull").remove();

  // Zeichne das Convex Hull als hervorgehobene Linie
  svg
    .append("polygon")
    .attr("class", "highlighted-hull")
    .attr("points", hull.map((d) => `${d.x},${d.y}`).join(" "))
    .style("fill", "none")
    .style("stroke", "yellow")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "4,4");
}

/* function visualizeForest(forest) {
  const container = d3.select("#tree"); // Das Group-Hierarchy-Feld
  container.html(""); // Vorherige Inhalte entfernen

  // Hilfsfunktion zur rekursiven Darstellung eines Baumes
  const renderNode = (node, parentElement) => {
    const nodeElement = parentElement.append("div")
      .style("margin-left", "20px")
      .style("padding", "5px")
      .style("border", "1px solid #ccc")
      .style("background-color", "#f9f9f9")
      .text(`Group: ${node.group.name || "Unnamed Group"}`); // Optional: Group-Name oder Platzhalter

    node.children.forEach(child => renderNode(child, nodeElement));
  };

  // Alle Bäume im Wald darstellen
  forest.forEach(tree => {
    const treeContainer = container.append("div")
      .style("margin-bottom", "20px")
      .style("border", "2px solid #333")
      .style("padding", "10px");
    renderNode(tree, treeContainer);
  });
} */

function renderForestVisualization() {
  let forest = [];
  if (currentTreeMode === treeModes.COLLISIONS)
    forest = GeometryUtils.buildForestFromDiskCollisions(pointGroups);
  else if (currentTreeMode === treeModes.PROXIMITY)
    forest = GeometryUtils.buildForestFromNearestDisks(pointGroups);
  const hierarchyData = convertForestToHierarchy(forest); // In D3-kompatibles Format umwandeln
  // Lösche vorherige Inhalte des Containers
  d3.select("#tree").html("");
  hierarchyData.forEach((treeData) => {
    visualizeTreeHierarchy(treeData); // Jeden Baum im Wald rendern
  });
}

function convertForestToHierarchy(forest) {
  // Konvertiere jeden Baum in ein hierarchisches Format
  return forest.map((tree) => buildD3Hierarchy(tree));
}

function buildD3Hierarchy(node) {
  return {
    name: node.group.name || "Unnamed Group",
    group: node.group,
    children: node.children.map((child) => buildD3Hierarchy(child)),
  };
}

/*function visualizeTreeHierarchy(hierarchyData) {
  const width = 500; // Breite des SVG
  const height = 500; // Höhe des SVG
  const margin = 50; // Abstand vom Rand

  const treeLayout = d3.tree().size([width - 2 * margin, height - 2 * margin]); // Baumgröße anpassen

  const svg = d3.select("#tree") // Wähle den Baum-Container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin}, ${margin})`); // Randabstand nach allen Seiten hinzufügen

  const root = d3.hierarchy(hierarchyData); // Hierarchische Datenstruktur für D3.js
  treeLayout(root); // Anwenden des Layouts auf die Daten

  // Links (Kanten) rendern
  g.selectAll("line")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .style("stroke", "black");

  // Knoten rendern
  g.selectAll("circle")
    .data(root.descendants())
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 5)
    .style("fill", "steelblue");

  // Beschriftungen rendern
  g.selectAll("text")
    .data(root.descendants())
    .enter()
    .append("text")
    .attr("x", d => d.x + 10)
    .attr("y", d => d.y)
    .text(d => d.data.name)
    .style("font-size", "12px");
}*/

function visualizeTreeHierarchy(hierarchyData) {
  const width = 500; // Breite des SVG
  const height = 500; // Höhe des SVG
  const margin = 50; // Abstand vom Rand

  const treeLayout = d3.tree().size([width - 2 * margin, height - 2 * margin]); // Baumgröße anpassen

  const svg = d3
    .select("#tree") // Wähle den Baum-Container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`); // Randabstand nach allen Seiten hinzufügen

  const root = d3.hierarchy(hierarchyData); // Hierarchische Datenstruktur für D3.js
  treeLayout(root); // Anwenden des Layouts auf die Daten

  // Links (Kanten) rendern
  g.selectAll("line")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y)
    .style("stroke", (d) => {
      // Prüfe, ob die aktuelle Kante bereits ausgewählt ist
      const isCurrentlySelected =
        selectedHierarchyEdge &&
        ((selectedHierarchyEdge.group1.group === d.source.data.group &&
          selectedHierarchyEdge.group2.group === d.target.data.group) ||
          (selectedHierarchyEdge.group1.group === d.target.data.group &&
            selectedHierarchyEdge.group2.group === d.source.data.group));
      if (!isCurrentlySelected) {
        return "black";
      } else {
        // Initial stroke color based on collision status
        const group1 = d.source.data.group;
        const group2 = d.target.data.group;
        if (GeometryUtils.checkIfDiskCollides(group1.disk, [group2.disk])) {
          return "red"; // Mark as colliding
        } else {
          return "green"; // Mark as not colliding
        }
      }
    })
    .style("stroke-width", 6)
    .on("click", function (event, d) {
      // Prüfe, ob die aktuelle Kante bereits ausgewählt ist
      const isCurrentlySelected =
        selectedHierarchyEdge &&
        ((selectedHierarchyEdge.group1 === d.source.data &&
          selectedHierarchyEdge.group2 === d.target.data) ||
          (selectedHierarchyEdge.group1 === d.target.data &&
            selectedHierarchyEdge.group2 === d.source.data));

      if (isCurrentlySelected) {
        // Wenn die Kante bereits ausgewählt ist, entferne sie
        selectedHierarchyEdge = null;
        tangentialPoints = [];
        d3.select(this).style("stroke", "black"); // Zurücksetzen der Farbe
      } else {
        // Markiere die vorherige Kante wieder als schwarz (falls vorhanden)
        g.selectAll("line").style("stroke", "black");

        // Wähle die neue Kante aus
        selectedHierarchyEdge = {
          group1: d.source.data,
          group2: d.target.data,
        };
        tangentialPoints = [];
        d3.select(this).style("stroke", "red"); // Markiere die neue Kante
      }
    });

  // Knoten rendern
  g.selectAll("circle")
    .data(root.descendants())
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 5)
    .style("fill", "steelblue");

  // Beschriftungen rendern
  g.selectAll("text")
    .data(root.descendants())
    .enter()
    .append("text")
    .attr("x", (d) => d.x + 10)
    .attr("y", (d) => d.y)
    .text((d) => d.data.name)
    .style("font-size", "12px");
}

function resetTreeHierarchy() {
  const treeContainer = document.querySelector("#tree");
  if (treeContainer) {
    treeContainer.innerHTML = ""; // Leert den Container
  }
}

function generateTestData() {
  const canvasSize = 900; // Canvas-Größe
  const numClusters = 5; // Anzahl der Cluster
  const pointsPerCluster = { min: 15, max: 20 }; // Punkteanzahl pro Cluster
  const radiusRange = { min: 100, max: 300 }; // Clustergrößen (Radien)
  const poissonRadius = 250; // Mindestabstand der Clusterzentren

  // Generiere Clusterzentren mit Poisson Disk Sampling
  const clusterCenters = generatePoissonDiskCenters(
    canvasSize,
    numClusters,
    poissonRadius
  );

  // Lösche bestehende PointGroups
  pointGroups.length = 0;

  // Generiere Punktgruppen
  clusterCenters.forEach((center, index) => {
    const radius =
      Math.random() * (radiusRange.max - radiusRange.min) + radiusRange.min;
    const numPoints =
      Math.floor(
        Math.random() * (pointsPerCluster.max - pointsPerCluster.min + 1)
      ) + pointsPerCluster.min;
    const points = generatePointsForCluster(center, radius, numPoints);

    // Erstelle eine neue PointGroup
    const newPointGroup = new PointGroup(`Group ${index + 1}`, points);
    pointGroups.push(newPointGroup);
  });

  renderVisualization(); // Aktualisiere die Visualisierung
  updateGroupSelector();

  console.log("Testdaten generiert:", pointGroups);
}

// Hilfsfunktion: Poisson Disk Sampling für Clusterzentren
function generatePoissonDiskCenters(canvasSize, numClusters, poissonRadius) {
  const centers = [];
  let attempts = 0;

  while (centers.length < numClusters && attempts < 1000) {
    const candidate = {
      x: Math.random() * canvasSize,
      y: Math.random() * canvasSize,
    };

    const valid = centers.every(
      (center) =>
        Math.sqrt(
          (center.x - candidate.x) ** 2 + (center.y - candidate.y) ** 2
        ) >= poissonRadius
    );

    if (valid) {
      centers.push(candidate);
    }

    attempts++;
  }

  if (centers.length < numClusters) {
    console.error("Failed to generate all cluster centers within constraints.");
  }

  return centers;
}

// Hilfsfunktion: Punkte innerhalb eines Clusters generieren
function generatePointsForCluster(center, radius, numPoints) {
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const r = Math.random() * radius;
    const theta = Math.random() * 2 * Math.PI;

    const x = center.x + r * Math.cos(theta);
    const y = center.y + r * Math.sin(theta);

    // Nur Punkte innerhalb des Canvas hinzufügen
    if (x >= 0 && x <= 900 && y >= 0 && y <= 900) {
      points.push({ x, y });
    }
  }

  return points;
}
