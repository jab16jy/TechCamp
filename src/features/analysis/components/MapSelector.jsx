import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from '@shared/utils/leafletDrawPatch';
import { geoDecode } from '@shared/services/api';
import MapDrawingToolbar from './MapDrawingToolbar';
import styles from './MapSelector.module.css';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Caribbean Colombia bounds: SW [6.5, -78.0] to NE [12.8, -70.5]
const CARIBBEAN_BOUNDS = [
  [6.5, -78.0],
  [12.8, -70.5],
];

const DEFAULT_CENTER = [10.2, -74.5];
const DEFAULT_ZOOM = 8;
const MIN_ZOOM = 7;
const MAX_ZOOM = 18;

// ── Map Setup (bounds + zoom control) ──
const MapSetup = ({ position, onMapReady }) => {
  const map = useMap();
  const isInternalUpdate = useRef(false);
  const prevPosRef = useRef('');

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  // Sync map to external position changes (e.g., form selects a municipio)
  useEffect(() => {
    const posKey = `${position?.lat?.toFixed(4)}-${position?.lng?.toFixed(4)}`;
    if (
      position &&
      position.lat != null &&
      position.lng != null &&
      !isInternalUpdate.current &&
      posKey !== prevPosRef.current
    ) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: false });
    }
    prevPosRef.current = posKey;
    isInternalUpdate.current = false;
  }, [position?.lat, position?.lng, map]);

  // Expose a way to mark internal updates (from drawing)
  useEffect(() => {
    map._markInternalUpdate = () => { isInternalUpdate.current = true; };
    return () => { delete map._markInternalUpdate; };
  }, [map]);

  return null;
};

// ── Draw Tool ──
const DrawTool = ({ onZoneCreated, onZoneCleared, onMapClick }) => {
  const map = useMap();
  const drawnGroupRef = useRef(null);
  const drawHandlerRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);
  const [hasShape, setHasShape] = useState(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Initialize drawnGroup
  useEffect(() => {
    const group = new L.FeatureGroup();
    map.addLayer(group);
    drawnGroupRef.current = group;
    return () => {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }
      map.removeLayer(group);
    };
  }, [map]);

  // ── Click handler: select a point on the map without drawing ──
  useEffect(() => {
    const handleClick = (e) => {
      // Only handle plain clicks (not drawing events)
      if (activeTool) return;
      // Ignore clicks on drawn shapes
      if (drawnGroupRef.current && drawnGroupRef.current.getLayers().length > 0) {
        // Check if click is on a drawn layer
        const clickedLayer = drawnGroupRef.current.getLayers().find(
          (layer) => layer.getBounds && layer.getBounds().contains(e.latlng)
        );
        if (clickedLayer) return;
      }
      if (onMapClickRef.current) {
        onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, activeTool]);

  const handleCreated = useCallback((e) => {
    const { layer } = e;
    if (!drawnGroupRef.current) return;
    drawnGroupRef.current.clearLayers();
    drawnGroupRef.current.addLayer(layer);

    let center;
    let area = 0;

    if (layer instanceof L.Circle) {
      center = layer.getLatLng();
      const radius = layer.getRadius();
      area = Math.PI * radius * radius / 10000;
    } else {
      // Rectangle
      const latlngs = layer.getLatLngs?.();
      if (latlngs?.[0]) {
        center = layer.getBounds().getCenter();
        area = L.GeometryUtil.geodesicArea(latlngs[0]) / 10000;
      } else {
        center = layer.getBounds().getCenter();
      }
    }

    if (area > 0) {
      layer.bindTooltip(`${area.toFixed(2)} ha`, {
        permanent: true,
        direction: 'center',
        className: 'area-tooltip',
      });
    }

    // Fit map to shape bounds without animation
    try {
      map.fitBounds(layer.getBounds(), { animate: false, padding: [50, 50] });
    } catch {
      map.setView(center, map.getZoom(), { animate: false });
    }

    setActiveTool(null);
    setHasShape(true);
    onZoneCreated({ center, area: Number(area.toFixed(2)) });
  }, [onZoneCreated, map]);

  const handleDeleted = useCallback(() => {
    setHasShape(false);
    onZoneCleared();
  }, [onZoneCleared]);

  useEffect(() => {
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [map, handleCreated, handleDeleted]);

  const deactivateDraw = useCallback(() => {
    if (drawHandlerRef.current) {
      drawHandlerRef.current.disable();
      drawHandlerRef.current = null;
    }
  }, []);

  const handleToolChange = useCallback((tool) => {
    deactivateDraw();

    if (tool === activeTool) {
      setActiveTool(null);
      return;
    }

    setActiveTool(tool);

    if (hasShape && drawnGroupRef.current) {
      drawnGroupRef.current.clearLayers();
      setHasShape(false);
      onZoneCleared();
    }

    const shapeOpts = { color: '#2D5A27', weight: 2 };
    let handler;

    switch (tool) {
      case 'rectangle':
        handler = new L.Draw.Rectangle(map, {
          shapeOptions: shapeOpts,
        });
        break;
      case 'circle':
        handler = new L.Draw.Circle(map, {
          shapeOptions: shapeOpts,
        });
        break;
    }

    if (handler) {
      handler.enable();
      drawHandlerRef.current = handler;
    }
  }, [activeTool, hasShape, onZoneCleared, deactivateDraw, map]);

  const handleClear = useCallback(() => {
    deactivateDraw();
    if (drawnGroupRef.current) {
      drawnGroupRef.current.clearLayers();
    }
    setActiveTool(null);
    setHasShape(false);
    onZoneCleared();
  }, [onZoneCleared, deactivateDraw]);

  const canClear = hasShape || activeTool !== null;

  return (
    <MapDrawingToolbar
      activeTool={activeTool}
      onToolChange={handleToolChange}
      onClear={handleClear}
      canClear={canClear}
    />
  );
};

// ── Coordinates overlay (small, bottom-right) ──
const CoordsOverlay = ({ position, drawnArea, detectedGeo }) => {
  if (!position?.lat && !position?.lng) return null;

  const parts = [];
  // Show city name first when detected
  if (detectedGeo?.municipio) {
    parts.push(`${detectedGeo.municipio}, ${detectedGeo.departamento}`);
  }
  if (position.lat != null && position.lng != null) {
    parts.push(`${position.lat.toFixed(4)}° N, ${position.lng.toFixed(4)}° W`);
  }
  if (drawnArea?.area > 0) {
    parts.push(`${drawnArea.area.toFixed(2)} ha`);
  }
  if (parts.length === 0) return null;

  return (
    <div className={styles.coordsOverlay}>
      {parts.join(' · ')}
    </div>
  );
};

// ── Main MapSelector ──
const MapSelector = ({ position, onPositionChange, onGeoDetected, onDrawnArea }) => {
  const [drawnArea, setDrawnArea] = useState(null);
  const [detectedGeo, setDetectedGeo] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const mapRef = useRef(null);

  // Grab map reference from MapContainer when ready
  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Handle drawn area: decode geo info and propagate up
  const handleZoneCreated = useCallback(async ({ center, area }) => {
    const lat = center.lat;
    const lng = center.lng;

    const areaData = { lat, lng, area };
    setDrawnArea(areaData);

    // Propagate drawn area data up (for hectares auto-fill)
    onDrawnArea?.(areaData);

    // Mark this as an internal map update so position sync doesn't override
    if (mapRef.current?._markInternalUpdate) {
      mapRef.current._markInternalUpdate();
    }

    // Update position and fit bounds without animation
    onPositionChange({ lat, lng });

    setDetecting(true);
    try {
      const geo = await geoDecode(lat, lng);
      if (geo.detectado) {
        setDetectedGeo({
          departamento: geo.departamento,
          municipio: geo.municipio,
          municipio_id: geo.municipio_id,
        });
        onGeoDetected?.({
          departamento: geo.departamento,
          municipio: geo.municipio,
          area_hectareas: area,
          lat,
          lng,
        });
      }
    } catch {
      /* fallback silencioso */
    } finally {
      setDetecting(false);
    }
  }, [onPositionChange, onGeoDetected, onDrawnArea]);

  // Handle simple click on the map (no drawing tool active)
  const handleMapClick = useCallback((latlng) => {
    // Treat as a 0-hectare point selection
    handleZoneCreated({ center: latlng, area: 0 });
  }, [handleZoneCreated]);

  const handleZoneCleared = useCallback(() => {
    setDrawnArea(null);
    setDetectedGeo(null);
    onDrawnArea?.(null);
  }, [onDrawnArea]);

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        maxBounds={CARIBBEAN_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
      >
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <MapSetup position={position} onMapReady={handleMapReady} />
        <DrawTool
          onZoneCreated={handleZoneCreated}
          onZoneCleared={handleZoneCleared}
          onMapClick={handleMapClick}
        />
      </MapContainer>

      {/* Tiny coordinates overlay at bottom-right */}
      <CoordsOverlay position={position} drawnArea={drawnArea} detectedGeo={detectedGeo} />
    </div>
  );
};

export default MapSelector;
