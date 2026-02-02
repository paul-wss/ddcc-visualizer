# DDCC Visualizer

Ein interaktives Visualisierungstool für Disk-based Covering Calculations mit Farthest-Point Voronoi Diagrammen.

## Features

- **Punktgruppen-Verwaltung**: Erstellen, bearbeiten und löschen von Punktgruppen
- **Convex Hull Berechnung**: Automatische Berechnung mit Graham-Scan-Algorithmus
- **Farthest-Point Voronoi Diagramm (FPVD)**: Visualisierung der Voronoi-Struktur
- **Disk-Erstellung**: Disks aus 2-3 ausgewählten Hull-Punkten generieren
- **Kollisionserkennung**: Automatische Erkennung und Visualisierung von Disk-Kollisionen
- **Baum-Hierarchie**: Anzeige von Kollisions- und Proximity-Bäumen
- **Import/Export**: JSON-basiertes Speichern und Laden von Konfigurationen

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd ddcc-visualizer

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start
```

## Projektstruktur

```
ddcc-visualizer/
├── src/
│   ├── core/                 # Kern-Logik
│   │   ├── GeometryUtils.js  # Geometrische Berechnungen
│   │   ├── PointGroup.js     # Punktgruppen-Klasse
│   │   ├── constants.js      # Konstanten und Konfiguration
│   │   └── state.js          # Anwendungszustand
│   │
│   ├── ui/                   # UI-Komponenten
│   │   ├── visualization.js  # SVG-Visualisierung
│   │   ├── treeVisualization.js  # Baum-Hierarchie
│   │   ├── interactions.js   # Benutzerinteraktionen
│   │   └── uiControls.js     # UI-Steuerung
│   │
│   ├── utils/                # Hilfsfunktionen
│   │   └── testDataGenerator.js  # Testdaten-Generierung
│   │
│   ├── app.js                # Hauptanwendung
│   └── index.js              # Modul-Exports
│
├── assets/
│   └── icons/                # Icons und Favicons
│
├── data/
│   └── examples/             # Beispiel-JSON-Dateien
│
├── index.html                # HTML-Einstiegspunkt
├── styles.css                # Stylesheets
├── package.json              # NPM-Konfiguration
└── README.md                 # Diese Datei
```

## Verwendung

### Interaktionsmodi

1. **Locked**: Keine Interaktion möglich
2. **Add Points**: Punkte zur ausgewählten Gruppe hinzufügen
3. **Delete Points**: Punkte aus der Gruppe löschen
4. **Move Points**: Punkte per Drag & Drop verschieben
5. **Select Hull Points**: Hull-Punkte für Disk-Erstellung auswählen
6. **Resize Disks via FPVD**: Disks entlang des FPVD anpassen
7. **Resize Disks Manually**: Disk-Größe manuell ändern

### Workflow

1. Gruppe erstellen ("Create new group")
2. Modus "Add points" auswählen und Punkte hinzufügen
3. Modus "Select hull points for disk" auswählen
4. 2-3 Hull-Punkte auswählen
5. "Generate Disk from selected hull points" klicken

### Daten speichern/laden

- **Save file**: Exportiert alle Gruppen als JSON
- **Load file**: Importiert zuvor gespeicherte JSON-Dateien

## Technologien

- **D3.js v7**: SVG-Visualisierung
- **Vanilla JavaScript (ES6 Modules)**: Keine Framework-Abhängigkeiten
- **CSS3**: Modernes Styling

## Entwicklung

```bash
# Server starten
npm start

# Dann im Browser öffnen:
# http://localhost:8080
```

## Lizenz

ISC
