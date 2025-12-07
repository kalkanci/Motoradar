"use client";

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
codex/design-motorcycle-hud-with-glassmorphism-r4e6h9
import L from 'leaflet';
main
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export interface EarthquakeEvent {
  id: number | string;
  date: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  size: {
    md: number;
    ml: number;
    mw: number;
  };
  location: string;
  attribute?: string;
}

export interface WeatherEvent {
  id: string;
  time: string;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  weathercode: number;
  location: string;
  windDirection?: number;
  apparentTemperature?: number;
  humidity?: number;
  precipitation?: number;
  cloudCover?: number;
}

export type EventType = EarthquakeEvent | WeatherEvent;

interface MapComponentProps {
  events: EventType[];
  mode: 'deprem' | 'hava';
  onSelect: (event: EventType) => void;
}

/*
 * Leaflet vars için varsayılan ikonları düzeltin.
 * Next.js ile birlikte static klasör içinde marker ikonlarının yolu düzeltilmezse,
 * markerler görünmez. Bu kod, varsayılan ikonların yolunu atar.
 */
 codex/design-motorcycle-hud-with-glassmorphism-r4e6h9
const fixLeafletIcons = (leaflet?: typeof import('leaflet')) => {
  if (!leaflet) return;
  delete (leaflet.Icon.Default as any).prototype._getIconUrl;
  leaflet.Icon.Default.mergeOptions({

const fixLeafletIcons = () => {
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
 main
    iconRetinaUrl: '/icons/icon-512.png',
    iconUrl: '/icons/icon-192.png',
    shadowUrl: undefined,
  });
};

export default function MapComponent({ events, mode, onSelect }: MapComponentProps) {
codex/design-motorcycle-hud-with-glassmorphism-r4e6h9
  const leaflet = useMemo(
    () => (typeof window !== 'undefined' ? (require('leaflet') as typeof import('leaflet')) : undefined),
    []
  );

  useEffect(() => {
    fixLeafletIcons(leaflet);
  }, [leaflet]);

  useEffect(() => {
    fixLeafletIcons();
  }, []);
main

  // Varsayılan merkez: Türkiye (Tekirdağ yakınları)
  const defaultCenter = useMemo(() => {
    if (events && events.length > 0) {
      return [events[0].latitude, events[0].longitude] as [number, number];
    }
    return [40.9780, 27.5153] as [number, number];
  }, [events]);

  return (
    <div className="w-full h-full">
      {/* MapContainer sadece istemci tarafında render edilir */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        className="h-full w-full rounded-3xl shadow-inner"
      >
        {/* Dark mode harita katmanı */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {events.map((ev) => {
          const position: [number, number] = [ev.latitude, ev.longitude];
          return (
            <Marker
              key={`marker-${ev.id}`}
              position={position}
              eventHandlers={{
                click: () => onSelect(ev),
              }}
            >
              <Popup>
                {mode === 'deprem' ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-bold text-primary">{(ev as EarthquakeEvent).location}</div>
                    <div>Büyüklük: {(ev as EarthquakeEvent).size.ml.toFixed(1)}</div>
                    <div>Derinlik: {(ev as EarthquakeEvent).depth.toFixed(1)} km</div>
                    <div>Tarih: {(ev as EarthquakeEvent).date}</div>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div className="font-bold text-primary">{(ev as WeatherEvent).location}</div>
                    <div>Sıcaklık: {(ev as WeatherEvent).temperature.toFixed(1)}°C</div>
                    <div>Hissedilen: {(ev as WeatherEvent).apparentTemperature?.toFixed(1) ?? '—'}°C</div>
                    <div>Rüzgar: {(ev as WeatherEvent).windspeed.toFixed(1)} km/s</div>
                    <div>Yön: {(ev as WeatherEvent).windDirection?.toFixed(0) ?? '—'}°</div>
                    <div>Zaman: {(ev as WeatherEvent).time}</div>
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}