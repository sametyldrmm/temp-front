import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

export function PieChart({ data }) {
  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const value = Number(tooltipItem.raw);
            if (!isNaN(value)) {
              return `${tooltipItem.label}: ${value.toFixed(2)}%`;
            }
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          }
        }
      }      
    }
  };

  return <Pie data={data} options={options} />;
}
