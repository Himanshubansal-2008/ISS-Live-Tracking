import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#e07a4f', '#4fc3f7', '#81c784', '#ba68c8', '#ffd54f', '#ff8a65'];

export default function NewsChart({ articles, onCategoryClick }) {
  // Count articles per category
  const counts = {};
  articles.forEach((a) => {
    const cat = a.category || 'other';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const data = {
    labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff',
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0 && onCategoryClick) {
        const idx = elements[0].index;
        onCategoryClick(labels[idx]);
      }
    },
  };

  if (articles.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No data to display</p>;
  }

  return (
    <div style={{ height: '280px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
