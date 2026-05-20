import { useState, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from '@shared/utils/leafletDrawPatch';
import 'leaflet-draw/dist/leaflet.draw.css';

const DrawControl = ({ onZoneCreated, onZoneCleared }) => {
  const map = useMapEvents({});
  const [drawnItems, setDrawnItems] = useState(null);

  const handleCreated = useCallback((e) => {
    const { layer } = e;
    setDrawnItems(layer);
    const latlngs = layer.getLatLngs()[0];
    const center = layer.getBounds().getCenter();
    const area = L.GeometryUtil.geodesicArea(latlngs) / 10000;
    onZoneCreated({ latlngs, center, area: area.toFixed(2) });
  }, [onZoneCreated]);

  const handleDeleted = useCallback(() => {
    setDrawnItems(null);
    onZoneCleared();
  }, [onZoneCleared]);

  useState(() => {
    const drawnItemsLayer = new L.FeatureGroup();
    map.addLayer(drawnItemsLayer);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        rectangle: true,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: { featureGroup: drawnItemsLayer, remove: true }
    });

    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeLayer(drawnItemsLayer);
    };
  }, [map, handleCreated, handleDeleted]);

  return null;
};

export default DrawControl;
