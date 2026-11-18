import { useState } from "react";

function WeatherMoodWidget({ weather }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>{weather}</h2>

      <button onClick={() => setCount(count + 1)}>
        Feeling Count: {count}
      </button>
    </div>
  );
}

export default WeatherMoodWidget;