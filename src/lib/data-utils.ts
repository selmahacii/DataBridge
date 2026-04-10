/**
 * Utility functions for generating high-fidelity, realistic data signals.
 * Used to simulate production environments with seasonality and noise.
 */

export const generateTimeSeries = (
  days: number, 
  baseValue: number, 
  volatility: number = 0.1,
  seasonality: boolean = true
) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Base trend
    let value = baseValue;
    
    // Add noise
    value += (Math.random() - 0.5) * baseValue * volatility;
    
    // Add seasonality (weekly pattern)
    if (seasonality) {
      const day = date.getDay();
      if (day === 0 || day === 6) {
        // Weekends: lower traffic (industrial context)
        value *= 0.65;
      }
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      val: Math.floor(value),
      sessions: Math.floor(value), // for backwards compatibility
      conversions: Math.floor(value * 0.05),
      revenue: Math.floor(value * 12.5),
    });
  }
  
  return data;
};

export const getRelativeTime = (minutesAgo: number) => {
  const now = new Date();
  return new Date(now.getTime() - minutesAgo * 60000);
};

export const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};
