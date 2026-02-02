// application state
import { MODES, TREE_MODES, DEFAULT_DISPLAY_OPTIONS } from './constants.js';

const state = {
  // svg element
  svg: null,
  
  // data
  pointGroups: [],
  currentGroup: null,
  tangentialPoints: [],
  
  // modes
  currentMode: MODES.LOCKED,
  currentTreeMode: TREE_MODES.COLLISIONS,
  
  // display options
  displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
  
  // drag & drop state
  isDragging: false,
  draggedPoint: null,
  draggedGroup: null,
  
  // hull point selection
  selectedHullPoints: [],
  
  // disk resizing
  resizingDisk: null,
  isResizing: false,
  
  // hierarchy selection
  selectedHierarchyEdge: null,
};

export default state;
