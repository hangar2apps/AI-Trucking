"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const speedData = [
  { time: "2:18 PM", speed: 45 },
  { time: "2:20 PM", speed: 52 },
  { time: "2:22 PM", speed: 38 },
  { time: "2:24 PM", speed: 25 },
  { time: "2:26 PM", speed: 14 },
  { time: "2:28 PM", speed: 30 },
  { time: "2:30 PM", speed: 42 },
];

export function SpeedChart() {
  return (
    <div className="h-48 w-full rounded-lg bg-[#1A2B4A] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={speedData}>
          <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} domain={[0, 60]} />
          <Tooltip
            contentStyle={{ background: "#1A2B4A", border: "none", color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="#0B5FFF"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
