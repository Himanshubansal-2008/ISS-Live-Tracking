import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Custom ISS icon
const issIcon = L.icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [40, 25],
  iconAnchor: [20, 12],
});

export default function ISSMap({ position, positions }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 8,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !position) return;

    const { latitude, longitude } = position;

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon: issIcon })
        .addTo(mapInstanceRef.current)
        .bindTooltip(
          `ISS Position<br>Lat: ${latitude.toFixed(3)}<br>Lon: ${longitude.toFixed(3)}`,
          { permanent: false, direction: 'top' }
        );
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setTooltipContent(
        `ISS Position<br>Lat: ${latitude.toFixed(3)}<br>Lon: ${longitude.toFixed(3)}`
      );
    }

    mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom(), {
      animate: true,
      duration: 0.5,
    });
  }, [position]);

  // Update trajectory polyline
  useEffect(() => {
    if (!mapInstanceRef.current || positions.length < 2) return;

    const coords = positions.map((p) => [p.latitude, p.longitude]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(coords);
    } else {
      polylineRef.current = L.polyline(coords, {
        color: '#e07a4f',
        weight: 3,
        opacity: 0.8,
        dashArray: '8, 4',
      }).addTo(mapInstanceRef.current);
    }
  }, [positions]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
