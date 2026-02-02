// generate random test data with clusters
import PointGroup from '../core/PointGroup.js';
import state from '../core/state.js';
import { TEST_DATA_CONFIG } from '../core/constants.js';
import { renderVisualization } from '../ui/visualization.js';
import { updateGroupSelector } from '../ui/uiControls.js';

// generate random test data with clusters
export function generateTestData() {
  const { 
    CANVAS_SIZE, 
    NUM_CLUSTERS, 
    POINTS_PER_CLUSTER_MIN, 
    POINTS_PER_CLUSTER_MAX,
    RADIUS_MIN,
    RADIUS_MAX,
    POISSON_RADIUS
  } = TEST_DATA_CONFIG;

  const clusterCenters = generatePoissonDiskCenters(
    CANVAS_SIZE,
    NUM_CLUSTERS,
    POISSON_RADIUS
  );

  state.pointGroups.length = 0;

  clusterCenters.forEach((center, index) => {
    const radius = Math.random() * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN;
    const numPoints = Math.floor(
      Math.random() * (POINTS_PER_CLUSTER_MAX - POINTS_PER_CLUSTER_MIN + 1)
    ) + POINTS_PER_CLUSTER_MIN;
    const points = generatePointsForCluster(center, radius, numPoints, CANVAS_SIZE);

    const newPointGroup = new PointGroup(`Group ${index + 1}`, points);
    state.pointGroups.push(newPointGroup);
  });

  renderVisualization();
  updateGroupSelector();

  console.log("test data generated:", state.pointGroups);
}

// generate cluster centers using poisson disk sampling
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

// generate points within cluster radius
function generatePointsForCluster(center, radius, numPoints, canvasSize) {
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const r = Math.random() * radius;
    const theta = Math.random() * 2 * Math.PI;

    const x = center.x + r * Math.cos(theta);
    const y = center.y + r * Math.sin(theta);

    if (x >= 0 && x <= canvasSize && y >= 0 && y <= canvasSize) {
      points.push({ x, y });
    }
  }

  return points;
}
