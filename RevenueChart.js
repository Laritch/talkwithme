import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const RevenueChart = ({ revenueData = [], period = '30days', isDarkMode = false }) => {
  const [options, setOptions] = useState({});
  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (!revenueData || revenueData.length === 0) {
      return;
    }

    // Format the revenue data for ApexCharts
    const formattedDates = revenueData.map(item => item.date);
    const revenueAmounts = revenueData.map(item => parseFloat(item.amount));

    // Create series for the chart
    const newSeries = [
      {
        name: 'Revenue',
        data: revenueAmounts
      }
    ];

    // Create chart options
    const newOptions = {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 2
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      yaxis: {
        title: {
          text: 'Revenue (USD)',
          style: {
            color: isDarkMode ? '#d1d5db' : '#64748b'
          }
        },
        labels: {
          formatter: function (val) {
            return '$' + val.toFixed(2);
          },
          style: {
            colors: isDarkMode ? '#d1d5db' : '#64748b'
          }
        }
      },
      xaxis: {
        categories: formattedDates,
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#d1d5db' : '#64748b'
          },
          datetimeFormatter: {
            year: 'yyyy',
            month: "MMM 'yy",
            day: 'dd MMM'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      fill: {
        opacity: 1,
        colors: ['#10b981']
      },
      tooltip: {
        x: {
          format: getPeriodFormat(period)
        },
        y: {
          formatter: function (val) {
            return '$' + val.toFixed(2);
          }
        },
        theme: isDarkMode ? 'dark' : 'light'
      },
      grid: {
        borderColor: isDarkMode ? '#374151' : '#e2e8f0',
        strokeDashArray: 4
      },
      theme: {
        mode: isDarkMode ? 'dark' : 'light'
      }
    };

    setOptions(newOptions);
    setSeries(newSeries);
  }, [revenueData, period, isDarkMode]);

  function getPeriodFormat(period) {
    switch(period) {
      case '7days':
      case '30days':
        return 'dd MMM';
      case '90days':
        return "dd MMM 'yy";
      case 'year':
        return "MMM 'yy";
      default:
        return 'dd MMM';
    }
  }

  const getTotalRevenue = () => {
    if (!revenueData || revenueData.length === 0) return 0;
    return revenueData.reduce((total, item) => total + parseFloat(item.amount), 0).toFixed(2);
  };

  const getAverageRevenue = () => {
    if (!revenueData || revenueData.length === 0) return 0;
    return (revenueData.reduce((total, item) => total + parseFloat(item.amount), 0) / revenueData.length).toFixed(2);
  };

  if (!revenueData || revenueData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-80 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Revenue</h3>
        <div className="flex space-x-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">${getTotalRevenue()}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Average: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">${getAverageRevenue()}/day</span>
          </div>
        </div>
      </div>
      <div className="revenue-chart-container">
        {typeof window !== 'undefined' && (
          <Chart
            options={options}
            series={series}
            type="bar"
            height={320}
          />
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
