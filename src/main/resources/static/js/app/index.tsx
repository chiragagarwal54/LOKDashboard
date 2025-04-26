// src/main/resources/static/js/app/index.tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  Cell, CartesianGrid, LabelList
} from 'recharts';

// Define our TypeScript interfaces
interface Contribution {
  date: string;
  kingdomId: string;
  totalPoints: number;
  kingdomName: string;
  continent: number;
  landId: string | null;
}

interface ContributionData {
  lastUpdated: string;
  contributions: Contribution[];
}

interface TotalContribution {
  kingdomId: string;
  kingdomName: string;
  totalPoints: number;
  continent: number;
}

interface ContributionLeaderboard {
  contributions: TotalContribution[];
}

interface LandTotalPoints {
  landId: string;
  totalPoints: number;
  owner: string;
}

interface LandLeaderboard {
  lands: LandTotalPoints[];
}

// Color palette for the charts
const COLORS = [
  '#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6',
  '#1abc9c', '#f1c40f', '#e67e22', '#34495e', '#16a085'
];

const KingdomContributionsApp: React.FC = () => {
  const [landId, setLandId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'pie' | 'bar'>('bar');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const [activeTab, setActiveTab] = useState<'kingdom' | 'leaderboard' | 'landLeaderboard'>('kingdom');
  const [leaderboardDate, setLeaderboardDate] = useState<string>(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );
  const [leaderboardData, setLeaderboardData] = useState<ContributionLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [landLeaderboardDate, setLandLeaderboardDate] = useState<string>(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );
  const [landLeaderboardData, setLandLeaderboardData] = useState<LandLeaderboard | null>(null);
  const [landLeaderboardLoading, setLandLeaderboardLoading] = useState<boolean>(false);
  const [landLeaderboardError, setLandLeaderboardError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!landId || !date) {
      setError('Please enter both Land ID and Date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/land/${landId}/${date}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      // Reset to first page when new data is loaded
      setCurrentPage(1);
    } catch (err) {
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboardData = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);

    try {
      const response = await fetch(`/land/contributionLeaderboard/${leaderboardDate}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setLeaderboardData(data);
    } catch (err) {
      setLeaderboardError(`Failed to fetch leaderboard: ${err instanceof Error ? err.message : String(err)}`);
      setLeaderboardData(null);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchLandLeaderboardData = async () => {
    setLandLeaderboardLoading(true);
    setLandLeaderboardError(null);

    try {
      const response = await fetch(`/land/landLeaderboard/${landLeaderboardDate}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const rawData = await response.json();
      console.log('Land leaderboard raw data:', rawData);
      
      // Transform backend "points" property to match frontend "lands" property
      const lands = Array.isArray(rawData.points) ? rawData.points.map((point: any) => ({
        landId: point.landId || '',
        totalPoints: typeof point.totalPoints === 'number' 
          ? point.totalPoints 
          : (parseFloat(point.totalPoints) || 0),
        owner: point.owner || ''
      })) : [];
      
      console.log('Processed land data:', lands);
      setLandLeaderboardData({ lands });
    } catch (err) {
      console.error('Land leaderboard error:', err);
      setLandLeaderboardError(`Failed to fetch land leaderboard: ${err instanceof Error ? err.message : String(err)}`);
      setLandLeaderboardData(null);
    } finally {
      setLandLeaderboardLoading(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length || !payload[0]) {
      return null;
    }
    
    const data = payload[0].payload || {};
    const value = payload[0].value || 0;
    const name = payload[0].name || '';

    return (
      <div className="custom-tooltip" style={{
        backgroundColor: '#fff',
        padding: '12px 15px',
        border: '1px solid #e0e6ed',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontFamily: '"Roboto", "Segoe UI", Arial, sans-serif',
        minWidth: '180px'
      }}>
        {data.kingdomName ? (
          <p className="kingdom" style={{ 
            margin: '0 0 8px 0',
            fontWeight: '600',
            fontSize: '15px',
            color: '#334155',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '5px'
          }}>{data.kingdomName}</p>
        ) : data.landId ? (
          <p className="land" style={{ 
            margin: '0 0 8px 0',
            fontWeight: '600',
            fontSize: '15px',
            color: '#334155',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '5px'
          }}>Land: {data.landId}</p>
        ) : (
          <p className="name" style={{ 
            margin: '0 0 8px 0',
            fontWeight: '600',
            fontSize: '15px',
            color: '#334155',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '5px'
          }}>{name}</p>
        )}
        <p className="points" style={{ 
          margin: '6px 0',
          fontSize: '14px',
          color: '#475569',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Points:</span> 
          <span style={{ 
            fontWeight: '700',
            color: '#3498db',
            backgroundColor: '#ebf5ff',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>{value.toLocaleString()}</span>
        </p>
        {data.continent !== undefined && (
          <p className="continent" style={{ 
            margin: '6px 0',
            fontSize: '14px',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Continent:</span> 
            <span style={{ 
              backgroundColor: '#f1f5f9',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: '500'
            }}>{data.continent}</span>
          </p>
        )}
        {data.owner && (
          <p className="owner" style={{ 
            margin: '6px 0',
            fontSize: '14px',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Owner:</span> 
            <span title={data.owner} style={{ 
              fontFamily: 'monospace',
              backgroundColor: '#f1f5f9',
              padding: '2px 8px',
              borderRadius: '4px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{shortenAddress(data.owner)}</span>
          </p>
        )}
      </div>
    );
  };

  // Function to calculate total points from all kingdoms
  const calculateTotalPoints = () => {
    if (!data?.contributions || data.contributions.length === 0) return 0;
    return data.contributions.reduce((sum, item) => sum + item.totalPoints, 0);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get data for visualization (limited to top 10 if more than 10 kingdoms)
  const getVisualizationData = () => {
    if (!data?.contributions || data.contributions.length === 0) return [];

    // If 10 or fewer kingdoms, show all
    if (data.contributions.length <= 10) return data.contributions;

    // Otherwise, show only top 10 by total points
    return [...data.contributions]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);
  };

  // Get paginated data for the table
  const getPaginatedData = () => {
    if (!data?.contributions || data.contributions.length === 0) return [];

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return data.contributions.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = data?.contributions ? Math.ceil(data.contributions.length / rowsPerPage) : 0;

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, current page and surrounding pages, and last page
      pageNumbers.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Format a wallet address to a shorter form (0x1234...5678)
  const shortenAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Visualization data (limited to top 10 if necessary)
  const visualizationData = getVisualizationData();

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboardData();
    } else if (activeTab === 'landLeaderboard') {
      fetchLandLeaderboardData();
    }
  }, [activeTab, leaderboardDate, landLeaderboardDate]);

  // Is data limited for visualization?
  const isDataLimited = data?.contributions && data.contributions.length > 10;

  return (
    <div className="kingdom-contributions-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Roboto", "Segoe UI", Arial, sans-serif',
      color: '#333',
      backgroundColor: '#f7f9fc',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <h1 style={{
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '32px',
        fontWeight: '700',
        paddingBottom: '15px',
        borderBottom: '2px solid #e0e6ed'
      }}>
        Kingdom Contributions Dashboard
      </h1>

      <div className="tabs-container" style={{
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid #e0e6ed',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => setActiveTab('kingdom')}
          style={{
            backgroundColor: activeTab === 'kingdom' ? '#3498db' : 'transparent',
            color: activeTab === 'kingdom' ? 'white' : '#555',
            border: 'none',
            borderRadius: activeTab === 'kingdom' ? '6px 6px 0 0' : '0',
            padding: '14px 28px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '8px',
            fontWeight: activeTab === 'kingdom' ? 'bold' : 'normal',
            transition: 'all 0.3s',
            borderBottom: activeTab === 'kingdom' ? '3px solid #3498db' : 'none',
            boxShadow: activeTab === 'kingdom' ? '0 -2px 6px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Kingdom Contributions
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          style={{
            backgroundColor: activeTab === 'leaderboard' ? '#3498db' : 'transparent',
            color: activeTab === 'leaderboard' ? 'white' : '#555',
            border: 'none',
            borderRadius: activeTab === 'leaderboard' ? '6px 6px 0 0' : '0',
            padding: '14px 28px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '8px',
            fontWeight: activeTab === 'leaderboard' ? 'bold' : 'normal',
            transition: 'all 0.3s',
            borderBottom: activeTab === 'leaderboard' ? '3px solid #3498db' : 'none',
            boxShadow: activeTab === 'leaderboard' ? '0 -2px 6px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Contributions Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('landLeaderboard')}
          style={{
            backgroundColor: activeTab === 'landLeaderboard' ? '#3498db' : 'transparent',
            color: activeTab === 'landLeaderboard' ? 'white' : '#555',
            border: 'none',
            borderRadius: activeTab === 'landLeaderboard' ? '6px 6px 0 0' : '0',
            padding: '14px 28px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'landLeaderboard' ? 'bold' : 'normal',
            transition: 'all 0.3s',
            borderBottom: activeTab === 'landLeaderboard' ? '3px solid #3498db' : 'none',
            boxShadow: activeTab === 'landLeaderboard' ? '0 -2px 6px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Land Points Leaderboard
        </button>
      </div>

      {activeTab === 'kingdom' && (
        <div className="search-container" style={{
          display: 'flex',
          gap: '18px',
          marginBottom: '30px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="landId" style={{ fontWeight: '600', fontSize: '14px', color: '#555' }}>Land ID</label>
            <input
              type="text"
              id="landId"
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              placeholder="Enter Land ID"
              style={{
                padding: '12px 15px',
                borderRadius: '6px',
                border: '1px solid #e0e6ed',
                fontSize: '15px',
                width: '250px',
                transition: 'border-color 0.3s',
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
            />
          </div>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="date" style={{ fontWeight: '600', fontSize: '14px', color: '#555' }}>Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '12px 15px',
                borderRadius: '6px',
                border: '1px solid #e0e6ed',
                fontSize: '15px',
                width: '180px',
                transition: 'border-color 0.3s',
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
            />
          </div>

          <button
            onClick={fetchData}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              height: '45px',
              boxShadow: '0 2px 5px rgba(52, 152, 219, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2980b9';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(52, 152, 219, 0.3)';
            }}
          >
            Fetch Data
          </button>

          <div className="view-toggle" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#555' }}>Chart Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setViewType('bar')}
                style={{
                  backgroundColor: viewType === 'bar' ? '#3498db' : '#f1f5f9',
                  color: viewType === 'bar' ? 'white' : '#555',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: viewType === 'bar' ? '600' : 'normal',
                  transition: 'all 0.3s',
                  boxShadow: viewType === 'bar' ? '0 2px 5px rgba(52, 152, 219, 0.3)' : 'none'
                }}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setViewType('pie')}
                style={{
                  backgroundColor: viewType === 'pie' ? '#3498db' : '#f1f5f9',
                  color: viewType === 'pie' ? 'white' : '#555',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: viewType === 'pie' ? '600' : 'normal',
                  transition: 'all 0.3s',
                  boxShadow: viewType === 'pie' ? '0 2px 5px rgba(52, 152, 219, 0.3)' : 'none'
                }}
              >
                Pie Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kingdom' && error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '25px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          border: '1px solid #fecaca'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {activeTab === 'kingdom' && loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          margin: '30px 0'
        }}>
          <div className="loading-spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '16px' }}>Loading data...</p>
        </div>
      )}

      {activeTab === 'kingdom' && data && data.contributions.length > 0 && (
        <div className="results-container">
          <div className="header-info" style={{
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '22px', fontWeight: '600' }}>Contributions Summary</h2>
                <p style={{ margin: '0', fontSize: '16px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Land ID:</span> 
                  <span style={{ 
                    backgroundColor: '#f1f5f9', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>{landId}</span>
                </p>
                <p style={{ margin: '10px 0', fontSize: '16px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Date:</span> 
                  <span style={{ 
                    backgroundColor: '#f1f5f9', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>{formatDate(date)}</span>
                </p>
              </div>
              <div>
                <p style={{ margin: '0', fontSize: '16px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Total Kingdoms:</span> 
                  <span style={{ 
                    backgroundColor: '#ebf5ff', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    color: '#3498db',
                    fontWeight: '600'
                  }}>{data.contributions.length}</span>
                </p>
                <p style={{ margin: '10px 0', fontSize: '16px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Total Points:</span> 
                  <span style={{ 
                    backgroundColor: '#ebf5ff', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    color: '#3498db',
                    fontWeight: '600'
                  }}>{calculateTotalPoints().toLocaleString()}</span>
                </p>
                <p style={{ margin: '10px 0', fontSize: '16px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Last Updated:</span> 
                  <span style={{ 
                    backgroundColor: '#f1f5f9', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>{data.lastUpdated ?
                    new Date(data.lastUpdated).toLocaleString() : 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="chart-container" style={{
            height: '500px',
            marginBottom: '30px',
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '20px', 
              color: '#2c3e50',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Kingdom Contributions Visualization
            </h3>

            {isDataLimited && (
              <p style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666',
                marginBottom: '20px',
                fontStyle: 'italic',
                backgroundColor: '#f8fafc',
                padding: '8px',
                borderRadius: '4px',
                maxWidth: '600px',
                margin: '0 auto 20px'
              }}>
                Showing top 10 kingdoms by total points. See table below for all data.
              </p>
            )}

            <ResponsiveContainer width="100%" height="85%">
              {viewType === 'bar' ? (
                <BarChart
                  data={visualizationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="kingdomName"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    wrapperStyle={{ paddingBottom: '10px' }}
                  />
                  <Bar
                    dataKey="totalPoints"
                    name="Contribution Points"
                    isAnimationActive={true}
                    animationDuration={1500}
                    radius={[4, 4, 0, 0]}
                  >
                    {visualizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={visualizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="totalPoints"
                    nameKey="kingdomName"
                    isAnimationActive={true}
                    animationDuration={1500}
                  >
                    {visualizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry: any) => {
                      return (
                        <span style={{ color: entry.color, fontSize: '14px' }}>
                          {value}: {entry.payload.totalPoints.toLocaleString()}
                        </span>
                      );
                    }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="data-table" style={{
            marginBottom: '30px',
            overflowX: 'auto',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '20px', fontWeight: '600' }}>
                Contributions Table
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="rowsPerPage" style={{ fontSize: '14px', color: '#64748b' }}>Rows per page:</label>
                <select
                  id="rowsPerPage"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e6ed',
                    backgroundColor: '#f8fafc',
                    fontSize: '14px',
                    color: '#475569',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e0e6ed',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>Kingdom Name</th>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #e0e6ed',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>Total Points</th>
                  <th style={{ 
                    padding: '15px 20px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e0e6ed',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>Kingdom ID</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedData().map((contribution, index) => {
                  const globalIndex = (currentPage - 1) * rowsPerPage + index;

                  return (
                    <tr key={contribution.kingdomId} style={{
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                      borderLeft: `4px solid ${COLORS[globalIndex % COLORS.length]}`
                    }}>
                      <td style={{ 
                        padding: '15px 20px', 
                        borderBottom: '1px solid #e0e6ed',
                        color: '#334155',
                        fontWeight: '500'
                      }}>{contribution.kingdomName}</td>
                      <td style={{ 
                        padding: '15px 20px', 
                        borderBottom: '1px solid #e0e6ed', 
                        fontWeight: 'bold',
                        textAlign: 'right',
                        color: '#3498db'
                      }}>
                        {contribution.totalPoints.toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '15px 20px', 
                        borderBottom: '1px solid #e0e6ed', 
                        fontSize: '13px', 
                        fontFamily: 'monospace',
                        color: '#64748b'
                      }}>
                        {contribution.kingdomId}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                alignItems: 'center',
                gap: '10px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e6ed',
                    backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    color: currentPage === 1 ? '#94a3b8' : '#475569',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  First
                </button>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e6ed',
                    backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    color: currentPage === 1 ? '#94a3b8' : '#475569',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Prev
                </button>

                <div style={{ display: 'flex', gap: '5px' }}>
                  {getPageNumbers().map((pageNumber, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (typeof pageNumber === 'number') {
                          handlePageChange(pageNumber);
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        minWidth: '40px',
                        borderRadius: '6px',
                        border: '1px solid #e0e6ed',
                        backgroundColor: pageNumber === currentPage ? '#3498db' : 'white',
                        color: pageNumber === currentPage ? 'white' : '#475569',
                        cursor: typeof pageNumber === 'number' ? 'pointer' : 'default',
                        fontSize: '14px',
                        fontWeight: pageNumber === currentPage ? '600' : '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e6ed',
                    backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    color: currentPage === totalPages ? '#94a3b8' : '#475569',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e6ed',
                    backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    color: currentPage === totalPages ? '#94a3b8' : '#475569',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  Last
                </button>

                <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '10px' }}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kingdom' && data && data.contributions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          marginTop: '30px',
          border: '1px solid #f1f5f9'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12h8"></path>
          </svg>
          <h3 style={{ color: '#64748b', marginTop: '20px', fontSize: '20px', fontWeight: '600' }}>No contributions found</h3>
          <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '16px', maxWidth: '500px', margin: '10px auto 0' }}>
            There is no contribution data available for the selected Land ID and Date.
          </p>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginTop: '25px',
              boxShadow: '0 2px 5px rgba(52, 152, 219, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2980b9';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(52, 152, 219, 0.3)';
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard-container">
          <div className="leaderboard-controls" style={{
            display: 'flex',
            gap: '18px',
            marginBottom: '30px',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9'
          }}>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="leaderboardDate" style={{ fontWeight: '600', fontSize: '14px', color: '#555' }}>Date</label>
              <input
                type="date"
                id="leaderboardDate"
                value={leaderboardDate}
                onChange={(e) => setLeaderboardDate(e.target.value)}
                style={{
                  padding: '12px 15px',
                  borderRadius: '6px',
                  border: '1px solid #e0e6ed',
                  fontSize: '15px',
                  width: '180px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
              />
            </div>
            
            <button
              onClick={fetchLeaderboardData}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '45px',
                boxShadow: '0 2px 5px rgba(52, 152, 219, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(52, 152, 219, 0.3)';
              }}
            >
              Fetch Leaderboard
            </button>
          </div>

          {leaderboardError && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              border: '1px solid #fecaca'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {leaderboardError}
            </div>
          )}

          {leaderboardLoading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              margin: '30px 0',
              border: '1px solid #f1f5f9'
            }}>
              <div className="loading-spinner" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '20px', color: '#666', fontSize: '16px' }}>Loading leaderboard data...</p>
            </div>
          )}

          {!leaderboardLoading && leaderboardData && leaderboardData.contributions.length > 0 && (
            <div className="leaderboard-content">
              <div className="header-info" style={{
                marginBottom: '30px',
                padding: '25px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2c3e50', 
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: '600'
                }}>
                  Contributions Leaderboard
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '16px', 
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Date:</span>
                    <span style={{ 
                      backgroundColor: '#f1f5f9', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>{formatDate(leaderboardDate)}</span>
                  </p>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '16px', 
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Top Kingdoms:</span>
                    <span style={{ 
                      backgroundColor: '#ebf5ff', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      color: '#3498db',
                      fontWeight: '600'
                    }}>{leaderboardData.contributions.length}</span>
                  </p>
                </div>
              </div>

              <div className="chart-container" style={{
                height: '500px',
                marginBottom: '30px',
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                <h3 style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  color: '#2c3e50',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Top Contributing Kingdoms
                </h3>

                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={leaderboardData.contributions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="kingdomName"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                    <Bar
                      dataKey="totalPoints"
                      name="Contribution Points"
                      isAnimationActive={true}
                      animationDuration={1500}
                      radius={[4, 4, 0, 0]}
                    >
                      {leaderboardData.contributions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="leaderboard-table" style={{
                marginBottom: '30px',
                overflowX: 'auto',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                <h3 style={{ 
                  padding: '20px', 
                  margin: '0', 
                  color: '#2c3e50', 
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Leaderboard Rankings
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Rank</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Kingdom Name</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'right', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Total Points</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Continent</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Kingdom ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.contributions.map((contribution, index) => (
                      <tr key={contribution.kingdomId} style={{
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                        borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                      }}>
                        <td style={{ 
                          padding: '15px 20px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid #e0e6ed', 
                          fontWeight: 'bold',
                          color: index < 3 ? '#3498db' : '#64748b'
                        }}>
                          {index === 0 && (
                            <div style={{ 
                              backgroundColor: '#fef9c3', 
                              color: '#854d0e', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #fde047'
                            }}>1</div>
                          )}
                          {index === 1 && (
                            <div style={{ 
                              backgroundColor: '#f1f5f9', 
                              color: '#64748b', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #cbd5e1'
                            }}>2</div>
                          )}
                          {index === 2 && (
                            <div style={{ 
                              backgroundColor: '#fef2f2', 
                              color: '#b91c1c', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #fecaca'
                            }}>3</div>
                          )}
                          {index > 2 && (
                            <span>{index + 1}</span>
                          )}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          borderBottom: '1px solid #e0e6ed',
                          color: '#334155',
                          fontWeight: '500'
                        }}>
                          {contribution.kingdomName}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid #e0e6ed', 
                          fontWeight: 'bold',
                          color: '#3498db'
                        }}>
                          {contribution.totalPoints.toLocaleString()}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid #e0e6ed',
                          color: '#334155'
                        }}>
                          <span style={{ 
                            backgroundColor: '#f1f5f9', 
                            padding: '4px 10px', 
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}>{contribution.continent}</span>
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          borderBottom: '1px solid #e0e6ed', 
                          fontSize: '13px', 
                          fontFamily: 'monospace',
                          color: '#64748b'
                        }}>
                          {contribution.kingdomId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!leaderboardLoading && leaderboardData && leaderboardData.contributions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '50px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#6c757d' }}>No leaderboard data found</h3>
              <p>There is no contribution leaderboard data available for the selected date.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'landLeaderboard' && (
        <div className="land-leaderboard-container">
          <div className="land-leaderboard-controls" style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label htmlFor="landLeaderboardDate" style={{ fontWeight: 'bold', fontSize: '14px' }}>Date</label>
              <input
                type="date"
                id="landLeaderboardDate"
                value={landLeaderboardDate}
                onChange={(e) => setLandLeaderboardDate(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '16px',
                  width: '180px'
                }}
              />
            </div>
            
            <button
              onClick={fetchLandLeaderboardData}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                height: '42px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
            >
              Fetch Land Leaderboard
            </button>
          </div>

          {landLeaderboardError && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px 15px',
              borderRadius: '4px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {landLeaderboardError}
            </div>
          )}

          {landLeaderboardLoading && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="loading-spinner" style={{
                border: '5px solid #f3f3f3',
                borderTop: '5px solid #3498db',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '15px' }}>Loading land leaderboard data...</p>
            </div>
          )}

          {!landLeaderboardLoading && landLeaderboardData && landLeaderboardData.lands && landLeaderboardData.lands.length > 0 && (
            <div className="land-leaderboard-content">
              <div className="header-info" style={{
                marginBottom: '30px',
                padding: '25px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2c3e50', 
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: '600'
                }}>
                  Land Points Leaderboard
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '16px', 
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Date:</span>
                    <span style={{ 
                      backgroundColor: '#f1f5f9', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>{formatDate(landLeaderboardDate)}</span>
                  </p>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '16px', 
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Total Lands:</span>
                    <span style={{ 
                      backgroundColor: '#ebf5ff', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      color: '#3498db',
                      fontWeight: '600'
                    }}>{landLeaderboardData.lands.length}</span>
                  </p>
                </div>
              </div>

              {/* Chart view */}
              {landLeaderboardData.lands.length > 0 && (
                <div className="chart-container" style={{
                  height: '500px',
                  marginBottom: '30px',
                  backgroundColor: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #f1f5f9'
                }}>
                  <h3 style={{ 
                    textAlign: 'center', 
                    marginBottom: '20px', 
                    color: '#2c3e50',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    Lands with Most Points
                  </h3>

                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={landLeaderboardData.lands}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="landId"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                      <Bar
                        dataKey="totalPoints"
                        name="Contribution Points"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      >
                        {landLeaderboardData.lands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="land-leaderboard-table" style={{
                marginBottom: '30px',
                overflowX: 'auto',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                <h3 style={{ 
                  padding: '20px', 
                  margin: '0', 
                  color: '#2c3e50', 
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Leaderboard Rankings
                </h3>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Rank</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Land ID</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'right', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Total Points</th>
                      <th style={{ 
                        padding: '15px 20px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #e0e6ed',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landLeaderboardData.lands.map((contribution, index) => (
                      <tr key={contribution.landId || index} style={{
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                        borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                      }}>
                        <td style={{ 
                          padding: '15px 20px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid #e0e6ed', 
                          fontWeight: 'bold',
                          color: index < 3 ? '#3498db' : '#64748b'
                        }}>
                          {index === 0 && (
                            <div style={{ 
                              backgroundColor: '#fef9c3', 
                              color: '#854d0e', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #fde047'
                            }}>1</div>
                          )}
                          {index === 1 && (
                            <div style={{ 
                              backgroundColor: '#f1f5f9', 
                              color: '#64748b', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #cbd5e1'
                            }}>2</div>
                          )}
                          {index === 2 && (
                            <div style={{ 
                              backgroundColor: '#fef2f2', 
                              color: '#b91c1c', 
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: '700',
                              border: '2px solid #fecaca'
                            }}>3</div>
                          )}
                          {index > 2 && (
                            <span>{index + 1}</span>
                          )}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          borderBottom: '1px solid #e0e6ed',
                          color: '#334155',
                          fontWeight: '500',
                          fontFamily: 'monospace'
                        }}>
                          {contribution.landId || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid #e0e6ed', 
                          fontWeight: 'bold',
                          color: '#3498db'
                        }}>
                          {typeof contribution.totalPoints === 'number' ? contribution.totalPoints.toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '15px 20px', 
                          borderBottom: '1px solid #e0e6ed'
                        }}>
                          {contribution.owner ? (
                            <span 
                              title={contribution.owner}
                              style={{
                                backgroundColor: '#f1f5f9',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                color: '#475569',
                                cursor: 'pointer',
                                display: 'inline-block',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {shortenAddress(contribution.owner)}
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!landLeaderboardLoading && landLeaderboardData && landLeaderboardData.lands && landLeaderboardData.lands.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              marginTop: '30px',
              border: '1px solid #f1f5f9'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8"></path>
              </svg>
              <h3 style={{ color: '#64748b', marginTop: '20px', fontSize: '20px', fontWeight: '600' }}>No land leaderboard data found</h3>
              <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '16px', maxWidth: '500px', margin: '10px auto 0' }}>
                There is no land leaderboard data available for the selected date.
              </p>
              <button
                onClick={fetchLandLeaderboardData}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  marginTop: '25px',
                  boxShadow: '0 2px 5px rgba(52, 152, 219, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3498db';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(52, 152, 219, 0.3)';
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mount the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<KingdomContributionsApp />);
}