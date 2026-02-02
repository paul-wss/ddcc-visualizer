// point group with disk, hull and voronoi diagram
import GeometryUtils from './GeometryUtils.js';

class PointGroup {
  constructor(
    name = null, 
    points = [], 
    disk = null, 
    farthestPointVoronoiDiagram = null, 
    convexHull = null
  ) {
    this.name = name;
    this.points = points;
    this.disk = disk;
    this.convexHull = convexHull || GeometryUtils.calculateConvexHull(this.points);
    this.farthestPointVoronoiDiagram = farthestPointVoronoiDiagram || 
      GeometryUtils.calculateFarthestPointVoronoiDiagram(this.convexHull);
  }

  // add point to group
  addPoint(x, y) {
    this.points.push({ x, y });
    this.updatePointGroup();
  }

  // remove point from group
  deletePoint(point) {
    this.points = this.points.filter(p => p !== point);
    this.updatePointGroup();
  }

  // set disk from two points (smallest enclosing)
  setDiskFromTwoPoints(points) {
    const [p1, p2] = points;
    this.disk = GeometryUtils.calculateSmallestCircleFromTwoPoints(points, this.convexHull);
    console.log(
      `Smallest enclosing disk added to Group ${this.name} via two points ` +
      `[${p1.x}, ${p1.y}] [${p2.x}, ${p2.y}] with radius ${this.disk.radius}`
    );
  }

  // set disk from two points and center
  setDiskFromTwoPointsAndCenter(points, center) {
    const [p1, p2] = points;
    this.disk = GeometryUtils.calculateCircleFromTwoPointsAndCenter(points, center);
    console.log(
      `Disk added to Group ${this.name} via two points ` +
      `[${p1.x}, ${p1.y}] [${p2.x}, ${p2.y}] and center ` +
      `[${center.x}, ${center.y}] with radius ${this.disk.radius}`
    );
  }

  // set disk from three points (circumcircle)
  setDiskFromThreePoints(points) {
    const [p1, p2, p3] = points;
    this.disk = GeometryUtils.calculateCircleFromThreePoints(p1, p2, p3);
    console.log(
      `Disk added to Group ${this.name} via three points ` +
      `[${p1.x}, ${p1.y}] [${p2.x}, ${p2.y}] [${p3.x}, ${p3.y}] ` +
      `with radius ${this.disk.radius}`
    );
  }

  // recalculate hull and voronoi after changes
  updatePointGroup() {
    this.convexHull = GeometryUtils.calculateConvexHull(this.points);
    this.farthestPointVoronoiDiagram = GeometryUtils.calculateFarthestPointVoronoiDiagram(this.convexHull);
  }

  // check if disk covers all points
  checkIfDiskCoversPoints() {
    return GeometryUtils.checkIfDiskCoversPoints(this.disk, this.convexHull);
  }
}

export default PointGroup;
