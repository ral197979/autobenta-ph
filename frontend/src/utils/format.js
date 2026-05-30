export const formatPrice = (price) =>
  `₱${parseFloat(price).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatMileage = (km) => `${parseInt(km).toLocaleString()} km`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

export const TRANSMISSION_LABELS = { automatic: 'AT', manual: 'MT', cvt: 'CVT' };
export const FUEL_LABELS = { gasoline: 'Gas', diesel: 'Diesel', hybrid: 'Hybrid', electric: 'EV', lpg: 'LPG' };
export const CONDITION_LABELS = { brand_new: 'Brand New', excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' };
export const CONDITION_COLORS = { brand_new: 'text-amber-700 bg-amber-100', excellent: 'text-green-700 bg-green-100', good: 'text-blue-700 bg-blue-100', fair: 'text-yellow-700 bg-yellow-100', poor: 'text-red-700 bg-red-100' };
export const STATUS_COLORS = {
  active: 'text-green-700 bg-green-100', pending: 'text-yellow-700 bg-yellow-100',
  draft: 'text-gray-700 bg-gray-100', sold: 'text-blue-700 bg-blue-100',
  archived: 'text-gray-600 bg-gray-100', rejected: 'text-red-700 bg-red-100',
};
export const SELLER_TYPE_LABELS = { private: 'Private', dealer: 'Dealer', repossessed: 'Repossessed' };
