"use client";

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import MapComponent, { EventType, EarthquakeEvent, WeatherEvent } from '../components/MapComponent';
import EventList from '../components/EventList';

export default function HomePage() {
  // Sekme durumu: harita, liste veya ayarlar
  const [tab, setTab] = useState<'harita' | 'liste' | 'ayarlar'>('harita');
  // Radar modu: deprem veya hava
  const [mode, setMode] = useState<'deprem' | 'hava'>('deprem');
  // Veri listesi
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // Seçilen olay detayları için
  const [selected, setSelected] = useState<EventType | null>(null);

  // Deprem verilerini getir
  const fetchEarthquakes = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://deprem-api.vercel.app/');
      const data = await res.json();
      // API 'earthquakes' anahtarı altında diziyi döner
      const list: EarthquakeEvent[] = data.earthquakes;
      setEvents(list);
    } catch (e) {
      console.error('Deprem verisi alınamadı', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Hava durumu verisini getir (mevcut konum)
  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Kullanıcının coğrafi konumunu al
      const position = await new Promise<{ lat: number; lng: number }>((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
              // Hata durumunda Tekirdağ koordinatlarını kullan
              resolve({ lat: 40.9780, lng: 27.5153 });
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          resolve({ lat: 40.9780, lng: 27.5153 });
        }
      });
      const { lat, lng } = position;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      const cw = data.current_weather;
      const weatherEvent: WeatherEvent = {
        id: 'weather',
        time: cw.time,
        latitude: lat,
        longitude: lng,
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        weathercode: cw.weathercode,
        location: 'Mevcut Konum',
      };
      setEvents([weatherEvent]);
    } catch (e) {
      console.error('Hava verisi alınamadı', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Mod değiştiğinde veri getir
  useEffect(() => {
    if (mode === 'deprem') {
      fetchEarthquakes();
    } else {
      fetchWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const refreshData = () => {
    if (mode === 'deprem') fetchEarthquakes();
    else fetchWeather();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Üst başlık */}
      <header className="p-4 bg-gray-800 text-center">
        <h1 className="text-xl font-bold">
          {mode === 'deprem' ? 'Deprem Radarı' : 'Hava Radarı'}
        </h1>
      </header>
      {/* İçerik alanı */}
      <main className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400">Yükleniyor...</div>
        )}
        {!loading && tab === 'harita' && (
          <MapComponent events={events} mode={mode} onSelect={(ev) => setSelected(ev)} />
        )}
        {!loading && tab === 'liste' && (
          <EventList events={events} mode={mode} onSelect={(ev) => setSelected(ev)} />
        )}
        {!loading && tab === 'ayarlar' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Radar Modu</label>
              <div className="flex space-x-4">
                <button
                  className={clsx(
                    'px-4 py-2 rounded-full border',
                    mode === 'deprem' ? 'bg-primary text-black border-primary' : 'bg-gray-700 border-gray-600'
                  )}
                  onClick={() => setMode('deprem')}
                >
                  Deprem
                </button>
                <button
                  className={clsx(
                    'px-4 py-2 rounded-full border',
                    mode === 'hava' ? 'bg-primary text-black border-primary' : 'bg-gray-700 border-gray-600'
                  )}
                  onClick={() => setMode('hava')}
                >
                  Hava
                </button>
              </div>
            </div>
            <div>
              <button
                className="px-4 py-2 bg-accent text-black rounded-full"
                onClick={refreshData}
              >
                Yenile
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Veriler deprem için deprem-api.vercel.app üzerinden, hava durumu için Open‑Meteo API üzerinden alınmaktadır.
            </div>
          </div>
        )}
      </main>
      {/* Alt navigasyon çubuğu */}
      <nav className="h-14 flex justify-around items-center border-t border-gray-700 bg-gray-800">
        <button
          className={clsx('flex flex-col items-center text-sm', tab === 'harita' && 'text-primary')}
          onClick={() => setTab('harita')}
        >
          <span>Harita</span>
        </button>
        <button
          className={clsx('flex flex-col items-center text-sm', tab === 'liste' && 'text-primary')}
          onClick={() => setTab('liste')}
        >
          <span>Liste</span>
        </button>
        <button
          className={clsx('flex flex-col items-center text-sm', tab === 'ayarlar' && 'text-primary')}
          onClick={() => setTab('ayarlar')}
        >
          <span>Ayarlar</span>
        </button>
      </nav>
      {/* Detay modali */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-800 p-4 rounded-lg w-11/12 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {mode === 'deprem' ? 'Deprem Detayı' : 'Hava Detayı'}
              </h2>
              <button className="text-gray-400 hover:text-gray-200" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            {mode === 'deprem' ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Yer:</span> {(selected as EarthquakeEvent).location}</div>
                <div><span className="font-medium">Büyüklük:</span> {(selected as EarthquakeEvent).size.ml.toFixed(1)}</div>
                <div><span className="font-medium">Derinlik:</span> {(selected as EarthquakeEvent).depth.toFixed(1)} km</div>
                <div><span className="font-medium">Tarih:</span> {(selected as EarthquakeEvent).date}</div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Konum:</span> {(selected as WeatherEvent).location}</div>
                <div><span className="font-medium">Sıcaklık:</span> {(selected as WeatherEvent).temperature.toFixed(1)}°C</div>
                <div><span className="font-medium">Rüzgar Hızı:</span> {(selected as WeatherEvent).windspeed.toFixed(1)} km/s</div>
                <div><span className="font-medium">Zaman:</span> {(selected as WeatherEvent).time}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}