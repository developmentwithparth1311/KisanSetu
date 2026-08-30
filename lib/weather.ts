export interface MandiWeather {
  mandiId: string;
  mandiName: string;
  temp: number; // in Celsius
  feelsLike: number;
  humidity: number; // %
  condition: string;
  conditionIcon: string;
  rainProbabilityNext48h: number; // %
  spoilageRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  weatherAlert?: string;
  isLive: boolean;
}

const MANDI_COORDINATES: Record<string, { lat: number; lon: number; name: string; state: string }> = {
  nashik: { lat: 19.9975, lon: 73.7898, name: 'Nashik APMC', state: 'Maharashtra' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune Gultekdi', state: 'Maharashtra' },
  indore: { lat: 22.7196, lon: 75.8577, name: 'Indore Mandi', state: 'Madhya Pradesh' },
  azadpur: { lat: 28.7041, lon: 77.1025, name: 'Azadpur Mandi', state: 'Delhi' },
};

export async function fetchMandiWeather(mandiId: string): Promise<MandiWeather> {
  const coords = MANDI_COORDINATES[mandiId] || MANDI_COORDINATES['nashik'];
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey && apiKey !== 'your_openweather_key') {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`,
        { next: { revalidate: 1800 } }
      );

      if (res.ok) {
        const data = await res.json();
        const temp = Math.round(data.main?.temp ?? 28);
        const humidity = data.main?.humidity ?? 65;
        const condition = data.weather?.[0]?.main || 'Clear';
        const isRainy = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle');
        const rainProb = isRainy ? 85 : humidity > 75 ? 60 : 20;

        let spoilageRisk: MandiWeather['spoilageRisk'] = 'Low';
        let weatherAlert: string | undefined;

        if (isRainy || humidity > 80) {
          spoilageRisk = 'High';
          weatherAlert = `High moisture alert in ${coords.name}: Rain and ${humidity}% humidity increase open-mandi crop decay.`;
        } else if (temp > 35) {
          spoilageRisk = 'Moderate';
          weatherAlert = `High temperature (${temp}°C) in ${coords.name}: Ensure covered transit to prevent weight loss.`;
        }

        return {
          mandiId,
          mandiName: coords.name,
          temp,
          feelsLike: Math.round(data.main?.feels_like ?? temp),
          humidity,
          condition,
          conditionIcon: data.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` : '☀️',
          rainProbabilityNext48h: rainProb,
          spoilageRisk,
          weatherAlert,
          isLive: true,
        };
      }
    } catch (err) {
      console.warn('OpenWeatherMap API fetch failed, falling back to simulated telemetry:', err);
    }
  }

  // Realistic fallback simulation based on Indian regional climates
  const defaults: Record<string, Partial<MandiWeather>> = {
    nashik: { temp: 28, humidity: 62, condition: 'Partly Cloudy', rainProbabilityNext48h: 25, spoilageRisk: 'Low' },
    pune: { temp: 29, humidity: 58, condition: 'Sunny', rainProbabilityNext48h: 15, spoilageRisk: 'Low' },
    indore: { temp: 31, humidity: 48, condition: 'Clear Sky', rainProbabilityNext48h: 10, spoilageRisk: 'Low' },
    azadpur: { temp: 34, humidity: 70, condition: 'Hazy Sun', rainProbabilityNext48h: 40, spoilageRisk: 'Moderate' },
  };

  const current = defaults[mandiId] || defaults['nashik'];
  return {
    mandiId,
    mandiName: coords.name,
    temp: current.temp || 28,
    feelsLike: (current.temp || 28) + 2,
    humidity: current.humidity || 60,
    condition: current.condition || 'Clear',
    conditionIcon: '🌤️',
    rainProbabilityNext48h: current.rainProbabilityNext48h || 20,
    spoilageRisk: current.spoilageRisk || 'Low',
    weatherAlert: current.spoilageRisk === 'Moderate' ? `Moderate heat in ${coords.name}: store in shade.` : undefined,
    isLive: false,
  };
}
