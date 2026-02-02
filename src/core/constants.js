// interaction modes
export const MODES = {
  LOCKED: "locked",
  ADD_POINTS: "add_points",
  DELETE_POINTS: "delete_points",
  MOVE_POINTS: "move_points",
  SELECT_HULL_POINTS: "select_hull_points",
  RESIZE_DISKS_VIA_FPVD: "resize_disks_via_FPVD",
  RESIZE_DISKS_MANUALLY: "resize_disks_manually",
  MOVE_DISKS_MANUALLY: "move_disks_manually",
};

// tree view modes
export const TREE_MODES = {
  COLLISIONS: "collisions",
  PROXIMITY: "proximity",
};

// display toggles
export const DEFAULT_DISPLAY_OPTIONS = {
  SHOW_NAME: true,
  SHOW_POINTS: true,
  SHOW_DISKS: true,
  SHOW_CONVEX_HULLS: true,
  SHOW_INNER_FPVD: true,
  SHOW_OUTER_FPVD: true,
  TRACE_TANGENTIAL_POINTS: true,
};

// canvas settings
export const CANVAS_CONFIG = {
  WIDTH: 1500,
  HEIGHT: 1500,
  POINT_RADIUS: 3,
  CLICK_TOLERANCE: 10,
  EDGE_TOLERANCE: 5,
};

// test data generation params
export const TEST_DATA_CONFIG = {
  CANVAS_SIZE: 900,
  NUM_CLUSTERS: 5,
  POINTS_PER_CLUSTER_MIN: 15,
  POINTS_PER_CLUSTER_MAX: 20,
  RADIUS_MIN: 100,
  RADIUS_MAX: 300,
  POISSON_RADIUS: 250,
};
