import L from 'leaflet';
import 'leaflet-draw';

const _origReadableArea = L.GeometryUtil.readableArea;

L.GeometryUtil.readableArea = function readableArea(area, isMetric, precision) {
  try {
    return _origReadableArea.call(this, area, isMetric, precision);
  } catch {
    precision = precision || 2;
    if (isMetric) {
      return area >= 1e6
        ? (area / 1e6).toFixed(precision) + ' km\u00B2'
        : area.toFixed(precision) + ' m\u00B2';
    }
    return area >= 43560
      ? (area / 43560).toFixed(precision) + ' acres'
      : area.toFixed(precision) + ' ft\u00B2';
  }
};

export default L;