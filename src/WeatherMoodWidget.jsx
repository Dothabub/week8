import { useState } from "react";

function WeatherMoodWidget({ weather }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>{weather}</h2>

      <button onClick={() => setCount(count + 1)}>
        Click Count: {count}
      </button>

      <hr />
    </div>
  );
}

export default WeatherMoodWidget;