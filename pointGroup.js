import GeometryUtils from './GeometryUtils.js'; // Importiere die GeometryUtils-Klasse


class PointGroup {
  constructor(name = null, points = [], disk = null, /* diskCoversPoints = false, */ farthestPointVoronoiDiagram = null, convexHull = null) {
    this.name = name;
    this.points = points; // Array von Punkten (x, y)
    this.disk = disk; // Eine Disk, die dieser Gruppe zugeordnet ist
    // this.diskCoversPoints = diskCoversPoints;
    this.convexHull = convexHull || GeometryUtils.calculateConvexHull(this.points); // Speichern des Convex Hulls, falls vorhanden
    this.farthestPointVoronoiDiagram = farthestPointVoronoiDiagram || GeometryUtils.calculateFarthestPointVoronoiDiagram(this.convexHull); // Voronoi-Diagramm
  }

  // Methode, um Punkte hinzuzufügen
  addPoint(x, y) {
    this.points.push({ x, y });
    this.updatePointGroup();
  }

  // Methode zum Löschen eines Punktes (keine Distanzprüfung mehr)
  deletePoint(point) {
    // Entferne den angegebenen Punkt
    this.points = this.points.filter(p => p !== point);
    this.updatePointGroup();
  }

  setDiskFromTwoPoints(points) {
    const [p1, p2] = points;
    this.disk = GeometryUtils.calculateSmallestCircleFromTwoPoints(points, this.convexHull);
    console.log(`Smallest enclosing disk ${this.disk} added to Group ${this.name} via two points [${p1.x} , ${p1.y}] [${p2.x} , ${p2.y}] with radius ${this.disk.radius}`);
  }

  setDiskFromTwoPointsAndCenter(points, center) {
    const [p1, p2] = points;
    this.disk = GeometryUtils.calculateCircleFromTwoPointsAndCenter(points, center);
    console.log(`Disk ${this.disk} added to Group ${this.name} via two points [${p1.x} , ${p1.y}] [${p2.x} , ${p2.y}] and center [${center.x} , ${center.y}] with radius ${this.disk.radius}`);
  }


  setDiskFromThreePoints(points) {
    const [p1, p2, p3] = points;
    this.disk = GeometryUtils.calculateCircleFromThreePoints(p1, p2, p3)
    console.log(`Disk ${this.disk} added to Group ${this.name} via three points [${p1.x} , ${p1.y}] [${p2.x} , ${p2.y}] [${p3.x} , ${p3.y}] with radius ${this.disk.radius}`);
  }

  updatePointGroup() {
    this.convexHull = GeometryUtils.calculateConvexHull(this.points);
    this.farthestPointVoronoiDiagram = GeometryUtils.calculateFarthestPointVoronoiDiagram(this.convexHull);
  }

  checkIfDiskCoversPoints() {
    return GeometryUtils.checkIfDiskCoversPoints(this.disk, this.convexHull);
  }

  
}

// Export der Klasse
export default PointGroup;
