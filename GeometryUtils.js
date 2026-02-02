// GeometryUtils.js

import pointGroup from "./pointGroup.js";

class GeometryUtils {
  // Berechnet den Convex Hull mit dem Graham-Scan-Algorithmus
  static calculateConvexHull(points) {
    if (points.length < 3) {
      if (points.length === 2) {
        const [p1, p2] = points;

        // Berechne die Orientierung der beiden Punkte
        const orientation = (p2.x - p1.x) * (p2.y - p1.y);

        // Sortiere die Punkte, sodass die Reihenfolge CCW ist
        if (orientation < 0) {
          return [p2, p1];
        } else {
          return [p1, p2]; // Abgedeckte Normalfälle
        }
      }
      return points;
    }

    // Sortiere die Punkte nach dem niedrigsten y-Wert und dann nach x-Wert
    let sortedPoints = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
    const startPoint = sortedPoints[0];

    // Funktion für das Cross-Product (bestimmt die Orientierung der Drehung)
    function cross(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // Sortiere alle Punkte nach dem Polarwinkel zum Startpunkt
    sortedPoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
      const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
      return angleA - angleB;
    });

    // Erstelle den Convex Hull
    const hull = [];
    for (let point of sortedPoints) {
      while (
        hull.length >= 2 &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0
      ) {
        hull.pop(); // Entferne den letzten Punkt, falls es eine "rechte" Drehung gibt
      }
      hull.push(point);
    }

    return hull;
  }

  /*static calculateFarthestPointVoronoiDiagram(convexHull) {
      const vertices = [];
      const edges = [];
  
      let CH = convexHull.slice(); // Start with the convex hull points
  
      // Helper function to compute the center of the circle from three points
      const calculateCircleCenter = (p1, p2, p3) => {
        const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
        const ux = ((p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) + (p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) + (p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)) / d;
        const uy = ((p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) + (p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) + (p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)) / d;
        return { x: ux, y: uy };
      };
  
      // Construct the farthest-point Voronoi diagram
      while (CH.length > 2) {
        for (let i = 0; i < CH.length; i++) {
          const prev = CH[(i - 1 + CH.length) % CH.length];
          const curr = CH[i];
          const next = CH[(i + 1) % CH.length];
  
          const circleCenter = calculateCircleCenter(prev, curr, next);
          vertices.push(circleCenter);
  
          const prevVertex = { x: prev.x, y: prev.y };
          const nextVertex = { x: next.x, y: next.y };
  
          // Create edges from the new vertex to the previous and next vertices
          edges.push({ start: circleCenter, end: prevVertex });
          edges.push({ start: circleCenter, end: nextVertex });
  
          // Remove the current point from the convex hull as it has been processed
          CH.splice(i, 1);
          break;
        }
      }
    
        // Add the final edge between the last two remaining points
        const finalEdge = { start: CH[0], end: CH[1] };
        edges.push(finalEdge);
    
        return { vertices, edges };
    }*/

  /* falsch
  static calculateFarthestPointVoronoiDiagram(convexHull) {
    const vertices = [];
    const edges = [];
    const sharedPointsMap = new Map();

    // Schritt 1: Berechne alle möglichen Voronoi-Vertices
    for (let i = 0; i < convexHull.length; i++) {
      for (let j = i + 1; j < convexHull.length; j++) {
        for (let k = j + 1; k < convexHull.length; k++) {
          const p1 = convexHull[i];
          const p2 = convexHull[j];
          const p3 = convexHull[k];

          // Berechne den Umkreismittelpunkt für (p1, p2, p3)
          const circumcenter = this.calculateCircumcenter(p1, p2, p3);

          // Prüfe, ob der Kreis alle Punkte der Menge einschließt
          const radius = this.distance(p1, circumcenter);
          const allPointsInside = convexHull.every(p => this.distance(p, circumcenter) <= radius + 1e-6);

          if (allPointsInside) {
            // Speichere den Voronoi-Vertex
            vertices.push(circumcenter);

            // Speichere die Shared Points für spätere Kantenberechnung
            const key = JSON.stringify(circumcenter);
            sharedPointsMap.set(key, [p1, p2, p3]);
          }
        }
      }
    }

    // Schritt 2: Berechne Kanten basierend auf Shared Points
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex1 = vertices[i];
        const vertex2 = vertices[j];

        // Prüfe, ob vertex1 und vertex2 gemeinsame Punkte haben
        const shared1 = sharedPointsMap.get(JSON.stringify(vertex1));
        const shared2 = sharedPointsMap.get(JSON.stringify(vertex2));
        if (this.hasTwoSharedPoints(shared1, shared2)) {
          edges.push({ start: vertex1, end: vertex2 });
        }
      }
    }

    return { vertices, edges };
  }*/

  /* letzte funktionierende Version von FPVC
 static calculateFarthestPointVoronoiDiagram(convexHull) {
    const vertices = [];
    const edges = [];
    const sharedPointsMap = new Map();

    // Schritt 1: Berechne alle möglichen Voronoi-Vertices
    for (let i = 0; i < convexHull.length; i++) {
      for (let j = i + 1; j < convexHull.length; j++) {
        for (let k = j + 1; k < convexHull.length; k++) {
          const p1 = convexHull[i];
          const p2 = convexHull[j];
          const p3 = convexHull[k];

          // Berechne den Umkreismittelpunkt für (p1, p2, p3)
          const circumcenter = this.calculateCircumcenter(p1, p2, p3);

          // Prüfe, ob der Kreis alle Punkte der Menge einschließt
          const radius = this.distance(p1, circumcenter);
          const allPointsInside = convexHull.every(p => this.distance(p, circumcenter) <= radius + 1e-6);

          if (allPointsInside) {
            // Speichere den Voronoi-Vertex mit den zugehörigen convexHullPoints
            vertices.push({
              x: circumcenter.x,
              y: circumcenter.y,
              points: [p1, p2, p3] // Füge die drei convexHull-Punkte hinzu
            });
          }
        }
      }
    }

    // Schritt 2: Berechne Kanten basierend auf Shared Points
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex1 = vertices[i];
        const vertex2 = vertices[j];

        // Prüfe, ob vertex1 und vertex2 gemeinsame Punkte haben
        const sharedPoints = this.getTwoSharedPoints(vertex1.points, vertex2.points);
        if (sharedPoints) {
          // Wenn zwei gemeinsame Punkte gefunden wurden, erstelle das Edge
          edges.push({
            start: vertex1,
            end: vertex2,
            points: sharedPoints // Füge die gemeinsamen Punkte zu den Kanten hinzu
          });
        }
      }
    }

    return { vertices, edges };
  }*/

  static calculateFarthestPointVoronoiDiagram(convexHull) {
    const vertices = [];
    const edges = [];
    const incidentEdgesMap = new Map();

    // Funktion für das Kreuzprodukt, um die Orientierung zu prüfen
    function cross(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // Sonderfall: convexHull besteht aus genau zwei Punkten
    if (convexHull.length === 2) {
      const [p1, p2] = convexHull;

      // Berechne den Mittelpunkt der Linie zwischen p1 und p2
      const midpoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      // Berechne die Normalenrichtung der Linie (perpendikulär)
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const normal = { x: -dy, y: dx }; // Richtung normal zur Linie

      // Normiere den Normalvektor
      const length = Math.sqrt(normal.x ** 2 + normal.y ** 2);
      const normalizedNormal = { x: normal.x / length, y: normal.y / length };

      // Erzeuge zwei unendliche Punkte entlang der Normalenrichtung
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

      // Erzeuge die unendliche Edge zwischen diesen beiden Punkten
      const infiniteEdge = {
        start: infiniteVertex1,
        end: infiniteVertex2,
        points: [p1, p2],
        isInfinite: true,
      };

      // Füge die unendlichen Vertices und die Edge hinzu
      vertices.push(infiniteVertex1, infiniteVertex2);
      edges.push(infiniteEdge);

      // Gib die unendlichen Punkte und die Kante zurück
      return { vertices, edges };
    }

    // Schritt 1: Berechne alle möglichen Voronoi-Vertices
    for (let i = 0; i < convexHull.length; i++) {
      for (let j = i + 1; j < convexHull.length; j++) {
        for (let k = j + 1; k < convexHull.length; k++) {
          let p1 = convexHull[i];
          let p2 = convexHull[j];
          let p3 = convexHull[k];

          // Sicherstellen, dass die Punkte in CCW-Reihenfolge liegen
          if (cross(p1, p2, p3) < 0) {
            [p2, p3] = [p3, p2];
          }

          // Berechne den Umkreismittelpunkt für (p1, p2, p3)
          const circumcenter = this.calculateCircumcenter(p1, p2, p3);

          // Prüfe, ob der Kreis alle Punkte der Menge einschließt
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

    // Schritt 2: Berechne Kanten basierend auf gemeinsamen Punkten
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex1 = vertices[i];
        const vertex2 = vertices[j];

        const sharedPoints = this.getTwoSharedPoints(
          vertex1.points,
          vertex2.points
        );
        if (sharedPoints) {
          const [p1, p2] = sharedPoints;

          // Überprüfe, dass p1 und p2 in der Reihenfolge aus convexHull verwendet werden
          const idx1 = convexHull.indexOf(p1);
          const idx2 = convexHull.indexOf(p2);

          // Wenn sie in der Reihenfolge aus convexHull sind, behalte sie bei, andernfalls vertausche sie
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

    // Schritt 3: Berechne unendliche Kanten
    const infiniteVertices = [];
    for (const vertex of vertices) {
      const { points } = vertex;

      // Bestimme die Indizes der Punkte im Convex Hull, um sie in der richtigen Reihenfolge zu sortieren
      const orderedPoints = points
        .map((p) => convexHull.indexOf(p)) // Hole die Indizes der Punkte im Convex Hull
        .sort((a, b) => a - b); // Sortiere die Indizes in aufsteigender Reihenfolge

      // Abarbeiten der Kanten in zirkulärer CCW-Reihenfolge
      for (let i = 0; i < orderedPoints.length; i++) {
        const p1 = convexHull[orderedPoints[i]];
        const p2 = convexHull[orderedPoints[(i + 1) % orderedPoints.length]]; // Nächster Punkt im Convex Hull, zirkulär

        // Prüfen, ob es bereits eine Kante zwischen p1 und p2 gibt
        const existingEdge = incidentEdgesMap
          .get(vertex)
          .find((edge) => edge.points.includes(p1) && edge.points.includes(p2));

        if (!existingEdge) {
          // Berechne den Perpendikular-Bisektor mit der neuen Methode
          const bisector = this.calculatePerpendicularBisector(p1, p2);

          // Bestimme die Richtung des Bisektors und die unendliche Kante
          const direction = bisector.normal;

          // Optional: Prüfen, ob die Richtung nach außen zeigt (Anpassung möglich)
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

  static calculatePerpendicularBisector(p1, p2) {
    // Berechne den Mittelpunkt der beiden Punkte
    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    // Berechne den Vektor von p1 nach p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Berechne die Normalenrichtung, indem wir den Vektor drehen
    // CCW Drehung des Vektors ergibt die normale Richtung
    const normal = {
      x: -dy, // Drehung um 90 Grad CCW
      y: dx, // Drehung um 90 Grad CCW
    };

    return { midpoint, normal };
  }

  /* Version mit Kantenbug - hier von Kante weg berechnet
  static calculateFarthestPointVoronoiDiagram(convexHull) {
    const vertices = [];
    const edges = [];
    const incidentEdgesMap = new Map();

    // Funktion für das Kreuzprodukt, um die Orientierung zu prüfen
    function cross(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // Schritt 1: Berechne alle möglichen Voronoi-Vertices
    for (let i = 0; i < convexHull.length; i++) {
      for (let j = i + 1; j < convexHull.length; j++) {
        for (let k = j + 1; k < convexHull.length; k++) {
          let p1 = convexHull[i];
          let p2 = convexHull[j];
          let p3 = convexHull[k];

          // Sicherstellen, dass die Punkte in CCW-Reihenfolge liegen
          if (cross(p1, p2, p3) < 0) {
            [p2, p3] = [p3, p2];
          }

          // Berechne den Umkreismittelpunkt für (p1, p2, p3)
          const circumcenter = this.calculateCircumcenter(p1, p2, p3);

          // Prüfe, ob der Kreis alle Punkte der Menge einschließt
          const radius = this.distance(p1, circumcenter);
          const allPointsInside = convexHull.every(p => this.distance(p, circumcenter) <= radius + 1e-6);

          if (allPointsInside) {
            const vertex = {
              x: circumcenter.x,
              y: circumcenter.y,
              points: [p1, p2, p3],
              isInfinite: false
            };
            vertices.push(vertex);
            incidentEdgesMap.set(vertex, []);
          }
        }
      }
    }

    // Schritt 2: Berechne Kanten basierend auf gemeinsamen Punkten
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertex1 = vertices[i];
        const vertex2 = vertices[j];

        const sharedPoints = this.getTwoSharedPoints(vertex1.points, vertex2.points);
        if (sharedPoints) {
          const [p1, p2] = sharedPoints;

          // Prüfen, ob p1 und p2 in der richtigen CCW-Reihenfolge sind
          if (cross(vertex1, p1, p2) < 0) {
            [p1, p2] = [p2, p1];
          }

          const edge = {
            start: vertex1,
            end: vertex2,
            points: [p1, p2],
            isInfinite: false
          };
          edges.push(edge);
          incidentEdgesMap.get(vertex1).push(edge);
          incidentEdgesMap.get(vertex2).push(edge);
        }
      }
    }

    // Schritt 3: Berechne unendliche Kanten
    const infiniteVertices = [];
    for (const vertex of vertices) {
      const { points } = vertex;

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          let p1 = points[i];
          let p2 = points[j];


          // Prüfen, ob es bereits eine Kante zwischen p1 und p2 gibt
          const existingEdge = incidentEdgesMap.get(vertex).find(edge =>
              edge.points.includes(p1) && edge.points.includes(p2)
          );

          if (!existingEdge) {
            // Berechne den Perpendikular-Bisektor
            const bisector = this.calculatePerpendicularBisector(vertex, p1, p2);

            // Bestimme die Richtung des Bisektors und die unendliche Kante
            const direction = { x: bisector.dx, y: bisector.dy };

            // Optional: Prüfen, ob die Richtung nach außen zeigt (Anpassung möglich)
            const infiniteVertex = {
              x: vertex.x + direction.x * 900,
              y: vertex.y + direction.y * 900,
              points: null,
              isInfinite: true
            };

            const edge = {
              start: vertex,
              end: infiniteVertex,
              points: [p1, p2],
              isInfinite: true
            };
            edges.push(edge);
            infiniteVertices.push(infiniteVertex);
          }
        }
      }
    }
    vertices.push(...infiniteVertices);

    return { vertices, edges };
  }


  static calculatePerpendicularBisector(vertex, p1, p2) {
   /!* if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
      [p1, p2] = [p2, p1]; // Vertauschen, falls nötig
    }*!/

    // Mittlere Position der Kante
    const midPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };

    // Vektor entlang der Kante von p1 nach p2
    const edgeVector = {
      x: p2.x - p1.x,
      y: p2.y - p1.y
    };

    // Perpendikularer Vektor (senkrecht zur Kante)
    const perpendicularVector = {
      dx: -edgeVector.y, // Negierter y-Wert
      dy: edgeVector.x   // x-Wert bleibt gleich
    };

    // Normalisieren des perpendikulären Vektors
    const magnitude = Math.sqrt(perpendicularVector.dx ** 2 + perpendicularVector.dy ** 2);
    const normalizedPerpendicular = {
      dx: perpendicularVector.dx / magnitude,
      dy: perpendicularVector.dy / magnitude
    };

    // Richtung vom Mittelpunkt weg, relativ zum Vertex
    const directionToVertex = {
      dx: vertex.x - midPoint.x,
      dy: vertex.y - midPoint.y
    };

    // Berechnung der Kreuzung des Vektors von der Kante zum Vertex mit dem Perpendikularen
    const crossProduct =
        edgeVector.x * directionToVertex.dy - edgeVector.y * directionToVertex.dx;

    // Berechne die orientierte Distanz des Vertex von der Kante
    const orientedDistance =
        ((p2.y - p1.y) * vertex.x - (p2.x - p1.x) * vertex.y + p2.x * p1.y - p2.y * p1.x) /
        Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

    // Drehe den Bisektor nur, wenn das Kreuzprodukt negativ ist
    const adjustedDirection = orientedDistance > 0
        ? { dx: -normalizedPerpendicular.dx, dy: -normalizedPerpendicular.dy }
        : normalizedPerpendicular;

    return adjustedDirection;
  }*/

  // Hilfsfunktion: Berechne Umkreismittelpunkt
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

  // Hilfsfunktion: Berechne Abstand zwischen zwei Punkten
  static distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  /*// Hilfsfunktion: Prüfe, ob zwei Punktgruppen gemeinsame Punkte haben
  static hasSharedPoints(points1, points2) {
    return points1.some(p1 => points2.some(p2 => p1.x === p2.x && p1.y === p2.y));
  }*/

  /*static hasTwoSharedPoints(points1, points2) {
    let sharedCount = 0; // Zähler für gemeinsame Punkte

    // Durch alle Punkte in points1 iterieren
    for (let p1 of points1) {
      // Überprüfen, ob der Punkt auch in points2 existiert
      for (let p2 of points2) {
        if (p1.x === p2.x && p1.y === p2.y) {
          sharedCount++; // Gemeinsamer Punkt gefunden
        }
        if (sharedCount >= 2) {
          return true; // Wenn mindestens zwei gemeinsame Punkte gefunden wurden
        }
      }
    }

    // Weniger als zwei gemeinsame Punkte gefunden
    return false;
  }*/

  static getTwoSharedPoints(points1, points2) {
    const sharedPoints = [];

    // Durch alle Punkte in points1 iterieren
    for (let p1 of points1) {
      // Überprüfen, ob der Punkt auch in points2 existiert
      for (let p2 of points2) {
        if (p1.x === p2.x && p1.y === p2.y) {
          sharedPoints.push(p1); // Gemeinsamer Punkt gefunden
        }
      }
    }

    // Wenn zwei gemeinsame Punkte gefunden wurden, gib sie zurück
    if (sharedPoints.length === 2) {
      return sharedPoints;
    }

    // Andernfalls null zurückgeben
    return null;
  }

  /* static calculateDiskFromPoints(points) {
    if (points.length < 2 || points.length > 3) {
      return;
    }

    let disk;
    if (points.length === 2) {
      // Zwei Punkte: Berechne den Kreis mit dem Durchmesser zwischen den Punkten
      const [p1, p2] = points;
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };
      const radius = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) / 2;
      disk = { center, radius };
    } else if (points.length === 3) {
      // Drei Punkte: Berechne den Umkreis
      const [p1, p2, p3] = points;
      disk = GeometryUtils.calculateCircumcircle(p1, p2, p3);
    }

    return disk;
  }

  static calculateCircumcircle(p1, p2, p3) {
    const A = p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y);
    if (A === 0) {
      alert("The selected points are collinear and do not form a valid circle.");
      return null;
    }

    const D = 2 * A;
    const Ux = ((p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) +
                (p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) +
                (p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)) / D;
    const Uy = ((p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) +
                (p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) +
                (p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)) / D;

    const center = { x: Ux, y: Uy };
    const radius = Math.sqrt((p1.x - Ux) ** 2 + (p1.y - Uy) ** 2);

    return { center, radius };
  } */

  /* static calculateSmallestEnclosingCircleFromTwoPoints(points, convexHull) {
    if (points.length !== 2) {
      alert("Exactly two points must be selected to calculate the smallest enclosing circle.");
      return null;
    }

    const [p1, p2] = points;

    // Berechne initialen Kreis mit p1 und p2 als Durchmesser
    const initialCenter = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
    let initialRadius = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) / 2;

    // Überprüfe, ob alle Punkte der Konvexen Hülle im initialen Kreis enthalten sind
    let center = initialCenter;
    let radius = initialRadius;

    convexHull.forEach(point => {
      const distance = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
      if (distance > radius) {
        // Passe den Kreis an, um den Punkt einzuschließen
        radius = distance;
      }
    });

    // Gib den resultierenden Kreis zurück
    return { center, radius };
  } */

  static calculateSmallestCircleFromTwoPoints(points, convexHull) {
    if (points.length !== 2) {
      console.log("More than two points were given to calculateSmallestCircle");
      return null;
    }

    const [p1, p2] = points;

    // Berechne initialen Kreis mit p1 und p2 als Durchmesser
    let center = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
    let radius = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) / 2;

    // Überprüfe Punkte der Konvexen Hülle
    convexHull.forEach((point) => {
      // Überspringe Punkte, die bereits Teil des Durchmessers sind
      if (
        (point.x === p1.x && point.y === p1.y) ||
        (point.x === p2.x && point.y === p2.y)
      ) {
        return; // Überspringe die Iteration
      }

      const distance = Math.sqrt(
        (point.x - center.x) ** 2 + (point.y - center.y) ** 2
      );

      if (distance > radius) {
        // Berechne neuen Kreis, der p1, p2 und point enthält
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

  static calculateCircleFromTwoPointsAndCenter(points, center) {
    // Check if exactly two points are provided
    if (points.length !== 2) {
      console.error("Error: Exactly two points are required!");
      return null;
    }

    const [p1, p2] = points; // Extract the two points

    // Calculate the distance of the first point from the center
    const distance1 = Math.sqrt(
      (p1.x - center.x) ** 2 + (p1.y - center.y) ** 2
    );

    // Calculate the distance of the second point from the center
    const distance2 = Math.sqrt(
      (p2.x - center.x) ** 2 + (p2.y - center.y) ** 2
    );

    // Check if the points lie on the same circle with the given center
    if (Math.abs(distance1 - distance2) > 1e-6) {
      console.error(
        "Error: The points do not lie on a circle with the specified center!"
      );
      return null;
    }

    // The radius of the circle is the distance from one point to the center
    const radius = distance1;

    return { center, radius };
  }

  // Hilfsfunktion: Berechne Kreis durch drei Punkte
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

  static checkIfDiskCoversPoints(disk, convexHull) {
    if (!disk || !disk.center || typeof disk.radius !== "number") {
      console.error(
        "Invalid disk object. Ensure it has 'center' and 'radius' properties."
      );
      return false;
    }

    const { center, radius } = disk;

    // Überprüfen, ob jeder Punkt des Convex Hulls innerhalb des Kreises liegt
    for (const point of convexHull) {
      const distance = Math.sqrt(
        (point.x - center.x) ** 2 + (point.y - center.y) ** 2
      );

      if (distance > radius + 1e-6) {
        // Punkt liegt außerhalb des Kreises unter Berücksichtigung der Toleranz
        return false;
      }
    }

    // Alle Punkte liegen innerhalb oder knapp auf dem Rand des Kreises
    return true;
  }

  static checkIfDiskCollides(disk, otherDisks, epsilon = 1e-3) {
    for (let otherDisk of otherDisks) {
      // Skip identical or undefined disks
      if (!otherDisk || disk === otherDisk) continue;

      // Berechne Abstand zwischen den Mittelpunkten
      const dx = disk.center.x - otherDisk.center.x;
      const dy = disk.center.y - otherDisk.center.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      // Prüfe auf Überschneidung
      if (distance <= disk.radius + otherDisk.radius + epsilon) {
        //console.log(`Found a collision between this disk ${disk.center,disk.radius} and another disk ${otherDisk.center,otherDisk.radius}`)
        return true; // Kollision gefunden
      }
    }
    return false; // Keine Kollisionen
  }

  static buildForestFromDiskCollisions(pointGroups) {
    // Hilfsfunktion zur Erstellung eines neuen Baumknotens
    const createNode = (group) => ({
      group: group,
      children: [],
    });

    // Array für den Wald
    const forest = [];

    // Set zum Verfolgen bereits besuchter Gruppen
    const visited = new Set();

    // Durchlaufe alle Gruppen
    for (let pointGroup of pointGroups) {
      if (visited.has(pointGroup)) continue;

      // Erstelle einen neuen Baum (Root-Knoten)
      const root = createNode(pointGroup);
      visited.add(pointGroup); // Markiere die Root-Gruppe als besucht
      const queue = [root]; // Warteschlange für Breitensuche

      // Breitensuche durchführen
      while (queue.length > 0) {
        const currentNode = queue.shift();

        for (let otherGroup of pointGroups) {
          if (visited.has(otherGroup)) continue;

          // Prüfe auf Kollisionsbedingungen
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
            visited.add(otherGroup); // Markiere als besucht
          }
        }
      }

      // Füge den Baum zum Wald hinzu
      forest.push(root);
    }

    return forest;
  }

  static buildForestFromNearestDisks(pointGroups) {
    // Hilfsfunktion zur Erstellung eines neuen Baumknotens
    const createNode = (group) => ({
      group: group,
      children: [],
    });

    // Array für den Wald
    const forest = [];

    // Set zum Verfolgen bereits besuchter Gruppen
    const visited = new Set();

    // Funktion zur Berechnung der Rand-zu-Rand-Distanz zwischen zwei Kreisen
    const edgeDistance = (disk1, disk2) => {
      const centerDistance = GeometryUtils.distance(disk1.center, disk2.center);
      return Math.max(0, centerDistance - disk1.radius - disk2.radius);
    };

    // Durchlaufe alle Gruppen
    for (let pointGroup of pointGroups) {
      if (visited.has(pointGroup)) continue;

      // Erstelle einen neuen Baum (Root-Knoten)
      const root = createNode(pointGroup);
      visited.add(pointGroup); // Markiere die Root-Gruppe als besucht
      const queue = [root]; // Warteschlange für Breitensuche

      // Breitensuche durchführen
      while (queue.length > 0) {
        const currentNode = queue.shift();
        const currentDisk = currentNode.group.disk;

        if (!currentDisk) continue;

        // Finde die nächstgelegenen Gruppen basierend auf der Rand-zu-Rand-Distanz
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

        // Füge die nächstgelegenen Gruppen als Kinder hinzu
        for (let nearestGroup of nearestGroups) {
          const childNode = createNode(nearestGroup);
          currentNode.children.push(childNode);
          queue.push(childNode);
          visited.add(nearestGroup); // Markiere als besucht
        }
      }

      // Füge den Baum zum Wald hinzu
      forest.push(root);
    }

    return forest;
  }

  /* static calculateNewDiskWithoutIntersection(pointGroupA, pointGroupB) {
    // Extrahiere die aktuelle Disk von A und B
    const diskA = pointGroupA.disk;
    const diskB = pointGroupB.disk;

    if (!diskA || !diskB) {
      throw new Error("Both point groups must have an associated disk.");
    }

    const {center: centerA, radius: radiusA} = diskA;
    const {center: centerB, radius: radiusB} = diskB;

    // Hole die Vertices des FPVD von pointGroupA
    const fpvdVertices = pointGroupA.farthestPointVoronoiDiagram.vertices;
    if (fpvdVertices.length !== 2) {
      throw new Error("FPVD must contain exactly two vertices for pointGroupA.");
    }

    // Punkte der Gruppe A
    const [p1, p2] = pointGroupA.points;

    // Berechnung des Normalvektors (senkrecht zur Linie zwischen p1 und p2)
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normalVector = {x: -dy, y: dx};

    // Normiere den Normalvektor
    const magnitude = Math.sqrt(normalVector.x ** 2 + normalVector.y ** 2);
    const unitNormalVector = {x: normalVector.x / magnitude, y: normalVector.y / magnitude};

    // Berechne den Abstand und die Überlappung zwischen den Kreisen A und B
    const d = Math.sqrt((centerA.x - centerB.x) ** 2 + (centerA.y - centerB.y) ** 2); // Abstand der Zentren
    const overlap = radiusA + radiusB - d;

    if (overlap <= 0) {
      // Keine Überschneidung, Rückgabe der aktuellen Disk
      return diskA;
    }

    // Überprüfen, ob der Normalvektor von centerA weg zeigt
    const directionVector = {x: centerB.x - centerA.x, y: centerB.y - centerA.y};
    const dotProduct = unitNormalVector.x * directionVector.x + unitNormalVector.y * directionVector.y;

    // Drehe den Normalvektor, wenn er in die falsche Richtung zeigt
    const correctedNormalVector = dotProduct > 0
        ? {x: -unitNormalVector.x, y: -unitNormalVector.y}
        : unitNormalVector;

    // Verschiebung entlang des Normalvektors
    const shiftDistance = overlap / 2;

    // Neues Zentrum von A entlang des korrekten Normalvektors
    const newCenter = {
      x: centerA.x + correctedNormalVector.x * shiftDistance,
      y: centerA.y + correctedNormalVector.y * shiftDistance,
    };

    // Radius von Disk A (Randpunkte müssen erhalten bleiben)
    const newRadius = Math.sqrt(
        (pointGroupA.points[0].x - newCenter.x) ** 2 +
        (pointGroupA.points[0].y - newCenter.y) ** 2
    );

    // Neue Disk
    const newDisk = {
      center: newCenter,
      radius: newRadius,
    };

    // Aktualisiere pointGroupA mit der neuen Disk
    pointGroupA.disk = newDisk;

    return newDisk;

  }*/

  /*static calculateNewDiskWithoutIntersection(pointGroupA, pointGroupB) {
    const [p1A, p2A] = pointGroupA.points; // Punkte von pointGroupA
    const centerA = pointGroupA.disk.center;
    const radiusA = pointGroupA.disk.radius;

    const centerB = pointGroupB.disk.center;
    const radiusB = pointGroupB.disk.radius;

    // Schritt 1: Finde den nächsten Punkt auf der Disk von B zur Linie zwischen p1A und p2A
    const lineVector = { x: p2A.x - p1A.x, y: p2A.y - p1A.y };
    const lineLengthSquared = lineVector.x ** 2 + lineVector.y ** 2;

    // Normalisierter Richtungsvektor der Linie
    const unitLineVector = { x: lineVector.x / Math.sqrt(lineLengthSquared), y: lineVector.y / Math.sqrt(lineLengthSquared) };

    // Projektion von centerB auf die Linie
    const projectionFactor =
        ((centerB.x - p1A.x) * unitLineVector.x + (centerB.y - p1A.y) * unitLineVector.y);

    // Der projizierte Punkt auf der Linie
    const closestPointOnLine = {
      x: p1A.x + projectionFactor * unitLineVector.x,
      y: p1A.y + projectionFactor * unitLineVector.y,
    };

    // Punkt auf der Rand der Disk von B, der der Linie am nächsten liegt
    const directionToBoundary = {
      x: closestPointOnLine.x - centerB.x,
      y: closestPointOnLine.y - centerB.y,
    };
    const magnitudeToBoundary = Math.sqrt(directionToBoundary.x ** 2 + directionToBoundary.y ** 2);
    const closestPointOnBoundary = {
      x: centerB.x + (directionToBoundary.x / magnitudeToBoundary) * radiusB,
      y: centerB.y + (directionToBoundary.y / magnitudeToBoundary) * radiusB,
    };

    // Schritt 2: Konstruktion der neuen Disk für pointGroupA
    // Berechne die neue Mitte der Disk so, dass sie durch die beiden Punkte von pointGroupA und den Punkt auf dem Rand von B geht
    const newCenter = GeometryUtils.calculateCircumcenter(p1A, p2A, closestPointOnBoundary);

    // Der Radius ist der Abstand zwischen dem neuen Zentrum und einem der Punkte von pointGroupA
    const newRadius = Math.sqrt(
        (p1A.x - newCenter.x) ** 2 + (p1A.y - newCenter.y) ** 2
    );

    // Aktualisiere die Disk von pointGroupA
    const newDisk = {
      center: newCenter,
      radius: newRadius,
    };
    pointGroupA.disk = newDisk;

    // Verschiebung
    const shiftDistance = Math.sqrt(
        (newCenter.x - centerA.x) ** 2 + (newCenter.y - centerA.y) ** 2
    );

    return newDisk;
  }*/

  // numerical approach
  static calculateNewDiskWithoutIntersectionNumerically(
    pointGroupA,
    pointGroupB
  ) {
    const point1 = pointGroupA.points[0];
    const point2 = pointGroupA.points[1];
    const centerB = pointGroupB.disk.center;
    const radiusB = pointGroupB.disk.radius;

    // Berechne midpointA
    const midpointA = {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
    };

    // Berechne den Normalvektor (senkrecht zur Linie zwischen point1 und point2)
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    let normalVector = { x: -dy, y: dx };

    // Normiere den Normalvektor
    const magnitude = Math.sqrt(normalVector.x ** 2 + normalVector.y ** 2);
    normalVector = {
      x: normalVector.x / magnitude,
      y: normalVector.y / magnitude,
    };

    // Bestimme die Richtung der Normalen
    const directionToB = {
      x: centerB.x - midpointA.x,
      y: centerB.y - midpointA.y,
    };
    const dotProduct =
      normalVector.x * directionToB.x + normalVector.y * directionToB.y;

    // Wenn die Normale in Richtung von centerB zeigt, kehre sie um
    if (dotProduct > 0) {
      normalVector = { x: -normalVector.x, y: -normalVector.y };
    }

    // Funktion für die Gleichung |X - point1| = |X - centerB| - radiusB
    const equation = (t) => {
      const X = {
        x: midpointA.x + t * normalVector.x,
        y: midpointA.y + t * normalVector.y,
      };

      const distanceToPoint1 = Math.sqrt(
        (X.x - point1.x) ** 2 + (X.y - point1.y) ** 2
      );
      const distanceToCenterB = Math.sqrt(
        (X.x - centerB.x) ** 2 + (X.y - centerB.y) ** 2
      );

      return distanceToPoint1 - (distanceToCenterB - radiusB);
    };

    // Numerische Lösung der Gleichung mit Newton-Raphson
    // Initiale Schätzung für t
    let t = 10; // Startwert für die Verschiebung entlang des Normalvektors
    let tolerance = 1e-6; // Toleranz für die Konvergenz
    let maxIterations = 100; // Maximale Anzahl der Iterationen

    for (let i = 0; i < maxIterations; i++) {
      const f_t = equation(t);
      const derivative_t = (equation(t + tolerance) - f_t) / tolerance; // Numerische Ableitung

      // Update der Schätzung von t mit Newton-Raphson
      const tNew = t - f_t / derivative_t;

      // Wenn die Änderung von t kleiner als die Toleranz ist, abbrechen
      if (Math.abs(tNew - t) < tolerance) {
        t = tNew;
        break;
      }

      t = tNew;
    }

    // Berechne den neuen Mittelpunkt von pointGroupA.disk
    const newCenter = {
      x: midpointA.x + (t + 1) * normalVector.x,
      y: midpointA.y + (t + 1) * normalVector.y,
    };
    // + 1 um die beiden Kreise auch grafisch zu entkoppeln. Alternativ Kollisionserkennung anpassen

    // Berechne den neuen Radius von pointGroupA.disk
    const newRadius = Math.sqrt(
      (newCenter.x - point1.x) ** 2 + (newCenter.y - point1.y) ** 2
    );

    // Aktualisiere die Disk von pointGroupA
    const newDisk = {
      center: newCenter,
      radius: newRadius,
    };
    pointGroupA.disk = newDisk;

    return newDisk;
  }

  static calculateNewDiskWithoutIntersection(pointGroupA, pointGroupB) {
    const p_A1 = pointGroupA.points[0];
    const p_A2 = pointGroupA.points[1];
    const centerB = pointGroupB.disk.center;
    const radiusB = pointGroupB.disk.radius;

    // Mittelpunkt zwischen p_A1 und p_A2
    const midpointA = {
      x: (p_A1.x + p_A2.x) / 2,
      y: (p_A1.y + p_A2.y) / 2,
    };

    // Normalenvektor bestimmen (senkrecht auf (p_A2 - p_A1))
    const dx = p_A2.x - p_A1.x;
    const dy = p_A2.y - p_A1.y;
    let normalVector = { x: -dy, y: dx };

    // Normalisieren
    const mag = Math.sqrt(normalVector.x ** 2 + normalVector.y ** 2);
    normalVector.x /= mag;
    normalVector.y /= mag;

    // Richtung überprüfen, soll vom centerB wegweisen
    const directionToB = {
      x: centerB.x - midpointA.x,
      y: centerB.y - midpointA.y,
    };
    const dotProduct =
      normalVector.x * directionToB.x + normalVector.y * directionToB.y;
    if (dotProduct > 0) {
      // Falls in Richtung B zeigt, umkehren
      normalVector.x = -normalVector.x;
      normalVector.y = -normalVector.y;
    }

    // Definiere U, W
    const U = { x: midpointA.x - p_A1.x, y: midpointA.y - p_A1.y };
    const W = { x: midpointA.x - centerB.x, y: midpointA.y - centerB.y };

    const U2 = U.x * U.x + U.y * U.y;
    const W2 = W.x * W.x + W.y * W.y;

    const nU = normalVector.x * U.x + normalVector.y * U.y;
    const nW = normalVector.x * W.x + normalVector.y * W.y;

    const alpha = (W2 - U2 - radiusB * radiusB) / (2 * radiusB);
    const beta = (nW - nU) / radiusB;

    // Koeffizienten der Quadratischen Gleichung
    // (1 - β²) t² + [2(n·U) - 2αβ] t + (U² - α²) = 0
    const A = 1 - beta * beta;
    const B = 2 * nU - 2 * alpha * beta;
    const C = U2 - alpha * alpha;

    const discriminant = B * B - 4 * A * C;
    if (discriminant < 0) {
      throw new Error(
        "Keine reale Lösung: Die Kreise können nicht tangential gestellt werden."
      );
    }

    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-B + sqrtD) / (2 * A);
    const t2 = (-B - sqrtD) / (2 * A);

    // Wähle t entsprechend der gewünschten Situation
    // Oft ist der größere Wert sinnvoll, aber das hängt vom Anwendungsfall ab.
    let t = Math.max(t1, t2);

    // Berechne den neuen Mittelpunkt
    const newCenter = {
      x: midpointA.x + (t + 1) * normalVector.x,
      y: midpointA.y + (t + 1) * normalVector.y,
    };

    // Der Radius von A bleibt konstant, er ist der Abstand midpointA->p_A1 (ursprünglich gegeben?)
    // Wenn Ihr ursprünglicher Radius von A bekannt ist, sollten Sie ihn verwenden.
    // Hier wird angenommen, dass der Radius gleich dem bisherigen Abstand midpointA->p_A1 ist.
    const radiusA = Math.sqrt(
      (newCenter.x - p_A1.x) ** 2 + (newCenter.y - p_A1.y) ** 2
    );

    // Aktualisiere die Disk von pointGroupA
    const newDisk = {
      center: newCenter,
      radius: radiusA, // Unverändert, da nur verschoben
    };
    pointGroupA.disk = newDisk;

    return newDisk;
  }

  static maxDistance(pointGroups) {
    let maxDist = 0;

    // Flatten all points from all pointGroups into a single array
    const allPoints = pointGroups.flatMap((group) => group.points);

    // Calculate the maximum distance between any two points
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

  static calculateTangentialPoint(pointGroupA, pointGroupB, epsilon = 3) {
    const diskA = pointGroupA.disk;
    const diskB = pointGroupB.disk;
    // const epsilon = 3; // Tolerance for tangential check

    if (!diskA || !diskB) {
      console.error("One or both disks are missing.");
      return null;
    }

    const dx = diskB.center.x - diskA.center.x;
    const dy = diskB.center.y - diskA.center.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    // Check if the disks are tangential within tolerance
    if (Math.abs(distance - (diskA.radius + diskB.radius)) > epsilon) {
      return null;
    }

    // Calculate the tangential point
    const ratio = diskA.radius / (diskA.radius + diskB.radius);
    const tangentialPoint = {
      x: diskA.center.x + ratio * dx,
      y: diskA.center.y + ratio * dy,
    };

    return tangentialPoint;
  }

  static calculateFarthestPointVoronoiDiagram2(convexHull) {
    const vertices = [];
    const edges = [];
    const DCEL = new DoublyConnectedEdgeList();

    // Step 1: Compute convex hull in counterclockwise order
    convexHull.sort((a, b) => a.x - b.x || a.y - b.y);

    // Step 2: Randomize order of convex hull points
    const randomizedHull = this.shuffleArray(convexHull);

    // Step 3: Handle initial case with 3 points
    let activeSet = randomizedHull.slice(0, 3);
    this.initializeFPVD(activeSet, DCEL, vertices, edges);

    // Step 4: Incrementally add the remaining convex hull points
    for (let i = 3; i < randomizedHull.length; i++) {
      const pi = randomizedHull[i];

      // Find its clockwise and counterclockwise neighbors
      let cw = this.findClockwiseNeighbor(activeSet, pi);
      let ccw = this.findCounterClockwiseNeighbor(activeSet, pi);

      // Insert pi into the FPVD structure
      this.insertFPVDCell(pi, cw, ccw, DCEL, vertices, edges);

      // Remove obsolete edges
      this.removeObsoleteEdges(pi, DCEL);

      // Add pi to the active set
      activeSet.push(pi);
    }

    return { vertices, edges };
  }

  // Initializes the FPVD with the first three convex hull points
  static initializeFPVD(activeSet, DCEL, vertices, edges) {
    const [p1, p2, p3] = activeSet;
    const circumcenter = this.calculateCircumcenter(p1, p2, p3);

    const vertex = {
      x: circumcenter.x,
      y: circumcenter.y,
      points: [p1, p2, p3],
      isInfinite: false,
    };
    vertices.push(vertex);

    DCEL.addVertex(vertex);
    DCEL.addEdge(p1, p2, vertex);
    DCEL.addEdge(p2, p3, vertex);
    DCEL.addEdge(p3, p1, vertex);
  }

  // Inserts a new FPVD cell following the algorithm
  static insertFPVDCell(pi, cw, ccw, DCEL, vertices, edges) {
    // The new cell is placed between cw and ccw
    const bisectorCCW = this.calculatePerpendicularBisector(ccw, pi);
    const bisectorCW = this.calculatePerpendicularBisector(cw, pi);

    // Find intersections with existing FPVD edges
    const intersectionCCW = this.findIntersection(bisectorCCW, DCEL);
    const intersectionCW = this.findIntersection(bisectorCW, DCEL);

    // Insert new vertices and edges
    const newVertexCCW = {
      x: intersectionCCW.x,
      y: intersectionCCW.y,
      isInfinite: false,
    };
    const newVertexCW = {
      x: intersectionCW.x,
      y: intersectionCW.y,
      isInfinite: false,
    };
    vertices.push(newVertexCCW, newVertexCW);

    DCEL.addVertex(newVertexCCW);
    DCEL.addVertex(newVertexCW);
    DCEL.addEdge(ccw, pi, newVertexCCW);
    DCEL.addEdge(cw, pi, newVertexCW);
  }

  // Removes obsolete edges after a new point is added
  static removeObsoleteEdges(pi, DCEL) {
    for (const edge of DCEL.edges) {
      if (this.edgeIsObsolete(edge, pi)) {
        DCEL.removeEdge(edge);
      }
    }
  }

  // Finds the clockwise neighbor of a point in the convex hull
  static findClockwiseNeighbor(activeSet, pi) {
    let index = activeSet.indexOf(pi);
    return activeSet[(index - 1 + activeSet.length) % activeSet.length];
  }

  // Finds the counterclockwise neighbor of a point in the convex hull
  static findCounterClockwiseNeighbor(activeSet, pi) {
    let index = activeSet.indexOf(pi);
    return activeSet[(index + 1) % activeSet.length];
  }

  // Computes the perpendicular bisector of two points
  static calculatePerpendicularBisector(p1, p2) {
    const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const normal = { x: -dy, y: dx };
    const length = Math.sqrt(normal.x ** 2 + normal.y ** 2);
    return { midpoint, normal: { x: normal.x / length, y: normal.y / length } };
  }

  // Computes the circumcenter of a triangle
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

  // Finds the intersection of a bisector with the existing FPVD structure
  static findIntersection(bisector, DCEL) {
    for (const edge of DCEL.edges) {
      const intersection = this.computeLineIntersection(bisector, edge);
      if (intersection) return intersection;
    }
    return null;
  }

  // Checks if an edge is obsolete after inserting a new cell
  static edgeIsObsolete(edge, pi) {
    return edge.start === pi || edge.end === pi;
  }

  // Computes the intersection of a bisector with an edge
  static computeLineIntersection(bisector, edge) {
    // Solve linear system for intersection point
    const { x, y } = bisector.midpoint;
    const { x: x1, y: y1 } = edge.start;
    const { x: x2, y: y2 } = edge.end;
    const denom = (x1 - x2) * (y - y1) - (y1 - y2) * (x - x1);
    if (denom === 0) return null; // Parallel lines
    const t = ((x - x1) * (y1 - y2) - (y - y1) * (x1 - x2)) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }

  // Randomly shuffles an array (to create randomized insertion order)
  static shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }
}

export default GeometryUtils;
