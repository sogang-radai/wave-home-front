export function BarChart({ data }) {
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div key={item.label}>
          {item.turtleNeck !== undefined && <b className="bar-chart-note">거북목 {item.turtleNeck}회</b>}
          <i style={{ height: `${item.value}%` }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
