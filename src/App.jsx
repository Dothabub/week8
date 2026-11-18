import WeatherMoodWidget from "./WeatherMoodWidget";

function App() {
  return (
    <div>
      <h1>My Mood Weather Widget</h1>

      <WeatherMoodWidget weather="Sunny" />
      <WeatherMoodWidget weather="Rainy" />
      <WeatherMoodWidget weather="Cloudy" />
    </div>
  );
}

export default App;