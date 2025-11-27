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
    <div className="p-4 space-y-3">
      {events.map((ev) => (
        <div
          key={`event-${ev.id}`}
          className="bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 cursor-pointer transition-colors"
          onClick={() => onSelect(ev)}
        >
          {mode === 'deprem' ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary">
                  {(ev as EarthquakeEvent).size.ml.toFixed(1)} M
                </span>
                <span className="text-sm text-gray-400">
                  {formatTimestamp((ev as EarthquakeEvent).timestamp)}
                </span>
              </div>
              <div className="text-sm mt-1">{(ev as EarthquakeEvent).location}</div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary">
                  {(ev as WeatherEvent).temperature.toFixed(1)}°C
                </span>
                <span className="text-sm text-gray-400">
                  {formatTimestamp((ev as WeatherEvent).time)}
                </span>
              </div>
              <div className="text-sm mt-1">{(ev as WeatherEvent).location}</div>
            </>
          )}
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-center text-gray-400 mt-10">Veri yok, lütfen yenileyin.</div>
      )}
    </div>
  );
}