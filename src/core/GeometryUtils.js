// geometry utilities for computational geometry operations
class GeometryUtils {
  
  // graham scan for convex hull
  static calculateConvexHull(points) {
    if (points.length < 3) {
      if (points.length === 2) {
        const [p1, p2] = points;
        const orientation = (p2.x - p1.x) * (p2.y - p1.y);
        if (orientation < 0) {
          return [p2, p1];
        } else {
          return [p1, p2];
        }
      }
      return points;
    }

    let sortedPoints = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
    const startPoint = sortedPoints[0];

    function cross(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    sortedPoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
      const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
      return angleA - angleB;
    });

    const hull = [];
    for (let point of sortedPoints) {
      while (
        hull.length >= 2 &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0
      ) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  // compute farthest-point voronoi diagram
  static calculateFarthestPointVoronoiDiagram(convexHull) {
    const vertices = [];
    const edges = [];
    const incidentEdgesMap = new Map();

    function cross(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // edge case: only two points
    if (convexHull.length === 2) {
      const [p1, p2] = convexHull;

      const midpoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const normal = { x: -dy, y: dx };

      const length = Math.sqrt(normal.x ** 2 + normal.y ** 2);
      const normalizedNormal = { x: normal.x / length, y: normal.y / length };

      const infiniteVertex1 = {
        x: midpoint.x + normalizedNormal.x * 900,
        y: midpoint.y + normalizedNormal.y * 900,
        points: null,
        isInfinite: true,
      };
      const infiniteVertex2 = {
        x: midpoint.x - normalizedNormal.x * 900,
        y: midpoint.y - normalizedNormal.y * 900,
        points: null,
        isInfinite: true,
      };

      const infiniteEdge = {
        start: infiniteVertex1,
        end: infiniteVertex2,
        points: [p1, p2],
        isInfinite: true,
      };

      vertices.push(infiniteVertex1, infiniteVertex2);
      edges.push(infiniteEdge);

      return { vertices, edges };
    }

    // find all valid voronoi vertices
    for (let i = 0; i < convexHull.length; i++) {
      for (let j = i + 1; j < convexHull.length; j++) {
        for (let k = j + 1; k < convexHull.length; k++) {
          let p1 = convexHull[i];
          let p2 = convexHull[j];
          let p3 = convexHull[k];

          if (cross(p1, p2, p3) < 0) {
            [p2, p3] = [p3, p2];
          }

          const circumcenter = this.calculateCircumcenter(p1, p2, p3);

          const radius = this.distance(p1, circumcenter);
          const allPointsInside = convexHull.every(
            (p) => this.distance(p, circumcenter) <= radius + 1e-6
          );

          if (allPointsInside) {
            const vertex = {
              x: circumcenter.x,
              y: circumcenter.y,
              points: [p1, p2, p3],
              isInfinite: false,
            };
            vertices.push(vertex);
            incidentEdgesMap.set(vertex, []);
          }
        }
      }
    }

    // connect vertices that share two points
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex1 = vertices[i];
        const vertex2 = vertices[j];

        const sharedPoints = this.getTwoSharedPoints(
          vertex1.points,
          vertex2.points
        );
        if (sharedPoints) {
          let [p1, p2] = sharedPoints;

          const idx1 = convexHull.indexOf(p1);
          const idx2 = convexHull.indexOf(p2);

          if (idx1 > idx2) {
            [p1, p2] = [p2, p1];
          }

          const edge = {
            start: vertex1,
            end: vertex2,
            points: [p1, p2],
            isInfinite: false,
          };
          edges.push(edge);
          incidentEdgesMap.get(vertex1).push(edge);
          incidentEdgesMap.get(vertex2).push(edge);
        }
      }
    }

    // add infinite edges
    const infiniteVertices = [];
    for (const vertex of vertices) {
      const { points } = vertex;

      const orderedPoints = points
        .map((p) => convexHull.indexOf(p))
        .sort((a, b) => a - b);

      for (let i = 0; i < orderedPoints.length; i++) {
        const p1 = convexHull[orderedPoints[i]];
        const p2 = convexHull[orderedPoints[(i + 1) % orderedPoints.length]];

        const existingEdge = incidentEdgesMap
          .get(vertex)
          .find((edge) => edge.points.includes(p1) && edge.points.includes(p2));

        if (!existingEdge) {
          const bisector = this.calculatePerpendicularBisector(p1, p2);
          const direction = bisector.normal;

          const infiniteVertex = {
            x: vertex.x + direction.x * 900,
            y: vertex.y + direction.y * 900,
            points: null,
            isInfinite: true,
          };

          const edge = {
            start: vertex,
            end: infiniteVertex,
            points: [p1, p2],
            isInfinite: true,
          };
          edges.push(edge);
          infiniteVertices.push(infiniteVertex);
        }
      }
    }

    vertices.push(...infiniteVertices);

    return { vertices, edges };
  }

  // perpendicular bisector of two points
  static calculatePerpendicularBisector(p1, p2) {
    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const normal = {
      x: -dy,
      y: dx,
    };

    return { midpoint, normal };
  }

  // circumcenter of triangle
  static calculateCircumcenter(p1, p2, p3) {
    const D =
      2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
    const Ux =
      ((p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) +
        (p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) +
        (p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)) /
      D;
    const Uy =
      ((p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) +
        (p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) +
        (p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)) /
      D;

    return { x: Ux, y: Uy };
  }

  // euclidean distance
  static distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  // find two shared points between arrays
  static getTwoSharedPoints(points1, points2) {
    const sharedPoints = [];

    for (let p1 of points1) {
      for (let p2 of points2) {
        if (p1.x === p2.x && p1.y === p2.y) {
          sharedPoints.push(p1);
        }
      }
    }

    if (sharedPoints.length === 2) {
      return sharedPoints;
    }

    return null;
  }

  // smallest circle through two points covering all hull points
  static calculateSmallestCircleFromTwoPoints(points, convexHull) {
    if (points.length !== 2) {
      console.log("More than two points were given to calculateSmallestCircle");
      return null;
    }

    const [p1, p2] = points;

    let center = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
    let radius = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) / 2;

    convexHull.forEach((point) => {
      if (
        (point.x === p1.x && point.y === p1.y) ||
        (point.x === p2.x && point.y === p2.y)
      ) {
        return;
      }

      const distance = Math.sqrt(
        (point.x - center.x) ** 2 + (point.y - center.y) ** 2
      );

      if (distance > radius) {
        const newCircle = GeometryUtils.calculateCircleFromThreePoints(
          p1,
          p2,
          point
        );
        if (newCircle) {
          center = newCircle.center;
          radius = newCircle.radius;
        }
      }
    });

    return { center, radius };
  }

  // circle through two points with given center
  static calculateCircleFromTwoPointsAndCenter(points, center) {
    if (points.length !== 2) {
      console.error("Error: Exactly two points are required!");
      return null;
    }

    const [p1, p2] = points;

    const distance1 = Math.sqrt(
      (p1.x - center.x) ** 2 + (p1.y - center.y) ** 2
    );

    const distance2 = Math.sqrt(
      (p2.x - center.x) ** 2 + (p2.y - center.y) ** 2
    );

    if (Math.abs(distance1 - distance2) > 1e-6) {
      console.error(
        "Error: The points do not lie on a circle with the specified center!"
      );
      return null;
    }

    const radius = distance1;

    return { center, radius };
  }

  // circumcircle through three points
  static calculateCircleFromThreePoints(p1, p2, p3) {
    const A =
      p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y);
    if (A === 0) {
      console.log("The points are collinear and cannot form a circle.");
      return null;
    }

    const D = 2 * A;
    const Ux =
      ((p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) +
        (p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) +
        (p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)) /
      D;
    const Uy =
      ((p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) +
        (p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) +
        (p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)) /
      D;

    const center = { x: Ux, y: Uy };
    const radius = Math.sqrt((p1.x - Ux) ** 2 + (p1.y - Uy) ** 2);

    return { center, radius };
  }

  // check if disk covers all hull points
  static checkIfDiskCoversPoints(disk, convexHull) {
    if (!disk || !disk.center || typeof disk.radius !== "number") {
      console.error(
        "Invalid disk object. Ensure it has 'center' and 'radius' properties."
      );
      return false;
    }

    const { center, radius } = disk;

    for (const point of convexHull) {
      const distance = Math.sqrt(
        (point.x - center.x) ** 2 + (point.y - center.y) ** 2
      );

      if (distance > radius + 1e-6) {
        return false;
      }
    }

    return true;
  }

  // check for disk collisions
  static checkIfDiskCollides(disk, otherDisks, epsilon = 1e-3) {
    for (let otherDisk of otherDisks) {
      if (!otherDisk || disk === otherDisk) continue;

      const dx = disk.center.x - otherDisk.center.x;
      const dy = disk.center.y - otherDisk.center.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance <= disk.radius + otherDisk.radius + epsilon) {
        return true;
      }
    }
    return false;
  }

  // build forest based on disk collisions
  static buildForestFromDiskCollisions(pointGroups) {
    const createNode = (group) => ({
      group: group,
      children: [],
    });

    const forest = [];
    const visited = new Set();

    for (let pointGroup of pointGroups) {
      if (visited.has(pointGroup)) continue;

      const root = createNode(pointGroup);
      visited.add(pointGroup);
      const queue = [root];

      while (queue.length > 0) {
        const currentNode = queue.shift();

        for (let otherGroup of pointGroups) {
          if (visited.has(otherGroup)) continue;

          if (
            currentNode.group.disk &&
            otherGroup.disk &&
            GeometryUtils.checkIfDiskCollides(
              currentNode.group.disk,
              [otherGroup.disk],
              3
            )
          ) {
            const childNode = createNode(otherGroup);
            currentNode.children.push(childNode);
            queue.push(childNode);
            visited.add(otherGroup);
          }
        }
      }

      forest.push(root);
    }

    return forest;
  }

  // build forest based on proximity
  static buildForestFromNearestDisks(pointGroups) {
    const createNode = (group) => ({
      group: group,
      children: [],
    });

    const forest = [];
    const visited = new Set();

    const edgeDistance = (disk1, disk2) => {
      const centerDistance = GeometryUtils.distance(disk1.center, disk2.center);
      return Math.max(0, centerDistance - disk1.radius - disk2.radius);
    };

    for (let pointGroup of pointGroups) {
      if (visited.has(pointGroup)) continue;

      const root = createNode(pointGroup);
      visited.add(pointGroup);
      const queue = [root];

      while (queue.length > 0) {
        const currentNode = queue.shift();
        const currentDisk = currentNode.group.disk;

        if (!currentDisk) continue;

        let nearestGroups = [];
        let minDistance = Infinity;

        for (let otherGroup of pointGroups) {
          if (visited.has(otherGroup)) continue;

          const otherDisk = otherGroup.disk;
          if (!otherDisk) continue;

          const distance = edgeDistance(currentDisk, otherDisk);

          if (distance < minDistance) {
            minDistance = distance;
            nearestGroups = [otherGroup];
          } else if (distance === minDistance) {
            nearestGroups.push(otherGroup);
          }
        }

        for (let nearestGroup of nearestGroups) {
          const childNode = createNode(nearestGroup);
          currentNode.children.push(childNode);
          queue.push(childNode);
          visited.add(nearestGroup);
        }
      }

      forest.push(root);
    }

    return forest;
  }

  // resolve collision by moving disk
  static calculateNewDiskWithoutIntersection(pointGroupA, pointGroupB) {
    const p_A1 = pointGroupA.points[0];
    const p_A2 = pointGroupA.points[1];
    const centerB = pointGroupB.disk.center;
    const radiusB = pointGroupB.disk.radius;

    const midpointA = {
      x: (p_A1.x + p_A2.x) / 2,
      y: (p_A1.y + p_A2.y) / 2,
    };

    const dx = p_A2.x - p_A1.x;
    const dy = p_A2.y - p_A1.y;
    let normalVector = { x: -dy, y: dx };

    const mag = Math.sqrt(normalVector.x ** 2 + normalVector.y ** 2);
    normalVector.x /= mag;
    normalVector.y /= mag;

    const directionToB = {
      x: centerB.x - midpointA.x,
      y: centerB.y - midpointA.y,
    };
    const dotProduct =
      normalVector.x * directionToB.x + normalVector.y * directionToB.y;
    if (dotProduct > 0) {
      normalVector.x = -normalVector.x;
      normalVector.y = -normalVector.y;
    }

    const U = { x: midpointA.x - p_A1.x, y: midpointA.y - p_A1.y };
    const W = { x: midpointA.x - centerB.x, y: midpointA.y - centerB.y };

    const U2 = U.x * U.x + U.y * U.y;
    const W2 = W.x * W.x + W.y * W.y;

    const nU = normalVector.x * U.x + normalVector.y * U.y;
    const nW = normalVector.x * W.x + normalVector.y * W.y;

    const alpha = (W2 - U2 - radiusB * radiusB) / (2 * radiusB);
    const beta = (nW - nU) / radiusB;

    const A = 1 - beta * beta;
    const B = 2 * nU - 2 * alpha * beta;
    const C = U2 - alpha * alpha;

    const discriminant = B * B - 4 * A * C;
    if (discriminant < 0) {
      throw new Error(
        "no real solution: circles cannot be made tangential."
      );
    }

    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-B + sqrtD) / (2 * A);
    const t2 = (-B - sqrtD) / (2 * A);

    let t = Math.max(t1, t2);

    const newCenter = {
      x: midpointA.x + (t + 1) * normalVector.x,
      y: midpointA.y + (t + 1) * normalVector.y,
    };

    const radiusA = Math.sqrt(
      (newCenter.x - p_A1.x) ** 2 + (newCenter.y - p_A1.y) ** 2
    );

    const newDisk = {
      center: newCenter,
      radius: radiusA,
    };
    pointGroupA.disk = newDisk;

    return newDisk;
  }

  // find tangent point between two disks
  static calculateTangentialPoint(pointGroupA, pointGroupB, epsilon = 3) {
    const diskA = pointGroupA.disk;
    const diskB = pointGroupB.disk;

    if (!diskA || !diskB) {
      console.error("One or both disks are missing.");
      return null;
    }

    const dx = diskB.center.x - diskA.center.x;
    const dy = diskB.center.y - diskA.center.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (Math.abs(distance - (diskA.radius + diskB.radius)) > epsilon) {
      return null;
    }

    const ratio = diskA.radius / (diskA.radius + diskB.radius);
    const tangentialPoint = {
      x: diskA.center.x + ratio * dx,
      y: diskA.center.y + ratio * dy,
    };

    return tangentialPoint;
  }

  // max distance between all points
  static maxDistance(pointGroups) {
    let maxDist = 0;

    const allPoints = pointGroups.flatMap((group) => group.points);

    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const [x1, y1] = allPoints[i];
        const [x2, y2] = allPoints[j];
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        maxDist = Math.max(maxDist, dist);
      }
    }

    return maxDist;
  }
}

export default GeometryUtils;
