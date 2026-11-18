import WeatherMoodWidget from "./WeatherMoodWidget";

function App() {
  return (
    <div>
      <h1>React Emoji Click Counter</h1>

      <WeatherMoodWidget weather="😆 Happy" />
      <WeatherMoodWidget weather="👍 Like" />
      <WeatherMoodWidget weather="❤️ Love" />
      <WeatherMoodWidget weather="😢 Sad" />
    </div>
  );
}

export default App;