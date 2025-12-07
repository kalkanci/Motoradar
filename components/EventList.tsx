"use client";

import React from 'react';
import type { EventType, EarthquakeEvent, WeatherEvent } from './MapComponent';

interface EventListProps {
  events: EventType[];
  mode: 'deprem' | 'hava';
  onSelect: (event: EventType) => void;
}

// Tarih damgasını yerelleştirilmiş Türkçe tarihe çevirir
function formatTimestamp(ts: number | string) {
  try {
    if (typeof ts === 'number') {
      const date = new Date(ts * 1000);
      return date.toLocaleString('tr-TR');
    }
    return ts;
  } catch (e) {
    return ts;
  }
}

export default function EventList({ events, mode, onSelect }: EventListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {events.map((ev) => (
        <div
          key={`event-${ev.id}`}
          className="glass-panel animate-slide-up cursor-pointer rounded-2xl p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          onClick={() => onSelect(ev)}
        >
          {mode === 'deprem' ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-primary">
                  {(ev as EarthquakeEvent).size.ml.toFixed(1)} M
                </span>
                <span className="text-xs text-gray-200">
                  {formatTimestamp((ev as EarthquakeEvent).timestamp)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-100">{(ev as EarthquakeEvent).location}</div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-300">
                <span>Derinlik: {(ev as EarthquakeEvent).depth.toFixed(1)} km</span>
                <span>MD: {(ev as EarthquakeEvent).size.md.toFixed(1)}</span>
                <span>MW: {(ev as EarthquakeEvent).size.mw.toFixed(1)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-primary">
                  {(ev as WeatherEvent).temperature.toFixed(1)}°C / {(ev as WeatherEvent).apparentTemperature?.toFixed(1) ?? '—'}°C
                </span>
                <span className="text-xs text-gray-200">
                  {formatTimestamp((ev as WeatherEvent).time)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-100">{(ev as WeatherEvent).location}</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                <span>Rüzgar: {(ev as WeatherEvent).windspeed.toFixed(1)} km/s</span>
                <span>Yön: {(ev as WeatherEvent).windDirection?.toFixed(0) ?? '—'}°</span>
                <span>Nem: {(ev as WeatherEvent).humidity ?? '—'}%</span>
                <span>Yağış: {(ev as WeatherEvent).precipitation ?? 0} mm</span>
              </div>
            </>
          )}
        </div>
      ))}
      {events.length === 0 && (
        <div className="col-span-full mt-6 text-center text-gray-200">Veri yok, lütfen yenileyin.</div>
      )}
    </div>
  );
}