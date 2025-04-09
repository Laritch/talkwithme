import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register the Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Mock data types
interface UserStat {
  id: string;
  name: string;
  role: string;
  messagesCount: number;
  averageResponseTime: number;
  activeHours: number;
  lastActive: string;
}

interface ChatMetrics {
  totalChats: number;
  activeChats: number;
  completedChats: number;
  avgChatDuration: number;
  avgMessagesPerChat: number;
}

interface TimeSeriesData {
  date: string;
  messageCount: number;
  activeUsers: number;
  newChats: number;
}

// Mock data for demonstration
const mockUserStats: UserStat[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Instructor',
    messagesCount: 450,
    averageResponseTime: 2.5,
    activeHours: 42,
    lastActive: '2025-04-08T10:30:00',
  },
  {
    id: '2',
    name: 'Emily Johnson',
    role: 'Student',
    messagesCount: 320,
    averageResponseTime: 5.2,
    activeHours: 36,
    lastActive: '2025-04-07T14:45:00',
  },
  {
    id: '3',
    name: 'Michael Chen',
    role: 'Instructor',
    messagesCount: 510,
    averageResponseTime: 1.8,
    activeHours: 48,
    lastActive: '2025-04-08T09:15:00',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    role: 'Student',
    messagesCount: 290,
    averageResponseTime: 4.7,
    activeHours: 32,
    lastActive: '2025-04-06T16:20:00',
  },
  {
    id: '5',
    name: 'Robert Davis',
    role: 'Instructor',
    messagesCount: 380,
    averageResponseTime: 3.1,
    activeHours: 45,
    lastActive: '2025-04-07T11:10:00',
  },
];

const mockChatMetrics: ChatMetrics = {
  totalChats: 867,
  activeChats: 124,
  completedChats: 743,
  avgChatDuration: 14.2, // minutes
  avgMessagesPerChat: 18.5,
};

const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 13 + i);
  return {
    date: date.toISOString().split('T')[0],
    messageCount: Math.floor(Math.random() * 200) + 100,
    activeUsers: Math.floor(Math.random() * 40) + 20,
    newChats: Math.floor(Math.random() * 30) + 5,
  };
});

// Chart colors
const chartColors = {
  primary: '#2c3e50',
  secondary: '#3498db',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#1abc9c',
  light: '#ecf0f1',
  dark: '#34495e',
  transparent: 'rgba(255, 255, 255, 0)',
};

// Date formatter
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | '90d'>('14d');
  const [activeMetric, setActiveMetric] = useState<'messages' | 'users' | 'chats'>('messages');

  // Filter time series data based on selected range
  const filteredData = (): TimeSeriesData[] => {
    const numberOfDays = timeRange === '7d'
      ? 7
      : timeRange === '14d'
        ? 14
        : timeRange === '30d'
          ? 30
          : 90;

    return mockTimeSeriesData.slice(-numberOfDays);
  };

  // Prepare time series chart data
  const timeSeriesChartData = {
    labels: filteredData().map(d => formatDate(d.date)),
    datasets: [
      {
        label: activeMetric === 'messages'
          ? 'Messages'
          : activeMetric === 'users'
            ? 'Active Users'
            : 'New Chats',
        data: filteredData().map(d =>
          activeMetric === 'messages'
            ? d.messageCount
            : activeMetric === 'users'
              ? d.activeUsers
              : d.newChats
        ),
        fill: true,
        backgroundColor: `${chartColors.primary}20`,
        borderColor: chartColors.primary,
        tension: 0.4,
      },
    ],
  };

  // User role distribution chart data
  const roleDistributionData = {
    labels: ['Instructors', 'Students'],
    datasets: [
      {
        data: [
          mockUserStats.filter(user => user.role === 'Instructor').length,
          mockUserStats.filter(user => user.role === 'Student').length,
        ],
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
        ],
        borderColor: [
          chartColors.primary,
          chartColors.secondary,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chat status distribution chart data
  const chatStatusData = {
    labels: ['Active', 'Completed'],
    datasets: [
      {
        data: [
          mockChatMetrics.activeChats,
          mockChatMetrics.completedChats,
        ],
        backgroundColor: [
          chartColors.warning,
          chartColors.success,
        ],
        borderColor: [
          chartColors.warning,
          chartColors.success,
        ],
        borderWidth: 1,
      },
    ],
  };

  // User activity chart data (top 5 users by message count)
  const userActivityData = {
    labels: mockUserStats.map(user => user.name),
    datasets: [
      {
        label: 'Messages Sent',
        data: mockUserStats.map(user => user.messagesCount),
        backgroundColor: chartColors.info,
      },
    ],
  };

  // Chart options
  const timeSeriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${activeMetric === 'messages'
            ? 'Message Volume'
            : activeMetric === 'users'
              ? 'Active Users'
              : 'New Conversations'} (Last ${timeRange === '7d'
              ? '7 days'
              : timeRange === '14d'
                ? '14 days'
                : timeRange === '30d'
                  ? '30 days'
                  : '90 days'})`,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Activity (Messages Sent)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="analytics-dashboard">
      <Head>
        <title>Analytics Dashboard | Instructor Chat System</title>
      </Head>

      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p className="dashboard-description">
          Monitor chat activity, user engagement, and system performance
        </p>
      </header>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Chats</h3>
          <div className="stat-value">{mockChatMetrics.totalChats}</div>
        </div>
        <div className="stat-card">
          <h3>Active Chats</h3>
          <div className="stat-value">{mockChatMetrics.activeChats}</div>
        </div>
        <div className="stat-card">
          <h3>Avg. Duration</h3>
          <div className="stat-value">{mockChatMetrics.avgChatDuration} min</div>
        </div>
        <div className="stat-card">
          <h3>Avg. Messages</h3>
          <div className="stat-value">{mockChatMetrics.avgMessagesPerChat}</div>
        </div>
      </div>

      <div className="chart-controls">
        <div className="control-group">
          <label>Time Range:</label>
          <div className="button-group">
            <button
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              className={timeRange === '14d' ? 'active' : ''}
              onClick={() => setTimeRange('14d')}
            >
              14 Days
            </button>
            <button
              className={timeRange === '30d' ? 'active' : ''}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button
              className={timeRange === '90d' ? 'active' : ''}
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Metric:</label>
          <div className="button-group">
            <button
              className={activeMetric === 'messages' ? 'active' : ''}
              onClick={() => setActiveMetric('messages')}
            >
              Messages
            </button>
            <button
              className={activeMetric === 'users' ? 'active' : ''}
              onClick={() => setActiveMetric('users')}
            >
              Active Users
            </button>
            <button
              className={activeMetric === 'chats' ? 'active' : ''}
              onClick={() => setActiveMetric('chats')}
            >
              New Chats
            </button>
          </div>
        </div>
      </div>

      <div className="chart-row main-chart">
        <div className="chart-container">
          <Line data={timeSeriesChartData} options={timeSeriesOptions} />
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container">
          <h2>User Roles</h2>
          <div className="chart-wrapper">
            <Pie data={roleDistributionData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h2>Chat Status</h2>
          <div className="chart-wrapper">
            <Doughnut data={chatStatusData} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container full-width">
          <h2>User Activity</h2>
          <Bar data={userActivityData} options={barOptions} />
        </div>
      </div>

      <div className="chart-row">
        <div className="table-container">
          <h2>Top Users</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Messages</th>
                  <th>Avg Response</th>
                  <th>Active Hours</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {mockUserStats.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.messagesCount}</td>
                    <td>{user.averageResponseTime} min</td>
                    <td>{user.activeHours} hrs</td>
                    <td>
                      {new Date(user.lastActive).toLocaleDateString()}
                      {' '}
                      {new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .analytics-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .dashboard-description {
          color: #7f8c8d;
          font-size: 1.1rem;
          margin: 0;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card h3 {
          font-size: 1rem;
          color: #7f8c8d;
          margin: 0 0 0.5rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .chart-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 2rem;
          background-color: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-weight: 500;
          color: #2c3e50;
        }

        .button-group {
          display: flex;
          border-radius: 4px;
          overflow: hidden;
        }

        .button-group button {
          padding: 0.5rem 1rem;
          border: none;
          background-color: #f7f9fa;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .button-group button:not(:last-child) {
          border-right: none;
        }

        .button-group button.active {
          background-color: #2c3e50;
          color: white;
          border-color: #2c3e50;
        }

        .chart-row {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .chart-container {
          flex: 1;
          min-width: 300px;
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-container h2 {
          font-size: 1.25rem;
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .chart-wrapper {
          width: 100%;
          height: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .main-chart .chart-container {
          flex-basis: 100%;
          min-height: 350px;
        }

        .full-width {
          flex-basis: 100%;
        }

        .table-container {
          flex-basis: 100%;
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: 0.75rem 1rem;
          text-align: left;
        }

        .data-table th {
          background-color: #f7fafc;
          color: #4a5568;
          font-weight: 600;
          border-bottom: 2px solid #edf2f7;
        }

        .data-table tr:not(:last-child) td {
          border-bottom: 1px solid #edf2f7;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-badge.instructor {
          background-color: #ebf4ff;
          color: #3182ce;
        }

        .role-badge.student {
          background-color: #fefcbf;
          color: #d69e2e;
        }

        @media (max-width: 768px) {
          .analytics-dashboard {
            padding: 1rem;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .chart-row {
            flex-direction: column;
            gap: 1rem;
          }

          .chart-container {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
