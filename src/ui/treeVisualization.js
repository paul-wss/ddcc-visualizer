// tree hierarchy visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import state from '../core/state.js';
import GeometryUtils from '../core/GeometryUtils.js';
import { TREE_MODES } from '../core/constants.js';

// render forest visualization
export function renderForestVisualization() {
  let forest = [];
  
  if (state.currentTreeMode === TREE_MODES.COLLISIONS) {
    forest = GeometryUtils.buildForestFromDiskCollisions(state.pointGroups);
  } else if (state.currentTreeMode === TREE_MODES.PROXIMITY) {
    forest = GeometryUtils.buildForestFromNearestDisks(state.pointGroups);
  }
  
  const hierarchyData = convertForestToHierarchy(forest);
  
  d3.select("#tree").html("");
  
  hierarchyData.forEach((treeData) => {
    visualizeTreeHierarchy(treeData);
  });
}

// convert forest to d3 hierarchy format
function convertForestToHierarchy(forest) {
  return forest.map((tree) => buildD3Hierarchy(tree));
}

// build d3 hierarchy from tree node
function buildD3Hierarchy(node) {
  return {
    name: node.group.name || "Unnamed Group",
    group: node.group,
    children: node.children.map((child) => buildD3Hierarchy(child)),
  };
}

// visualize single tree
function visualizeTreeHierarchy(hierarchyData) {
  const width = 500;
  const height = 500;
  const margin = 50;

  const treeLayout = d3.tree().size([width - 2 * margin, height - 2 * margin]);

  const svg = d3
    .select("#tree")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`);

  const root = d3.hierarchy(hierarchyData);
  treeLayout(root);

  // Links (Kanten) rendern
  g.selectAll("line")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y)
    .style("stroke", (d) => getEdgeColor(d))
    .style("stroke-width", 6)
    .on("click", function (event, d) {
      handleEdgeClick(d, this, g);
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

// determine edge color based on collision status
function getEdgeColor(d) {
  const isCurrentlySelected =
    state.selectedHierarchyEdge &&
    ((state.selectedHierarchyEdge.group1.group === d.source.data.group &&
      state.selectedHierarchyEdge.group2.group === d.target.data.group) ||
      (state.selectedHierarchyEdge.group1.group === d.target.data.group &&
        state.selectedHierarchyEdge.group2.group === d.source.data.group));

  if (!isCurrentlySelected) {
    return "black";
  }

  const group1 = d.source.data.group;
  const group2 = d.target.data.group;
  
  if (GeometryUtils.checkIfDiskCollides(group1.disk, [group2.disk])) {
    return "red";
  }
  return "green";
}

// handle edge clicks
function handleEdgeClick(d, element, g) {
  const isCurrentlySelected =
    state.selectedHierarchyEdge &&
    ((state.selectedHierarchyEdge.group1 === d.source.data &&
      state.selectedHierarchyEdge.group2 === d.target.data) ||
      (state.selectedHierarchyEdge.group1 === d.target.data &&
        state.selectedHierarchyEdge.group2 === d.source.data));

  if (isCurrentlySelected) {
    state.selectedHierarchyEdge = null;
    state.tangentialPoints = [];
    d3.select(element).style("stroke", "black");
  } else {
    g.selectAll("line").style("stroke", "black");

    state.selectedHierarchyEdge = {
      group1: d.source.data,
      group2: d.target.data,
    };
    state.tangentialPoints = [];
    d3.select(element).style("stroke", "red");
  }
}

// reset tree hierarchy
export function resetTreeHierarchy() {
  const treeContainer = document.querySelector("#tree");
  if (treeContainer) {
    treeContainer.innerHTML = "";
  }
}
