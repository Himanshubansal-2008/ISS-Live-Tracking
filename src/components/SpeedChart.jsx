import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SpeedChart({ speeds }) {
  const chartRef = useRef(null);

  const data = {
    labels: speeds.map((s) => s.time),
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: speeds.map((s) => s.speed),
        borderColor: '#e07a4f',
        backgroundColor: 'rgba(224, 122, 79, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#e07a4f',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888',
          font: { family: 'Inter', size: 9 },
          maxTicksLimit: 8,
          maxRotation: 45,
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888',
          font: { family: 'Inter', size: 10 },
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
    },
    animation: { duration: 300 },
  };

  return (
    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
