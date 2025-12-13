import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, ChevronDown, X, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { EntryExitRecord, Site, Alert } from '../types';

const CrowdEntries: React.FC = () => {
  const [entries, setEntries] = useState<EntryExitRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pageSize, setPageSize] = useState(10);

  // Real-time alerts from socket - no mock data, only live alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);

  // I made this Helper to get date range - matching Overview.tsx logic for consistency
  const getRange = useCallback((date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    if (date.toDateString() === new Date().toDateString()) {
      end.setTime(Date.now());
    } else {
      end.setHours(23, 59, 59, 999);
    }
    return { fromUtc: start.getTime(), toUtc: end.getTime() };
  }, []);

  // This is the Initial load - fetch site info
  // Initial load - fetch site info
  useEffect(() => {
    const init = async () => {
        try {
            const sites = await api.getSites();
            if (sites && sites.length > 0) {
                setCurrentSite(sites[0]);
            } else {
                // No sites available - stop loading spinner
                setLoading(false);
            }
        } catch {
            // Failed to load sites - stop loading spinner
            setLoading(false);
        }
    };
    init();
  }, []);

  // Subscribe to real-time alerts via socket
  useEffect(() => {
    socketService.connect();

    const handleAlert = (data: any) => {
      // Build alert object from socket data
      const newAlert: Alert = {
        id: data.id || `${Date.now()}-${Math.random()}`,
        personName: data.personName || 'Unknown',
        zoneName: data.zoneName || 'Unknown Zone',
        severity: data.severity?.toLowerCase() || 'low',
        timestamp: data.timestamp || Date.now(),
        type: data.type || 'entry'
      };

      // Add new alert at the top, keep max 20 alerts in memory
      setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    };

    socketService.onAlert(handleAlert);

    return () => {
      socketService.off('alert');
    };
  }, []);

  // Fetch live data from API
  const fetchEntries = useCallback(async (page: number) => {
    if (!currentSite) return;

    setLoading(true);

    try {
        // I used the shared getRange function for consistency with Overview page
        const { fromUtc, toUtc } = getRange(selectedDate);

        const response = await api.getEntries({
            siteId: currentSite.siteId,
            fromUtc,
            toUtc,
            pageNumber: page,
            pageSize: pageSize
        });

        if (response && Array.isArray(response.records)) {
            setEntries(response.records);
            setTotalCount(response.totalRecords || 0);
        } else {
            setEntries([]);
            setTotalCount(0);
        }
    } catch {
        // Network or API error - clear data and let UI show empty state
        setEntries([]);
        setTotalCount(0);
    } finally {
        setLoading(false);
    }
  }, [currentSite, selectedDate, pageSize, getRange]);

  // Trigger fetch immediately when site is available
  useEffect(() => {
    if (currentSite) {
        // Fetch right away, don't wait
        fetchEntries(currentPage);
    }
  }, [currentPage, currentSite, selectedDate, pageSize, fetchEntries]);

  const formatDateForPicker = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.valueAsDate) {
        setSelectedDate(e.target.valueAsDate);
        setCurrentPage(1); 
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPageSize(Number(e.target.value));
      setCurrentPage(1); 
  };

  const formatTime = (epoch?: number) => {
      if (!epoch) return '--';
      return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle both 'gender' and 'sex' field names from API
  const formatGender = (person: EntryExitRecord) => {
      const value = person.gender || person.sex || (person as any).Gender || (person as any).Sex;
      if (!value) return '--';
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  // Format dwell time from minutes to readable string
  const formatDwell = (minutes?: number) => {
      if (!minutes || minutes <= 0) return '--';
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hrs > 0) {
          return `${hrs}h ${mins}m`;
      }
      return `${mins}m`;
  };

  // Format alert timestamp to readable date/time
  const formatAlertDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${month} ${day} ${year}  ${time}`;
  };

  // Severity color mapping for alert badges
  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-400 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="p-6 animate-fade-in relative">
      {/* Main content area - full width */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h1 className="text-xl font-bold text-gray-800">Overview</h1>
              {currentSite && <p className="text-sm text-gray-500">Site: {currentSite.name}</p>}
          </div>

          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
              </div>
              <input
                  type="date"
                  value={formatDateForPicker(selectedDate)}
                  max={formatDateForPicker(new Date())}
                  onChange={handleDateChange}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
        
        {loading && (
            <div className="w-full h-32 flex items-center justify-center flex-1">
                <Loader2 className="animate-spin text-primary" size={30} />
            </div>
        )}

        {!loading && (
        <>
            <div className="overflow-x-auto" role="region" aria-label="Crowd entries table">
            <table className="w-full min-w-[700px]" aria-describedby="entries-caption">
                <caption id="entries-caption" className="sr-only">List of visitor entries and exits</caption>
                <thead className="bg-gray-100">
                <tr>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sex</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Entry</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Exit</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Dwell Time</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-gray-400 font-medium">No entries found for this date.</span>
                                <span className="text-xs text-gray-400">Try selecting a different date.</span>
                            </div>
                        </td>
                    </tr>
                ) : (
                    entries.map((person) => (
                        <tr key={person.personId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.personName || 'U')}&background=random&size=36`}
                                  alt=""
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-800">{person.personName || 'Unknown'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatGender(person)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(person.entryUtc)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(person.exitUtc)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDwell(person.dwellMinutes)}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>

            <div className="mt-auto px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <label htmlFor="page-size" className="sr-only">Rows per page</label>
                    <span aria-hidden="true">Rows per page:</span>
                    <div className="relative">
                        <select
                            id="page-size"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            aria-label="Select rows per page"
                            className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                    </span>
                    
                    <nav className="flex items-center gap-1" aria-label="Pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            aria-label="Next page"
                            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </nav>
                </div>
            </div>
        </>
        )}
        </div>
      </div>

      {/* Alerts Panel - floating in top-right corner, compact size */}
      {showAlerts && (
        <aside className="fixed top-16 right-4 w-56 z-50" role="complementary" aria-label="Real-time alerts">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Alerts</h2>
              <button
                onClick={() => setShowAlerts(false)}
                aria-label="Close alerts panel"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-400 text-xs">
                  No alerts yet
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={alert.id}
                    className={`px-3 py-2 border-b border-gray-50 last:border-b-0 ${idx === 0 ? 'bg-red-50/70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400">{formatAlertDate(alert.timestamp)}</p>
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {alert.personName} Entered
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <MapPin size={9} />
                          <span className="truncate">{alert.zoneName}</span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default CrowdEntries;