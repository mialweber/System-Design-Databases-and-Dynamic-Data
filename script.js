const defaultLat = 40.7128;
const defaultLng = -74.006;

const weatherStatus = {
  sunny: { label: "Sunny", summary: "Clear skies and bright conditions." },
  rainy: {
    label: "Rainy",
    summary: "Cloudy with wet conditions and steady rain.",
  },
  storm: {
    label: "Stormy",
    summary: "Heavy weather with strong atmospheric energy.",
  },
  snowy: { label: "Snowy", summary: "Cold and wintry weather conditions." },
  normal: { label: "Normal", summary: "Mild and balanced weather." },
};

const timePokemonProfiles = {
  Daytime: {
    name: "Solrock",
    state: "A bright, confident Pokémon that thrives in daytime energy.",
    imageId: 338,
  },
  Nighttime: {
    name: "Lunatone",
    state: "A calm, moonlit Pokémon that awakens in the night.",
    imageId: 337,
  },
};

const weatherPokemonProfiles = {
  sunny: {
    name: "Castform (Sunny Form)",
    state: "The sun form glows with warm, bright weather energy.",
    imageId: 10013,
  },
  rainy: {
    name: "Castform (Rainy Form)",
    state: "The rain form appears in wet, drizzly conditions.",
    imageId: 10014,
  },
  storm: {
    name: "Castform (Snowy Form)",
    state:
      "Castform does not have a separate storm sprite, so the snowy form is used as the closest visual match.",
    imageId: 10015,
  },
  snowy: {
    name: "Castform (Snowy Form)",
    state: "The snowy form feels cold, crisp, and wintery.",
    imageId: 10015,
  },
  normal: {
    name: "Castform (Normal Form)",
    state: "The normal form stays balanced in calm weather.",
    imageId: 351,
  },
};

const latInput = document.getElementById("lat");
const lngInput = document.getElementById("lng");
const getWeatherBtn = document.getElementById("getWeatherBtn");
const statusMessage = document.getElementById("statusMessage");
const coordsDisplay = document.getElementById("coordsDisplay");
const timeOfDayDisplay = document.getElementById("timeOfDayDisplay");
const weatherDisplay = document.getElementById("weatherDisplay");
const temperatureDisplay = document.getElementById("temperatureDisplay");
const timePokemonSprite = document.getElementById("timePokemonSprite");
const timePokemonName = document.getElementById("timePokemonName");
const timePokemonState = document.getElementById("timePokemonState");
const weatherPokemonSprite = document.getElementById("weatherPokemonSprite");
const weatherPokemonName = document.getElementById("weatherPokemonName");
const weatherPokemonState = document.getElementById("weatherPokemonState");
const timeTag = document.getElementById("timeTag");
const weatherTag = document.getElementById("weatherTag");
const locationTitle = document.getElementById("locationTitle");
let locationRequestId = 0;

function estimateOceanName(lat, lng) {
  if (lat >= 66) return "Arctic Ocean";
  if (lat <= -60) return "Southern Ocean";
  if (lng >= -70 && lng < 20) return "Atlantic Ocean";
  if (lng >= 20 && lng < 147) return "Indian Ocean";
  return "Pacific Ocean";
}

async function updateLocationTitle(lat, lng) {
  if (!locationTitle) return;
  const requestId = ++locationRequestId;
  let name = null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&accept-language=en&lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && !data.error) {
        name =
          (data.address && data.address.country) ||
          (data.display_name && data.display_name.includes("Antarctica")
            ? "Antarctica"
            : null) ||
          data.name ||
          null;
      }
    }
  } catch (error) {
    console.error(error);
  }

  // Open water (no country returned): estimate the ocean from coordinates
  if (!name) name = estimateOceanName(lat, lng);

  // Ignore stale responses from earlier pin placements
  if (requestId === locationRequestId) {
    locationTitle.textContent = name;
  }
}

function updateCoordsInputs(lat, lng) {
  if (latInput) latInput.value = Number(lat).toFixed(4);
  if (lngInput) lngInput.value = Number(lng).toFixed(4);
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#ff7676" : "#a6afd3";
}

function normalizeLatLng(lat, lng) {
  const clippedLat = Math.min(90, Math.max(-90, Number(lat)));
  const clippedLng = Math.min(180, Math.max(-180, Number(lng)));
  return { lat: clippedLat, lng: clippedLng };
}

function getWeatherCategory(weatherCode) {
  const sunnyCodes = [0, 1, 2];
  const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
  const stormCodes = [71, 73, 75, 77, 85, 86, 95, 96, 99];
  const snowyCodes = [
    3, 45, 48, 13, 14, 15, 16, 17, 18, 41, 42, 43, 44, 46, 47,
  ];

  if (sunnyCodes.includes(weatherCode)) return "sunny";
  if (rainyCodes.includes(weatherCode)) return "rainy";
  if (stormCodes.includes(weatherCode)) return "storm";
  if (snowyCodes.includes(weatherCode)) return "snowy";
  return "normal";
}

function getWeatherDescription(weatherCode) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Icy fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow",
    95: "Thunderstorm",
    96: "Thunderstorm hail",
    99: "Thunderstorm hail",
  };
  return descriptions[weatherCode] || "Unknown";
}

function getTimeOfDay(currentTime, sunrise, sunset) {
  const currentDate = new Date(currentTime);
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);

  if (currentDate >= sunriseDate && currentDate <= sunsetDate) {
    return "Daytime";
  }

  return "Nighttime";
}

function updateTimePokemon(timeOfDay) {
  const profile = timePokemonProfiles[timeOfDay];
  timePokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${profile.imageId}.png`;
  timePokemonSprite.alt = `${profile.name} matching the time of day`;
  timePokemonSprite.hidden = false;
  timePokemonName.textContent = profile.name;
  timePokemonState.textContent = profile.state;
  if (timeTag) timeTag.textContent = timeOfDay;
}

function updateWeatherPokemon(weatherCategory) {
  const profile = weatherPokemonProfiles[weatherCategory];
  weatherPokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${profile.imageId}.png`;
  weatherPokemonSprite.alt = `${profile.name} matching the weather`;
  weatherPokemonSprite.hidden = false;
  // Remove parenthetical form text (e.g., "(Snowy Form)") for display
  const displayName = profile.name
    ? profile.name.replace(/\s*\(.*\)\s*/g, "")
    : profile.name;
  weatherPokemonName.textContent = displayName;
  // Show a short boxed description for Castform forms
  const formNames = {
    sunny: "sun",
    rainy: "rain",
    storm: "snow",
    snowy: "snow",
    normal: "normal",
  };
  if (profile.name && profile.name.toLowerCase().includes("castform")) {
    const form = formNames[weatherCategory] || weatherCategory;
    weatherPokemonState.textContent = `The ${form} form of Castform.`;
  } else {
    weatherPokemonState.textContent = profile.state;
  }

  if (weatherTag) weatherTag.textContent = weatherStatus[weatherCategory].label;
}

async function fetchWeather(lat, lng) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error("Unable to fetch weather data.");
  }

  return response.json();
}

async function requestWeather(lat = defaultLat, lng = defaultLng) {
  const safeCoords = normalizeLatLng(lat, lng);
  updateCoordsInputs(safeCoords.lat, safeCoords.lng);
  updateLocationTitle(safeCoords.lat, safeCoords.lng);

  setStatus("Loading weather data...");

  try {
    const data = await fetchWeather(safeCoords.lat, safeCoords.lng);
    const current = data.current;
    const daily = data.daily;
    const weatherCode = current.weather_code;
    const temperature = current.temperature_2m;
    const weatherCategory = getWeatherCategory(weatherCode);
    const timeOfDay = getTimeOfDay(
      current.time,
      daily.sunrise[0],
      daily.sunset[0],
    );

    coordsDisplay.textContent = `${safeCoords.lat.toFixed(4)}, ${safeCoords.lng.toFixed(4)}`;
    timeOfDayDisplay.textContent = timeOfDay;
    weatherDisplay.textContent = getWeatherDescription(weatherCode);
    temperatureDisplay.textContent = `${Math.round(temperature)}°C`;

    updateTimePokemon(timeOfDay);
    updateWeatherPokemon(weatherCategory);
    // Clear status message (remove 'Snowy'/'Rainy' caption)
    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(
      error.message ||
        "Weather lookup failed. Try a different coordinate or check your connection.",
      true,
    );
  }
}

function initMap() {
  const map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
  }).setView([20, 0], 2);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => map.invalidateSize()).observe(
      document.getElementById("map"),
    );
  }

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // No pin until the user picks a location
  let marker = null;

  function updateFromMap(lat, lng) {
    requestWeather(Number(lat), Number(lng));
  }

  map.on("click", function (event) {
    if (!marker) {
      marker = L.marker(event.latlng, { draggable: true }).addTo(map);
      marker.on("dragend", function () {
        const position = marker.getLatLng();
        updateFromMap(position.lat, position.lng);
      });
    } else {
      marker.setLatLng(event.latlng);
    }
    updateFromMap(event.latlng.lat, event.latlng.lng);
  });
}

if (typeof L === "undefined") {
  const mapContainer = document.getElementById("map");
  mapContainer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;color:#f3f6ff;text-align:center;">
      <div>
        <h3 style="margin-bottom:12px;">Map library not loaded</h3>
        <p style="color:#a6afd3;">Please refresh the page or check the internet connection.</p>
      </div>
    </div>
  `;
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
