const apiKey = "57b0766d3e55cde643aaa07f94391c08";
const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?&units=metric&q=`;
const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?&units=metric&q=`;

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const errorDiv = document.querySelector(".error");

// Weather icon mapping
const weatherIcons = {
  "Clouds": "clouds.png",
  "Clear": "clear.png", 
  "Rain": "rain.png",
  "Drizzle": "drizzle.png",
  "Mist": "mist.png",
  "Snow": "snow.png",
  "Wind": "wind.png",
  "Thunderstorm": "rain.png"
};

const emojiIcons = {
  "Clouds": "⛅",
  "Clear": "☀️", 
  "Rain": "🌧️",
  "Drizzle": "🌦️",
  "Mist": "🌫️",
  "Snow": "❄️",
  "Wind": "💨",
  "Thunderstorm": "⛈️"
};

// Add loading state
function showLoading() {
  searchBtn.innerHTML = '<div class="loading-spinner"></div>';
  searchBtn.disabled = true;
}

function hideLoading() {
  searchBtn.innerHTML = '<img src="search.png" alt="search" />';
  searchBtn.disabled = false;
}

// Add loading spinner CSS
const style = document.createElement('style');
style.textContent = `
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

async function checkWeather(city) {
  if (!city.trim()) {
    showError("Please enter a city name");
    return;
  }

  showLoading();
  hideError();

  try {
    // Fetch current weather and forecast data
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl + city + `&appid=${apiKey}`),
      fetch(forecastUrl + city + `&appid=${apiKey}`)
    ]);
    
    if (currentResponse.status === 404) {
      showError("City not found. Please check the spelling and try again.");
      return;
    }
    
    if (!currentResponse.ok || !forecastResponse.ok) {
      showError("Something went wrong. Please try again later.");
      return;
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    console.log("Current weather:", currentData);
    console.log("Forecast data:", forecastData);
    
    // Update main weather panel
    updateMainWeather(currentData);
    
    // Update current conditions panel
    updateCurrentConditions(currentData);
    
    // Update tomorrow's forecast
    updateTomorrowForecast(forecastData);
    
    // Update hourly forecast
    updateHourlyForecast(forecastData);
    
    // Update weekly forecast
    updateWeeklyForecast(forecastData);
    
    // Update daily cards
    updateDailyCards(forecastData);
    
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showError("Network error. Please check your connection and try again.");
  } finally {
    hideLoading();
  }
}

function updateMainWeather(data) {
  const weatherMain = data.weather[0].main;
  
  // Update weather icon
  const weatherIcon = document.querySelector(".weather-icon-large img");
  weatherIcon.src = weatherIcons[weatherMain] || "clear.png";
  
  // Update weather description
  document.querySelector(".weather-description").textContent = data.weather[0].description;
  
  // Update temperature
  document.querySelector(".current-temp").textContent = Math.round(data.main.temp) + "°";
  
  // Update temperature range
  document.querySelector(".temp-range").textContent = 
    `H:${Math.round(data.main.temp_max)}° L:${Math.round(data.main.temp_min)}°`;
  
  // Update weather details
  const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
  const rainChance = data.rain ? Math.round(data.rain["1h"] || 0) : 0;
  
  document.querySelector(".detail-item:nth-child(1) .detail-text").textContent = `${windSpeed}km/h Wind`;
  document.querySelector(".detail-item:nth-child(2) .detail-text").textContent = `${rainChance}% Chance of Rain`;
  document.querySelector(".detail-item:nth-child(3) .detail-text").textContent = `${data.main.humidity}% Humidity`;
}

function updateCurrentConditions(data) {
  const weatherMain = data.weather[0].main;
  
  // Update weather icon
  const weatherIcon = document.querySelector(".current-conditions-panel .weather-icon-small img");
  weatherIcon.src = weatherIcons[weatherMain] || "clear.png";
  
  // Update temperature
  document.querySelector(".temp-small").textContent = Math.round(data.main.temp) + "°";
  
  // Update feels like temperature
  document.querySelector(".feels-like").textContent = `Feels like: ${Math.round(data.main.feels_like)}°`;
  
  // Update condition text
  document.querySelector(".current-conditions-panel .condition-text").textContent = data.weather[0].description;
}

function updateTomorrowForecast(data) {
  // Get tomorrow's forecast (24 hours from now)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0); // Noon
  
  const tomorrowForecast = data.list.find(item => {
    const forecastDate = new Date(item.dt * 1000);
    return forecastDate.getDate() === tomorrow.getDate() && 
           forecastDate.getHours() === 12;
  });
  
  if (tomorrowForecast) {
    const weatherMain = tomorrowForecast.weather[0].main;
    
    // Update weather icon
    const weatherIcon = document.querySelector(".tomorrow-panel .weather-icon-small img");
    weatherIcon.src = weatherIcons[weatherMain] || "clear.png";
    
    // Update temperature range
    document.querySelector(".temp-range-small").textContent = 
      `${Math.round(tomorrowForecast.main.temp)}°/${Math.round(tomorrowForecast.main.temp)}°`;
    
    // Update condition text
    document.querySelector(".tomorrow-panel .condition-text").textContent = tomorrowForecast.weather[0].description;
  }
}

function updateHourlyForecast(data) {
  const hourlyChart = document.querySelector(".hourly-chart");
  const next5Hours = data.list.slice(0, 5);
  
  next5Hours.forEach((item, index) => {
    const hourItem = hourlyChart.children[index];
    if (hourItem) {
      const weatherMain = item.weather[0].main;
      const time = new Date(item.dt * 1000);
      const timeString = index === 0 ? "Now" : time.getHours().toString().padStart(2, '0') + ":00";
      
      hourItem.querySelector(".hour-time").textContent = timeString;
      hourItem.querySelector(".hour-icon").textContent = emojiIcons[weatherMain] || "☀️";
      hourItem.querySelector(".hour-temp").textContent = Math.round(item.main.temp) + "°";
    }
  });
}

function updateWeeklyForecast(data) {
  const weeklyList = document.querySelector(".weekly-list");
  const dailyForecasts = getDailyForecasts(data);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  dailyForecasts.forEach((day, index) => {
    const weeklyItem = weeklyList.children[index];
    if (weeklyItem) {
      const weatherMain = day.weather[0].main;
      const date = new Date(day.dt * 1000);
      const dayName = days[date.getDay()];
      
      weeklyItem.querySelector(".weekly-icon").textContent = emojiIcons[weatherMain] || "☀️";
      weeklyItem.querySelector(".weekly-day").textContent = dayName;
      weeklyItem.querySelector(".weekly-condition").textContent = day.weather[0].description;
      weeklyItem.querySelector(".weekly-temp").textContent = 
        `${Math.round(day.main.temp_max)}° ${Math.round(day.main.temp_min)}°`;
    }
  });
}

function updateDailyCards(data) {
  const dailyForecasts = getDailyForecasts(data);
  const dailyCards = document.querySelectorAll(".daily-card");
  
  // Update first two daily cards
  dailyForecasts.slice(0, 2).forEach((day, index) => {
    const card = dailyCards[index];
    if (card) {
      const weatherMain = day.weather[0].main;
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      card.querySelector(".day-temp").textContent = Math.round(day.main.temp) + "°";
      card.querySelector(".day-icon").textContent = emojiIcons[weatherMain] || "☀️";
      card.querySelector(".day-condition").textContent = day.weather[0].description;
      card.querySelector(".day-name").textContent = dayName;
    }
  });
}

function getDailyForecasts(data) {
  // Group forecasts by day and get the forecast for noon of each day
  const dailyForecasts = [];
  const processedDays = new Set();
  
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    if (!processedDays.has(dayKey) && date.getHours() === 12) {
      dailyForecasts.push(item);
      processedDays.add(dayKey);
    }
  });
  
  return dailyForecasts.slice(0, 7); // Return up to 7 days
}

function showError(message) {
  errorDiv.innerHTML = `<p>${message}</p>`;
  errorDiv.style.display = "block";
}

function hideError() {
  errorDiv.style.display = "none";
}

// Event listeners
searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value.trim());
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkWeather(searchBox.value.trim());
  }
});

// Add focus effect to search input
searchBox.addEventListener("focus", () => {
  searchBox.style.transform = "translateY(-2px)";
});

searchBox.addEventListener("blur", () => {
  searchBox.style.transform = "translateY(0)";
});

// Initialize with default city
checkWeather("London");
