/**
 * Category Analytics JavaScript
 * Specialized analytics for Nutrition expertise category
 */

// Chart colors with transparency
const chartColors = {
  blue: 'rgba(54, 162, 235, 1)',
  blueTransparent: 'rgba(54, 162, 235, 0.2)',
  green: 'rgba(75, 192, 192, 1)',
  greenTransparent: 'rgba(75, 192, 192, 0.2)',
  yellow: 'rgba(255, 206, 86, 1)',
  yellowTransparent: 'rgba(255, 206, 86, 0.2)',
  red: 'rgba(255, 99, 132, 1)',
  redTransparent: 'rgba(255, 99, 132, 0.2)',
  purple: 'rgba(153, 102, 255, 1)',
  purpleTransparent: 'rgba(153, 102, 255, 0.2)',
  orange: 'rgba(255, 159, 64, 1)',
  orangeTransparent: 'rgba(255, 159, 64, 0.2)',
  teal: 'rgba(0, 128, 128, 1)',
  tealTransparent: 'rgba(0, 128, 128, 0.2)',
  pink: 'rgba(255, 105, 180, 1)',
  pinkTransparent: 'rgba(255, 105, 180, 0.2)',
  grey: 'rgba(201, 203, 207, 1)',
  greyTransparent: 'rgba(201, 203, 207, 0.2)'
};

// Chart instances
let revenueChart;
let demographicsChart;
let consultationTimeChart;
let durationChart;
let topicsChart;
let trendingTopicsChart;
let feedbackThemesChart;

// Date range settings
let dateRange = {
  start: new Date(new Date().setDate(new Date().getDate() - 30)),
  end: new Date(),
  displayText: 'Last 30 Days'
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initDateRangePicker();
  initCharts();

  // Add export functionality
  document.getElementById('exportBtn').addEventListener('click', () => {
    alert('Exporting report as PDF...');
    // In a real application, this would trigger a PDF export
  });
});

// Initialize tab navigation
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activate clicked tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab') + '-tab';
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
}

// Initialize Flatpickr date range picker
function initDateRangePicker() {
  const dateRangeBtn = document.getElementById('dateRangeBtn');

  // Initialize flatpickr
  const picker = flatpickr(dateRangeBtn, {
    mode: 'range',
    dateFormat: 'M d, Y',
    defaultDate: [dateRange.start, dateRange.end],
    onChange: (selectedDates) => {
      if (selectedDates.length === 2) {
        dateRange.start = selectedDates[0];
        dateRange.end = selectedDates[1];

        // Calculate difference in days
        const diffTime = Math.abs(dateRange.end - dateRange.start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update button text
        dateRange.displayText = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
        dateRangeBtn.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateRange.displayText}`;

        // Refresh data with new date range
        refreshData();
      }
    }
  });
}

// Format date to MMM dd, yyyy
function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Refresh data with current date range
function refreshData() {
  // In a real application, this would fetch new data from the API
  // For now, we'll just reinitialize the charts with mock data
  initCharts();
}

// Initialize all charts
function initCharts() {
  initRevenueChart();
  initDemographicsChart();
  initConsultationTimeChart();
  initDurationChart();
  initTopicsChart();
  initTrendingTopicsChart();
  initFeedbackThemesChart();

  // Add event listener for revenue timeframe select
  document.getElementById('revenueTimeframe')?.addEventListener('change', (e) => {
    updateRevenueChartByTimeframe(e.target.value);
  });
}

// Initialize revenue chart
function initRevenueChart() {
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (revenueChart) {
    revenueChart.destroy();
  }

  // Monthly revenue data for Nutrition category (mock data)
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [25800, 27500, 29200, 30800, 32500, 34100, 35700, 37400, 39000, 40600, 42300, 43900]
  };

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Revenue',
        data: monthlyData.values,
        borderColor: chartColors.green,
        backgroundColor: chartColors.greenTransparent,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

// Update revenue chart based on selected timeframe
function updateRevenueChartByTimeframe(timeframe) {
  if (!revenueChart) return;

  let labels = [];
  let values = [];

  switch (timeframe) {
    case 'daily':
      // Generate daily data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Generate random daily revenue between 900 and 1500
        values.push(Math.floor(Math.random() * 600) + 900);
      }
      break;

    case 'weekly':
      // Generate weekly data for the last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        labels.push(`Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);

        // Generate random weekly revenue between 6000 and 9000
        values.push(Math.floor(Math.random() * 3000) + 6000);
      }
      break;

    case 'monthly':
    default:
      // Use default monthly data
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      values = [25800, 27500, 29200, 30800, 32500, 34100, 35700, 37400, 39000, 40600, 42300, 43900];
      break;
  }

  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = values;
  revenueChart.update();
}

// Initialize demographics chart
function initDemographicsChart() {
  const ctx = document.getElementById('demographicsChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (demographicsChart) {
    demographicsChart.destroy();
  }

  // Age distribution data (mock data)
  const demographicsData = {
    labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    values: [15, 28, 24, 18, 10, 5]
  };

  demographicsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: demographicsData.labels,
      datasets: [{
        data: demographicsData.values,
        backgroundColor: [
          chartColors.blue,
          chartColors.green,
          chartColors.yellow,
          chartColors.orange,
          chartColors.purple,
          chartColors.red
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      }
    }
  });
}

// Initialize consultation time chart
function initConsultationTimeChart() {
  const ctx = document.getElementById('consultationTimeChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (consultationTimeChart) {
    consultationTimeChart.destroy();
  }

  // Consultation time data (mock data)
  const timeData = {
    labels: ['6-8 AM', '8-10 AM', '10-12 PM', '12-2 PM', '2-4 PM', '4-6 PM', '6-8 PM', '8-10 PM'],
    values: [28, 52, 76, 43, 65, 89, 54, 20]
  };

  consultationTimeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timeData.labels,
      datasets: [{
        label: 'Consultations',
        data: timeData.values,
        backgroundColor: chartColors.blueTransparent,
        borderColor: chartColors.blue,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Consultations'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time of Day'
          }
        }
      }
    }
  });
}

// Initialize duration chart
function initDurationChart() {
  const ctx = document.getElementById('durationChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (durationChart) {
    durationChart.destroy();
  }

  // Duration distribution data (mock data)
  const durationData = {
    labels: ['< 15 mins', '15-30 mins', '30-45 mins', '45-60 mins', '60-90 mins', '> 90 mins'],
    values: [5, 18, 42, 25, 8, 2]
  };

  durationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: durationData.labels,
      datasets: [{
        label: 'Consultations',
        data: durationData.values,
        backgroundColor: chartColors.greenTransparent,
        borderColor: chartColors.green,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${value} consultations (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Consultations'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Duration'
          }
        }
      }
    }
  });
}

// Initialize topics chart
function initTopicsChart() {
  const ctx = document.getElementById('topicsChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (topicsChart) {
    topicsChart.destroy();
  }

  // Topics data (mock data)
  const topicsData = {
    labels: ['Weight Management', 'Meal Planning', 'Sports Nutrition', 'Plant-based Diets', 'Metabolic Health', 'Intermittent Fasting', 'Food Allergies'],
    values: [124, 98, 86, 79, 65, 54, 42]
  };

  topicsChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: topicsData.labels,
      datasets: [{
        data: topicsData.values,
        backgroundColor: [
          chartColors.greenTransparent,
          chartColors.blueTransparent,
          chartColors.yellowTransparent,
          chartColors.purpleTransparent,
          chartColors.orangeTransparent,
          chartColors.tealTransparent,
          chartColors.pinkTransparent
        ],
        borderColor: [
          chartColors.green,
          chartColors.blue,
          chartColors.yellow,
          chartColors.purple,
          chartColors.orange,
          chartColors.teal,
          chartColors.pink
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10
          }
        }
      }
    }
  });
}

// Initialize trending topics chart
function initTrendingTopicsChart() {
  const ctx = document.getElementById('trendingTopicsChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (trendingTopicsChart) {
    trendingTopicsChart.destroy();
  }

  // Trending topics data (mock data - growth rate in percentage)
  const trendingData = {
    labels: ['Gut Health', 'Anti-inflammatory Diet', 'Personalized Nutrition', 'Mental Health & Nutrition', 'Nutrition for Aging', 'Keto Diet', 'Sustainable Eating'],
    values: [38, 35, 29, 24, 22, 18, 15]
  };

  trendingTopicsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: trendingData.labels,
      datasets: [{
        label: 'Growth Rate (%)',
        data: trendingData.values,
        backgroundColor: chartColors.orangeTransparent,
        borderColor: chartColors.orange,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Growth Rate (%)'
          }
        }
      }
    }
  });
}

// Initialize feedback themes chart
function initFeedbackThemesChart() {
  const ctx = document.getElementById('feedbackThemesChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (feedbackThemesChart) {
    feedbackThemesChart.destroy();
  }

  // Feedback themes data (mock data)
  const feedbackData = {
    labels: ['Expert Knowledge', 'Practical Advice', 'Personalized Plans', 'Clear Communication', 'Responsiveness', 'Follow-up Support', 'Value for Money'],
    positive: [92, 88, 86, 82, 79, 75, 72],
    neutral: [6, 9, 10, 12, 14, 15, 20],
    negative: [2, 3, 4, 6, 7, 10, 8]
  };

  feedbackThemesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: feedbackData.labels,
      datasets: [
        {
          label: 'Positive',
          data: feedbackData.positive,
          backgroundColor: chartColors.greenTransparent,
          borderColor: chartColors.green,
          borderWidth: 1
        },
        {
          label: 'Neutral',
          data: feedbackData.neutral,
          backgroundColor: chartColors.blueTransparent,
          borderColor: chartColors.blue,
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: feedbackData.negative,
          backgroundColor: chartColors.redTransparent,
          borderColor: chartColors.red,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        }
      }
    }
  });
}

// Format currency values
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
