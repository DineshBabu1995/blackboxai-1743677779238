// DOM Elements
const weatherDisplay = document.getElementById('weatherDisplay');
const locationElement = document.getElementById('location');
const currentTempElement = document.getElementById('currentTemp');
const weatherConditionElement = document.getElementById('weatherCondition');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('windSpeed');
const feelsLikeElement = document.getElementById('feelsLike');
const errorMessageElement = document.getElementById('errorMessage');
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const unitToggle = document.getElementById('unitToggle');
const geolocationToggle = document.getElementById('geolocationToggle');
const apiKeyInput = document.getElementById('apiKey');
const saveSettingsBtn = document.getElementById('saveSettings');

// App State
let settings = {
    unit: 'metric', // 'metric' for Celsius, 'imperial' for Fahrenheit
    useGeolocation: true,
    apiKey: ''
};

// Weather condition icons mapping
const weatherIcons = {
    '01d': 'fas fa-sun',          // clear sky (day)
    '01n': 'fas fa-moon',         // clear sky (night)
    '02d': 'fas fa-cloud-sun',    // few clouds (day)
    '02n': 'fas fa-cloud-moon',   // few clouds (night)
    '03d': 'fas fa-cloud',        // scattered clouds
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',        // broken clouds
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',   // shower rain
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain', // rain (day)
    '10n': 'fas fa-cloud-moon-rain',// rain (night)
    '11d': 'fas fa-bolt',         // thunderstorm
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',    // snow
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',         // mist
    '50n': 'fas fa-smog'
};

// Initialize the app
function init() {
    loadSettings();
    setupEventListeners();
    
    if (window.location.pathname.endsWith('index.html')) {
        if (settings.useGeolocation) {
            getLocation();
        } else {
            fetchWeatherByLocation('London'); // Default location
        }
    }
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('weatherAppSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        // Update UI to reflect settings
        if (unitToggle) unitToggle.checked = settings.unit === 'imperial';
        if (geolocationToggle) geolocationToggle.checked = settings.useGeolocation;
        if (apiKeyInput) apiKeyInput.value = settings.apiKey || '';
    }
}

// Save settings to localStorage
function saveSettings() {
    settings.unit = unitToggle.checked ? 'imperial' : 'metric';
    settings.useGeolocation = geolocationToggle.checked;
    settings.apiKey = apiKeyInput.value.trim();
    
    localStorage.setItem('weatherAppSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
    
    // Refresh weather data if on main page
    if (window.location.pathname.endsWith('index.html')) {
        if (settings.useGeolocation) {
            getLocation();
        } else {
            fetchWeatherByLocation('London');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    if (searchBtn) searchBtn.addEventListener('click', () => {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeatherByLocation(location);
        }
    });

    if (locationInput) locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const location = locationInput.value.trim();
            if (location) {
                fetchWeatherByLocation(location);
            }
        }
    });

    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
}

// Get user's current location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Geolocation error: ' + error.message);
                fetchWeatherByLocation('London'); // Fallback to default location
            }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
        fetchWeatherByLocation('London'); // Fallback to default location
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    if (!settings.apiKey) {
        showError('Please set your API key in Settings first');
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${settings.unit}&appid=${settings.apiKey}`
        );
        const data = await response.json();
        
        if (data.cod === 401) {
            showError('Invalid API key. Please check your key in Settings');
            return;
        }
        
        displayWeather(data);
    } catch (error) {
        showError('Failed to fetch weather data: ' + error.message);
    }
}

// Fetch weather by location name
async function fetchWeatherByLocation(location) {
    if (!settings.apiKey) {
        showError('Please set your API key in Settings first');
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${settings.unit}&appid=${settings.apiKey}`
        );
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        showError('Failed to fetch weather data: ' + error.message);
    }
}

// Display weather data
function displayWeather(data) {
    if (data.cod !== 200) {
        showError(data.message || 'Unknown error occurred');
        return;
    }

    // Update location
    locationElement.textContent = `${data.name}, ${data.sys.country}`;

    // Update temperature
    const temp = Math.round(data.main.temp);
    currentTempElement.textContent = `${temp}°${settings.unit === 'metric' ? 'C' : 'F'}`;

    // Update weather condition
    const weather = data.weather[0];
    const iconClass = weatherIcons[weather.icon] || 'fas fa-question-circle';
    weatherConditionElement.innerHTML = `
        <i class="${iconClass} text-4xl"></i>
        <div class="text-lg mt-2">${weather.description}</div>
    `;

    // Update additional info
    humidityElement.textContent = `${data.main.humidity}%`;
    windSpeedElement.textContent = `${Math.round(data.wind.speed)} ${settings.unit === 'metric' ? 'km/h' : 'mph'}`;
    
    const feelsLike = Math.round(data.main.feels_like);
    feelsLikeElement.textContent = `${feelsLike}°${settings.unit === 'metric' ? 'C' : 'F'}`;

    // Update background based on weather
    updateBackground(weather.icon);

    // Hide error message if showing
    errorMessageElement.classList.add('hidden');
}

// Update background based on weather condition
function updateBackground(iconCode) {
    const backgrounds = {
        '01d': 'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg', // clear sky (day)
        '01n': 'https://images.pexels.com/photos/355465/pexels-photo-355465.jpeg', // clear sky (night)
        '02d': 'https://images.pexels.com/photos/912364/pexels-photo-912364.jpeg', // few clouds (day)
        '02n': 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg', // few clouds (night)
        '03': 'https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg', // scattered clouds
        '04': 'https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg', // broken clouds
        '09': 'https://images.pexels.com/photos/39811/pexels-photo-39811.jpeg', // shower rain
        '10': 'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg', // rain
        '11': 'https://images.pexels.com/photos/53459/lightning-storm-weather-sky-53459.jpeg', // thunderstorm
        '13': 'https://images.pexels.com/photos/2114014/pexels-photo-2114014.jpeg', // snow
        '50': 'https://images.pexels.com/photos/807598/pexels-photo-807598.jpeg' // mist
    };

    const backgroundKey = iconCode.startsWith('03') || iconCode.startsWith('04') ? iconCode.substring(0, 2) : iconCode;
    const backgroundUrl = backgrounds[backgroundKey] || backgrounds['01d'];
    
    document.body.style.backgroundImage = `url(${backgroundUrl})`;
}

// Show error message
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);