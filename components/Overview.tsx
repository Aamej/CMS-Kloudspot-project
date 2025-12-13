import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, TrendingUp, TrendingDown, Loader2, Minus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { socketService } from '../services/socket.ts';
import { ChartDataPoint, Site } from '../types';

// Calculating percentage diff for the trends
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return { value: 100, direction: 'up' }; 
  const diff = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(diff)),
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  };
};

// Custom Badge for the Chart
const CustomLiveLabel = (props: any) => {
    const { viewBox } = props;
    const x = viewBox.x;
    const y = viewBox.y;
    
    return (
      <g>
         <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
            </filter>
        </defs>
        <line x1={x} y1={y} x2={x} y2={viewBox.height + y} stroke="#b91c1c" strokeWidth={2} strokeDasharray="3 3" />
        
        <g transform={`translate(${x}, ${y})`}>
            <rect x={-9} y={0} width={18} height={42} fill="#b91c1c" rx={2} filter="url(#shadow)" />
            <text 
                x={0} 
                y={21} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fill="#fff" 
                fontSize={9} 
                fontWeight="bold"
                transform={`rotate(-90, 0, 21)`}
                style={{ letterSpacing: '1px' }}
            >
                LIVE
            </text>
        </g>
      </g>
    );
};

// Default colors for demographics pie chart
const PIE_COLORS = { male: '#009688', female: '#e91e63' };

const Overview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [simStarted, setSimStarted] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Main Stats - Start with 0, only show real data
  const [liveOccupancy, setLiveOccupancy] = useState(0);
  const [footfall, setFootfall] = useState(0);
  const [avgDwell, setAvgDwell] = useState(0);

  // Trend Comparisons
  const [trends, setTrends] = useState({
      occupancy: { value: 0, direction: 'neutral' },
      footfall: { value: 0, direction: 'neutral' },
      dwell: { value: 0, direction: 'neutral' }
  });

  // Chart Data - Start empty, only show real data from API
  const [occupancyData, setOccupancyData] = useState<ChartDataPoint[]>([]);
  const [demographicsTrend, setDemographicsTrend] = useState<ChartDataPoint[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number, color: string}[]>([]);

  // Simple check for Today
  const isToday = useMemo(() => {
      const today = new Date();
      return selectedDate.getDate() === today.getDate() &&
             selectedDate.getMonth() === today.getMonth() &&
             selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  const getRange = useCallback((date: Date) => {
    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    if (date.toDateString() === new Date().toDateString()) {
        end.setTime(Date.now());
    } else {
        end.setHours(23, 59, 59, 999);
    }
    return { fromUtc: start.getTime(), toUtc: end.getTime() };
  }, []);

  // 1. Initial Load - Getting Sites (non-blocking, show data immediately)
  useEffect(() => {
    // Set default site immediately so UI can render
    setCurrentSite({ siteId: 'mock', name: 'Avenue Mall', timezone: 'UTC', country: 'UAE', city: 'Dubai' });
    
    const init = async () => {
        try {
            const sites = await api.getSites();
            if (sites && sites.length > 0) {
                setCurrentSite(sites[0]);
                // Start sim in background, don't block UI
                if (isToday) {
                    api.startSimulation().then(() => {
                        setSimStarted(true);
                    }).catch(() => {
                        setSimStarted(false); 
                    });
                }
            }
        } catch {
            // Init failed - keep showing default site/mock data
        }
    };
    init();
  }, [isToday]);

  // 2. Fetching all the dashboard data - optimized for speed
  useEffect(() => {
    if (!currentSite) return;

    const fetchData = async () => {
      // Don't show loading spinner, keep mock data visible
      // setLoading(true); // Removed - show data immediately
      
      try {
        const { fromUtc, toUtc } = getRange(selectedDate);
        const payload = { siteId: currentSite.siteId, fromUtc, toUtc };

        // Preparing yesterday's range for trend comparison
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayRange = getRange(yesterday);
        const prevPayload = { siteId: currentSite.siteId, fromUtc: yesterdayRange.fromUtc, toUtc: yesterdayRange.toUtc };

        // Using Promise.all to fetch everything in parallel for speed
        const [
            footfallRes, dwellRes, occupancyRes, demoRes,
            prevFootfallRes, prevDwellRes, prevOccupancyRes
        ] = await Promise.all([
            api.getFootfall(payload),
            api.getDwellTime(payload),
            api.getOccupancyTrends(payload),
            api.getDemographics(payload),
            api.getFootfall(prevPayload).catch(() => ({ footfall: 0 })),
            api.getDwellTime(prevPayload).catch(() => ({ avgDwellMinutes: 0 })),
            api.getOccupancyTrends(prevPayload).catch(() => ([])),
        ]);

        setFootfall(footfallRes.footfall || 0);
        setAvgDwell(Math.round(dwellRes.avgDwellMinutes || 0));

        const prevFootfall = prevFootfallRes.footfall || 0;
        const prevDwell = prevDwellRes.avgDwellMinutes || 0;
        
        let prevLive = 0;
        const prevOccArray = Array.isArray(prevOccupancyRes) ? prevOccupancyRes : [];
        if (prevOccArray.length > 0) {
            prevLive = prevOccArray[prevOccArray.length - 1].count || 0;
        }

        // Processing Occupancy Data - API returns hourly buckets
        const rawOccupancy = Array.isArray(occupancyRes) ? occupancyRes : (occupancyRes as any)?.buckets || [];
        const formattedOccupancy: ChartDataPoint[] = rawOccupancy.map((item: any) => {
             const ts = item.timestamp || item.bucket || Date.now();
             const date = new Date(ts);
             const hours = date.getUTCHours();
             const minutes = date.getUTCMinutes();
             return {
                 time: `${hours}:${minutes.toString().padStart(2, '0')}`,
                 count: item.count || item.occupancy || item.siteOccupancy || 0,
                 timestamp: ts
             };
        });

        // Use real data only - no mock fallbacks
        setOccupancyData(formattedOccupancy);

        // Live count from the last data point, or 0 if no data
        let currentLive = 0;
        if (formattedOccupancy.length > 0) {
            currentLive = formattedOccupancy[formattedOccupancy.length - 1].count || 0;
        }
        setLiveOccupancy(currentLive);

        setTrends({
            footfall: calculateTrend(footfallRes.footfall || 0, prevFootfall),
            dwell: calculateTrend(dwellRes.avgDwellMinutes || 0, prevDwell),
            occupancy: calculateTrend(currentLive, prevLive)
        });

        // Processing Demographics - using UTC time for consistency
        let totalMale = 0;
        let totalFemale = 0;
        const rawDemo = Array.isArray(demoRes) ? demoRes : (demoRes as any)?.buckets || [];
        const formattedDemo: ChartDataPoint[] = rawDemo.map((item: any) => {
            const m = item.male || item.maleCount || 0;
            const f = item.female || item.femaleCount || 0;
            totalMale += m;
            totalFemale += f;
            const ts = item.timestamp || item.bucket || Date.now();
            const date = new Date(ts);
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            return {
                time: `${hours}:${minutes.toString().padStart(2, '0')}`,
                countMale: m,
                countFemale: f
            };
        });

        setDemographicsTrend(formattedDemo);

        // Pie chart shows percentage breakdown, empty if no data
        if (totalMale > 0 || totalFemale > 0) {
            const grandTotal = totalMale + totalFemale;
            setPieData([
                { name: 'Males', value: Math.round((totalMale / grandTotal) * 100), color: PIE_COLORS.male },
                { name: 'Females', value: Math.round((totalFemale / grandTotal) * 100), color: PIE_COLORS.female }
            ]);
        } else {
            setPieData([]);
        }

      } catch {
        // API failed - reset to empty state
        setFootfall(0);
        setAvgDwell(0);
        setOccupancyData([]);
        setLiveOccupancy(0);
        setDemographicsTrend([]);
        setPieData([]);
        setTrends({
            footfall: { value: 0, direction: 'neutral' },
            dwell: { value: 0, direction: 'neutral' },
            occupancy: { value: 0, direction: 'neutral' }
        });
      } finally {
        setLoading(false);
      }
    };

    // Fetch data immediately, don't wait
    fetchData();

    // Socket Setup - optimized for faster real-time updates
    let socketHandler: ((data: any) => void) | null = null;
    
    if (isToday) {
        // Create handler once, reuse it
        socketHandler = (data: any) => {
            // Socket sends siteOccupancy for the total count
            const liveCount = data?.siteOccupancy;

            if (typeof liveCount === 'number') {
                // Update live count immediately
                setLiveOccupancy(liveCount);

                // Update chart with new data point
                setOccupancyData(prev => {
                    const now = new Date();
                    const hours = now.getUTCHours();
                    const minutes = now.getUTCMinutes();
                    const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;

                    // Same minute - update existing point
                    if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...updated[updated.length - 1], count: liveCount };
                        return updated;
                    } else {
                        // New minute - add new point, keep last 50 for performance
                        const newData = [...prev, { time: timeStr, count: liveCount, timestamp: Date.now() }];
                        return newData.slice(-50);
                    }
                });
            }
        };
        
        // Register listener - works even if socket not connected yet
        socketService.onLiveOccupancy(socketHandler);
    } else {
        socketService.off('live_occupancy');
    }

    // Cleanup
    return () => {
        if (socketHandler) {
            socketService.off('live_occupancy');
        }
    };
  }, [currentSite, selectedDate, isToday, getRange]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.valueAsDate) {
          setSelectedDate(e.target.valueAsDate);
      }
  };

  const formatDateForPicker = (date: Date) => {
      return date.toISOString().split('T')[0];
  };

  if (!currentSite && loading) {
      return (
          <div className="h-full w-full flex items-center justify-center text-primary">
              <Loader2 size={40} className="animate-spin" />
          </div>
      );
  }

  // Small sub-component for trends
  const TrendIndicator = ({ trend, label }: { trend: { value: number, direction: string }, label: string }) => {
      const color = trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-400';
      const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
      const text = trend.direction === 'neutral' ? 'No change' : `${trend.value}% ${trend.direction === 'up' ? 'More' : 'Less'} than yesterday`;
      
      return (
          <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${color}`}>
              <Icon size={14} />
              <span>{text}</span>
          </div>
      );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-xl font-bold text-gray-800">Overview</h1>
            {currentSite && <p className="text-sm text-gray-500">Site: {currentSite.name}</p>}
        </div>
        
        <div className="flex gap-3">
             {isToday && (
                <div className={`flex items-center px-3 py-1 rounded text-xs font-medium border ${simStarted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {simStarted ? 'Sim Running' : 'Sim Inactive'}
                </div>
             )}

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                </div>
                <input 
                    type="date"
                    value={formatDateForPicker(selectedDate)}
                    max={formatDateForPicker(new Date())}
                    onChange={handleDateChange}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Occupancy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Live Occupancy</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{liveOccupancy}</p>
            <TrendIndicator trend={trends.occupancy} label="yesterday" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Today's Footfall</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{footfall.toLocaleString()}</p>
            <TrendIndicator trend={trends.footfall} label="yesterday" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Avg Dwell Time</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.floor(avgDwell)} <span className="text-lg text-gray-500 font-normal">min</span> {Math.round((avgDwell % 1) * 60)}sec
            </p>
            <TrendIndicator trend={trends.dwell} label="yesterday" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-gray-800">Overall Occupancy</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
             <span className="h-2 w-2 rounded-full bg-primary"></span>
             Occupancy
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={occupancyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009688" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#009688" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#666'}} 
                ticks={[0, 50, 100, 150, 200, 250]}
                domain={[0, 250]}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#666' } }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                cursor={{ stroke: '#999', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="count" stroke="#009688" strokeWidth={2} fillOpacity={1} fill="url(#colorOccupancy)" />
              {isToday && occupancyData.length > 0 && (
                  <ReferenceLine 
                    x={occupancyData[occupancyData.length - 1].time} 
                    stroke="none"
                    label={<CustomLiveLabel />}
                  />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Demographics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-1">
             <h4 className="text-sm font-medium text-gray-700 mb-4">Chart of Demographics</h4>
             <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-xs text-gray-500">Total Crowd</span>
                   <span className="text-xl font-bold text-gray-800">100%</span>
                </div>
             </div>
             
             <div className="space-y-3 mt-2">
               {pieData.map((entry) => (
                   <div key={entry.name} className="flex items-center gap-2">
                    <span style={{ color: entry.color }}>
                        <svg width="16" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9 2 7 4 7 7C7 10 9 12 12 12C15 12 17 10 17 7C17 4 15 2 12 2Z" /><path d="M16 14H8C6 14 5 15 5 17V22H9V18H15V22H19V17C19 15 18 14 16 14Z" /></svg>
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{entry.value}%</span>
                    <span className="text-sm text-gray-500">{entry.name}</span>
                   </div>
               ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-medium text-gray-700">Demographics Analysis</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-[#68B0AB]"></span> Male
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-[#B6E2DD]"></span> Female
                  </div>
                </div>
             </div>

             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={demographicsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#eee" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#666' } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="countMale" stackId="1" stroke="#68B0AB" fill="#68B0AB" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="countFemale" stackId="1" stroke="#B6E2DD" fill="#B6E2DD" fillOpacity={0.6} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Overview;