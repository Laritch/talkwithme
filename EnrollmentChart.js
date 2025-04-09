import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const EnrollmentChart = ({ enrollmentData = [], period = '30days', isDarkMode = false }) => {
  const [options, setOptions] = useState({});
  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (!enrollmentData || enrollmentData.length === 0) {
      return;
    }

    // Format the enrollment data for ApexCharts
    const formattedDates = enrollmentData.map(item => item.date);
    const enrollmentCounts = enrollmentData.map(item => item.count);

    // Create series for the chart
    const newSeries = [
      {
        name: 'New Students',
        data: enrollmentCounts
      }
    ];

    // Create chart options
    const newOptions = {
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return val.toFixed(0);
          },
          style: {
            colors: isDarkMode ? '#d1d5db' : '#64748b'
          }
        },
        title: {
          text: 'New Enrollments',
          style: {
            color: isDarkMode ? '#d1d5db' : '#64748b'
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
            day: 'dd MMM',
            hour: 'HH:mm'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      tooltip: {
        x: {
          format: getPeriodFormat(period)
        },
        theme: isDarkMode ? 'dark' : 'light'
      },
      grid: {
        borderColor: isDarkMode ? '#374151' : '#e2e8f0',
        strokeDashArray: 5,
        position: 'back'
      },
      colors: ['#3b82f6'],
      theme: {
        mode: isDarkMode ? 'dark' : 'light'
      }
    };

    setOptions(newOptions);
    setSeries(newSeries);
  }, [enrollmentData, period, isDarkMode]);

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

  if (!enrollmentData || enrollmentData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-80 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No enrollment data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Student Enrollment Trends</h3>
      <div className="enrollment-chart-container">
        {typeof window !== 'undefined' && (
          <Chart
            options={options}
            series={series}
            type="area"
            height={320}
          />
        )}
      </div>
    </div>
  );
};

export default EnrollmentChart;
