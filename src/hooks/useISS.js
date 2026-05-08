import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateSpeed } from '../utils/haversine.js';

const isDev = import.meta.env.DEV;
const ISS_POS_URL = isDev ? 'http://api.open-notify.org/iss-now.json' : '/api/iss-now';
const ASTROS_URL = isDev ? 'http://api.open-notify.org/astros.json' : '/api/astros';
const REVERSE_GEO_URL = 'https://nominatim.openstreetmap.org/reverse';

export function useISS() {
  const [position, setPosition] = useState(null);
  const [positions, setPositions] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [speeds, setSpeeds] = useState([]);
  const [nearestPlace, setNearestPlace] = useState('Calculating...');
  const [astronauts, setAstronauts] = useState({ number: 0, people: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  const geoTimeoutRef = useRef(null);

  const fetchPosition = useCallback(async () => {
    try {
      const res = await fetch(ISS_POS_URL);
      if (!res.ok) throw new Error('Failed to fetch ISS position');
      const data = await res.json();
      if (data.message !== 'success') throw new Error('ISS API error');

      const newPos = {
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp,
      };

      setPosition(newPos);
      setLoading(false);
      setError(null);

      setPositions((prev) => {
        const updated = [...prev, newPos].slice(-15);
        // Calculate speed if we have at least 2 positions
        if (updated.length >= 2) {
          const spd = calculateSpeed(updated[updated.length - 2], updated[updated.length - 1]);
          if (spd > 0 && spd < 50000) {
            setSpeed(spd);
            setSpeeds((prevSpeeds) => {
              const newEntry = { speed: Math.round(spd * 100) / 100, time: new Date().toLocaleTimeString() };
              return [...prevSpeeds, newEntry].slice(-30);
            });
          }
        }
        return updated;
      });

      // Reverse geocode (debounced)
      clearTimeout(geoTimeoutRef.current);
      geoTimeoutRef.current = setTimeout(async () => {
        try {
          const geoRes = await fetch(
            `${REVERSE_GEO_URL}?lat=${newPos.latitude}&lon=${newPos.longitude}&format=json&zoom=5`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const place = geoData.display_name || geoData.address?.country || 'Over ocean / remote area';
            setNearestPlace(place.length > 50 ? place.substring(0, 50) + '...' : place);
          } else {
            setNearestPlace('Over ocean / remote area');
          }
        } catch {
          setNearestPlace('Over ocean / remote area');
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const fetchAstronauts = useCallback(async () => {
    try {
      const res = await fetch(ASTROS_URL);
      if (!res.ok) throw new Error('Failed to fetch astronauts');
      const data = await res.json();
      if (data.message === 'success') {
        setAstronauts({ number: data.number, people: data.people });
      }
    } catch {
      // silently fail, keep old data
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPosition();
  }, [fetchPosition]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    fetchPosition();
    fetchAstronauts();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchPosition, 15000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(geoTimeoutRef.current);
    };
  }, [autoRefresh, fetchPosition, fetchAstronauts]);

  return {
    position,
    positions,
    speed,
    speeds,
    nearestPlace,
    astronauts,
    loading,
    error,
    autoRefresh,
    refresh,
    toggleAutoRefresh,
  };
}
