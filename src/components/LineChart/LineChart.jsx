import React, { useState, useEffect } from 'react';
import Chart from 'react-google-charts';

const LineChart = ({ historicalData }) => {
  const [data, setData] = useState([["Date", "Prices"]]);

  useEffect(() => {
    if (!historicalData) return;
    
    const chartData = [["Date", "Prices"], 
      ...historicalData.prices.map(item => [
        `${new Date(item[0]).toLocaleDateString().slice(0, -5)}`, 
        item[1]
      ])
    ];
    
    setData(chartData);
  }, [historicalData]);

  return (
    <div>
      <Chart
        chartType='LineChart'
        data={data}
        height="100%"
        legendToggle
      />
    </div>
  );
};

export default LineChart;