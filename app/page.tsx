"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import MapComponent, { EventType, EarthquakeEvent, WeatherEvent } from '../components/MapComponent';
import EventList from '../components/EventList';

const defaultLocation = { lat: 40.978, lng: 27.5153 };

type RoadCondition = {
  label: string;
  detail: string;
  tone: 'good' | 'warning' | 'alert';
};

function formatHeading(degrees?: number | null) {
  if (degrees == null || Number.isNaN(degrees)) return 'Yön alınıyor';
  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  const index = Math.round(degrees / 45) % 8;
  return `${directions[index]} (${Math.round(degrees)}°)`;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateWindChill(tempC: number, windKmh: number) {
  if (tempC > 10 || windKmh < 5) return tempC;
  return (
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(windKmh, 0.16) +
    0.3965 * tempC * Math.pow(windKmh, 0.16)
  );
}

function estimateRoadCondition(tempC: number, precipitation: number, windKmh: number): RoadCondition {
  if (precipitation > 0.2) {
    return {
      label: 'Islak / Kaygan',
      detail: 'Yağış algılandı, fren mesafesini uzatın.',
      tone: 'alert',
    };
  }
  if (tempC <= 1) {
    return {
      label: 'Buzlanma Riski',
      detail: 'Soğuk yüzeyler ve düşük sıcaklık nedeniyle dikkatli olun.',
      tone: 'warning',
    };
  }
  if (windKmh > 35) {
    return {
      label: 'Yan Rüzgar',
      detail: 'Şiddetli rüzgar motorda dengesizlik oluşturabilir.',
      tone: 'warning',
    };
  }
  return {
    label: 'Kuru Yol',
    detail: 'Yol yüzeyi için koşullar normal.',
    tone: 'good',
  };
}

export default function HomePage() {
  const [tab, setTab] = useState<'harita' | 'liste' | 'ayarlar'>('harita');
  const [mode, setMode] = useState<'deprem' | 'hava'>('deprem');
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<EventType | null>(null);
  const [userCoords, setUserCoords] = useState(defaultLocation);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState('Yön alınıyor');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [windChill, setWindChill] = useState<number | null>(null);
  const [roadCondition, setRoadCondition] = useState<RoadCondition>(
    estimateRoadCondition(12, 0, 10)
  );

  const lastPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const resolveCoords = () =>
    new Promise<{ lat: number; lng: number }>((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => resolve(defaultLocation),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        resolve(defaultLocation);
      }
    });

  const fetchEarthquakes = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://deprem-api.vercel.app/');
      const data = await res.json();
      const list: EarthquakeEvent[] = data.earthquakes;
      setEvents(list);
    } catch (e) {
      console.error('Deprem verisi alınamadı', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const { lat, lng } = await resolveCoords();
      setUserCoords({ lat, lng });
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation,cloud_cover&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      const cw = data.current;
      const weatherEvent: WeatherEvent = {
        id: 'weather',
        time: cw.time,
        latitude: lat,
        longitude: lng,
        temperature: cw.temperature_2m,
        windspeed: cw.wind_speed_10m,
        weathercode: cw.weather_code,
        location: 'Mevcut Konum',
        windDirection: cw.wind_direction_10m,
        apparentTemperature: cw.apparent_temperature,
        humidity: cw.relative_humidity_2m,
        precipitation: cw.precipitation,
        cloudCover: cw.cloud_cover,
      };
      const chill = calculateWindChill(cw.temperature_2m, cw.wind_speed_10m);
      setWindChill(chill);
      setRoadCondition(estimateRoadCondition(cw.temperature_2m, cw.precipitation, cw.wind_speed_10m));
      setEvents([weatherEvent]);
    } catch (e) {
      console.error('Hava verisi alınamadı', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: rawSpeed, heading: rawHeading } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setLastUpdate(new Date(pos.timestamp).toLocaleTimeString('tr-TR'));
        setHeading(formatHeading(rawHeading));

        let computedSpeed = rawSpeed != null ? rawSpeed * 3.6 : NaN;
        if (!Number.isFinite(computedSpeed) && lastPositionRef.current) {
          const { lat, lng, timestamp } = lastPositionRef.current;
          const deltaTimeHours = (pos.timestamp - timestamp) / (1000 * 60 * 60);
          const distanceKm = haversineDistance(lat, lng, latitude, longitude);
          computedSpeed = distanceKm / Math.max(deltaTimeHours, 1 / 3600);
        }
        setSpeed(Number.isFinite(computedSpeed) ? Math.max(0, computedSpeed) : 0);
        lastPositionRef.current = { lat: latitude, lng: longitude, timestamp: pos.timestamp };
      },
      (err) => {
        console.warn('Konum alınamadı', err);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
    );

    return () => {
      if (watchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

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

  const activeWeather = useMemo(() => {
    if (mode !== 'hava' || events.length === 0) return null;
    return events[0] as WeatherEvent;
  }, [events, mode]);

  const windChillValue = windChill ?? activeWeather?.apparentTemperature ?? activeWeather?.temperature;

  const hudCards = [
    {
      title: 'Anlık Hız',
      value: `${Math.round(speed)} km/sa`,
      meta: heading,
      accent: 'primary',
      icon: '🏍️',
      info: lastUpdate ? `Güncellendi: ${lastUpdate}` : 'GPS verisi bekleniyor',
    },
    {
      title: 'Rüzgar Soğuğu',
      value: windChillValue != null ? `${windChillValue.toFixed(1)}°C` : '—',
      meta: activeWeather ? `Rüzgar: ${activeWeather.windspeed.toFixed(0)} km/sa` : 'Hava verisi bekleniyor',
      accent: 'accent',
      icon: '🌬️',
      info: activeWeather?.windDirection ? `Yön: ${Math.round(activeWeather.windDirection)}°` : 'Yön bilgisi bekleniyor',
    },
    {
      title: 'Yol Durumu',
      value: roadCondition.label,
      meta: roadCondition.detail,
      accent: roadCondition.tone === 'good' ? 'primary' : roadCondition.tone === 'warning' ? 'accent' : 'accent',
      icon: '🛣️',
      info: activeWeather
        ? `Sıcaklık: ${activeWeather.temperature.toFixed(1)}°C • Yağış: ${(activeWeather.precipitation ?? 0).toFixed(1)} mm`
        : 'Tahmin için hava moduna geçin',
    },
    {
      title: 'Konum',
      value: `${userCoords.lat.toFixed(3)}, ${userCoords.lng.toFixed(3)}`,
      meta: activeWeather
        ? `Bulut: ${activeWeather.cloudCover ?? '—'}% • Nem: ${activeWeather.humidity ?? '—'}%`
        : 'Konum kilitlendi',
      accent: 'primary',
      icon: '📍',
      info: mode === 'deprem' ? 'Deprem haritası açık' : 'Hava radarı açık',
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col gap-4 px-4 pb-24 pt-6 sm:pb-10">
      <header className="glass-panel animate-fade-in rounded-3xl p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-300">Moto HUD</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Motoradar Sürüş Asistanı</h1>
            <p className="mt-1 text-sm text-gray-300">
              Hız takibi, hava durumu ve yol durumu için cam efektiyle modern HUD.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row">
            <div className="flex rounded-full bg-white/10 p-1 backdrop-blur">
              {['deprem', 'hava'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item as 'deprem' | 'hava')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
                    mode === item ? 'bg-primary text-black' : 'text-gray-200'
                  )}
                >
                  {item === 'deprem' ? 'Deprem' : 'Hava'}
                </button>
              ))}
            </div>
            <button
              onClick={refreshData}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            >
              Yenile
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['harita', 'liste', 'ayarlar'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item as typeof tab)}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10',
                tab === item ? 'bg-white/15 text-white' : 'text-gray-200'
              )}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <section className="hud-grid">
        {hudCards.map((card, index) => (
          <div
            key={card.title}
            className="glass-panel animate-slide-up rounded-2xl p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-200">{card.title}</p>
                <p className="mt-1 text-3xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-gray-300">{card.meta}</p>
              </div>
              <div
                className={clsx(
                  'flex h-12 w-12 items-center justify-center rounded-2xl text-lg',
                  card.accent === 'primary' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                )}
              >
                {card.icon}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-200">{card.info}</p>
          </div>
        ))}
      </section>

      <main className="flex-1 space-y-4">
        <div className="glass-panel animate-fade-in rounded-3xl p-4 shadow-lg">
          {loading && (
            <div className="flex h-80 items-center justify-center text-gray-300">Yükleniyor...</div>
          )}
          {!loading && tab === 'harita' && (
            <div className="h-[360px] w-full overflow-hidden rounded-2xl shadow-inner">
              <MapComponent events={events} mode={mode} onSelect={(ev) => setSelected(ev)} />
            </div>
          )}
          {!loading && tab === 'liste' && (
            <EventList events={events} mode={mode} onSelect={(ev) => setSelected(ev)} />
          )}
          {!loading && tab === 'ayarlar' && (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-4">
                <label className="block text-sm font-medium text-gray-200 mb-3">Radar Modu</label>
                <div className="flex flex-wrap gap-3">
                  {['deprem', 'hava'].map((item) => (
                    <button
                      key={`ayar-${item}`}
                      className={clsx(
                        'rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl',
                        mode === item
                          ? 'bg-primary text-black shadow-lg'
                          : 'bg-white/10 text-gray-100 shadow-inner'
                      )}
                      onClick={() => setMode(item as 'deprem' | 'hava')}
                    >
                      {item === 'deprem' ? 'Deprem Modu' : 'Hava Modu'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <button
                  className="w-full rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-black shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                  onClick={refreshData}
                >
                  Verileri Yenile
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-200">
                Deprem verileri deprem-api.vercel.app üzerinden, hava verileri Open‑Meteo API üzerinden alınır.
                Geolocation API gerçek GPS verilerini kullanır; konum izni vermeyi unutmayın.
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-4 left-0 right-0 mx-4 flex items-center justify-around rounded-full bg-white/10 p-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md sm:static sm:mx-0 sm:rounded-2xl">
        <button
          className={clsx(
            'flex flex-1 flex-col items-center rounded-full px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10',
            tab === 'harita' && 'bg-white/15 text-primary'
          )}
          onClick={() => setTab('harita')}
        >
          Harita
        </button>
        <button
          className={clsx(
            'flex flex-1 flex-col items-center rounded-full px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10',
            tab === 'liste' && 'bg-white/15 text-primary'
          )}
          onClick={() => setTab('liste')}
        >
          Liste
        </button>
        <button
          className={clsx(
            'flex flex-1 flex-col items-center rounded-full px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10',
            tab === 'ayarlar' && 'bg-white/15 text-primary'
          )}
          onClick={() => setTab('ayarlar')}
        >
          Ayarlar
        </button>
      </nav>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-panel w-11/12 max-w-md rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {mode === 'deprem' ? 'Deprem Detayı' : 'Hava Detayı'}
              </h2>
              <button
                className="rounded-full bg-white/10 px-2 py-1 text-sm text-gray-100 transition hover:bg-white/20"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            {mode === 'deprem' ? (
              <div className="mt-4 space-y-2 text-sm text-gray-100">
                <div><span className="font-medium text-white">Yer:</span> {(selected as EarthquakeEvent).location}</div>
                <div><span className="font-medium text-white">Büyüklük:</span> {(selected as EarthquakeEvent).size.ml.toFixed(1)}</div>
                <div><span className="font-medium text-white">Derinlik:</span> {(selected as EarthquakeEvent).depth.toFixed(1)} km</div>
                <div><span className="font-medium text-white">Tarih:</span> {(selected as EarthquakeEvent).date}</div>
              </div>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-gray-100">
                <div><span className="font-medium text-white">Konum:</span> {(selected as WeatherEvent).location}</div>
                <div><span className="font-medium text-white">Sıcaklık:</span> {(selected as WeatherEvent).temperature.toFixed(1)}°C</div>
                <div><span className="font-medium text-white">Rüzgar Hızı:</span> {(selected as WeatherEvent).windspeed.toFixed(1)} km/s</div>
                <div><span className="font-medium text-white">Rüzgar Yönü:</span> {(selected as WeatherEvent).windDirection?.toFixed(0)}°</div>
                <div><span className="font-medium text-white">Zaman:</span> {(selected as WeatherEvent).time}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
