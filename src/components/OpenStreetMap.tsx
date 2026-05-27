import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, ViewStyle, Platform, View, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export type MapCoordinate = { latitude: number; longitude: number };

export type MapStation = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  brand: string;
  priceLabel: string;
  priceColor?: string;
  logoUri?: string;
};

type Props = {
  style?: ViewStyle;
  stations: MapStation[];
  userLocation: MapCoordinate;
  routePoints?: MapCoordinate[] | null;
  isDark?: boolean;
  onStationPress?: (stationId: string) => void;
};

function buildMapHtml(isDark: boolean) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = isDark
    ? '&copy; OpenStreetMap &copy; CARTO'
    : '&copy; OpenStreetMap contributors';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .station-marker { display: flex; flex-direction: column; align-items: center; }
    .marker-card {
      background: #fff;
      border: 2px solid #004B93;
      border-radius: 10px;
      padding: 4px 8px;
      min-width: 56px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .marker-price { font: 900 11px system-ui; color: #004B93; }
    .marker-brand { font: 700 8px system-ui; color: #64748b; margin-top: 2px; }
    .marker-logo { width: 28px; height: 28px; object-fit: contain; margin-bottom: 2px; border-radius: 6px; }
    .marker-pin {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 9px solid #004B93;
      margin-top: -1px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([14.5995, 120.9842], 12);
    L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: '${attribution}' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    let markersLayer = L.layerGroup().addTo(map);
    let routeLayer = null;
    let userMarker = null;

    function markerHtml(station) {
      const logo = station.logoUri
        ? '<img class="marker-logo" src="' + station.logoUri + '" />'
        : '';
      const color = station.priceColor || '#004B93';
      return '<div class="station-marker"><div class="marker-card" style="border-color: ' + color + '40">' + logo +
        '<div class="marker-price" style="color: ' + color + '">' + station.priceLabel + '</div>' +
        '<div class="marker-brand">' + station.brand + '</div></div><div class="marker-pin" style="border-top-color: ' + color + '"></div></div>';
    }

    function setMarkers(stations) {
      markersLayer.clearLayers();
      stations.forEach(function(s) {
        const icon = L.divIcon({
          html: markerHtml(s),
          className: '',
          iconSize: [72, 72],
          iconAnchor: [36, 72],
        });
        const m = L.marker([s.lat, s.lng], { icon: icon });
        m.on('click', function() {
          var msg = JSON.stringify({ type: 'stationPress', id: s.id });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent) {
            window.parent.postMessage(msg, '*');
          }
        });
        markersLayer.addLayer(m);
      });
    }

    function setUserLocation(lat, lng) {
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#0066ff',
        fillColor: '#0066ff',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
    }

    function setRoute(points) {
      if (routeLayer) map.removeLayer(routeLayer);
      if (!points || points.length < 2) return;
      const latlngs = points.map(function(p) { return [p.latitude, p.longitude]; });
      routeLayer = L.polyline(latlngs, { color: '#3b82f6', weight: 5 }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
    }

    function flyTo(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 14, { duration: 0.8 });
    }

    function fitCoords(coords) {
      if (!coords || coords.length === 0) return;
      const bounds = L.latLngBounds(coords.map(function(c) { return [c.latitude, c.longitude]; }));
      map.fitBounds(bounds, { padding: [48, 48] });
    }

    function handleMessage(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'init') {
          if (msg.userLocation) {
            setUserLocation(msg.userLocation.latitude, msg.userLocation.longitude);
            map.setView([msg.userLocation.latitude, msg.userLocation.longitude], 14);
          }
          setMarkers(msg.stations || []);
          if (msg.routePoints) setRoute(msg.routePoints);
        }
        if (msg.type === 'updateStations') setMarkers(msg.stations || []);
        if (msg.type === 'updateLocation') {
          if (msg.userLocation) setUserLocation(msg.userLocation.latitude, msg.userLocation.longitude);
        }
        if (msg.type === 'updateRoute') setRoute(msg.routePoints || null);
        if (msg.type === 'flyTo') flyTo(msg.lat, msg.lng, msg.zoom);
        if (msg.type === 'fitCoords') fitCoords(msg.coords);
      } catch (e) {}
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);
  </script>
</body>
</html>`;
}

export type OpenStreetMapHandle = {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitCoordinates: (coords: MapCoordinate[]) => void;
};

const OpenStreetMap = React.forwardRef<OpenStreetMapHandle, Props>(function OpenStreetMap(
  { style, stations, userLocation, routePoints, isDark = false, onStationPress },
  ref
) {
  const webRef = useRef<any>(null);
  const html = useMemo(() => buildMapHtml(isDark), [isDark]);
  const ready = useRef(false);
  const prevStationsStr = useRef('');

  const post = useCallback((payload: object) => {
    if (!webRef.current) return;
    const msg = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      if (webRef.current.contentWindow) {
        webRef.current.contentWindow.postMessage(msg, '*');
      }
    } else {
      webRef.current.postMessage(msg);
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    post({
      type: 'init',
      stations,
      userLocation,
      routePoints: routePoints ?? null,
    });
    ready.current = true;
  }, [post, stations, userLocation, routePoints]);

  useEffect(() => {
    if (ready.current) {
      const currentStationsStr = JSON.stringify(stations);
      if (currentStationsStr !== prevStationsStr.current) {
        post({ type: 'updateStations', stations });
        prevStationsStr.current = currentStationsStr;
      }
    }
  }, [stations, post]);

  useEffect(() => {
    if (ready.current && userLocation) post({ type: 'updateLocation', userLocation });
  }, [userLocation, post]);

  useEffect(() => {
    if (ready.current) post({ type: 'updateRoute', routePoints: routePoints ?? null });
  }, [routePoints, post]);

  React.useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 14) => post({ type: 'flyTo', lat, lng, zoom }),
    fitCoordinates: (coords) => post({ type: 'fitCoords', coords }),
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'stationPress' && data.id) {
        onStationPress?.(data.id);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'stationPress' && data.id) {
            onStationPress?.(data.id);
          }
        } catch (_) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [onStationPress]);

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={webRef}
        style={{ width: '100%', height: '100%', border: 'none', ...(style as any) }}
        srcDoc={html}
        onLoad={handleLoadEnd}
      />
    );
  }

  return (
    <WebView
      ref={webRef}
      style={[styles.map, style]}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      onLoadEnd={handleLoadEnd}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="compatibility"
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
    />
  );
});

export default OpenStreetMap;

const styles = StyleSheet.create({
  map: { flex: 1 },
});
