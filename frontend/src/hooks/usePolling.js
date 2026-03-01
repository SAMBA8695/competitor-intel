import { useState, useEffect, useRef } from 'react';
import { getStatus, getReport } from '../utils/api';

/**
 * Hook to poll report status and fetch final report when done
 */
export function usePolling(reportId, intervalMs = 3000) {
  const [status, setStatus] = useState('pending');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!reportId) return;

    const poll = async () => {
      try {
        const statusData = await getStatus(reportId);
        setStatus(statusData.status);

        if (statusData.status === 'done') {
          clearInterval(intervalRef.current);
          const fullReport = await getReport(reportId);
          setReport(fullReport);
        } else if (statusData.status === 'error') {
          clearInterval(intervalRef.current);
          setError(statusData.error || 'Analysis failed');
        }
      } catch (err) {
        setError(err.message);
        clearInterval(intervalRef.current);
      }
    };

    // Poll immediately, then on interval
    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return () => clearInterval(intervalRef.current);
  }, [reportId, intervalMs]);

  return { status, report, error };
}
