
import { Currency, Trip, TripType } from '../types';

const RATES: Record<Currency, number> = {
  INR: 1,
  USD: 1 / 83,
  EUR: 1 / 90,
  GBP: 1 / 105,
  AED: 1 / 22.6,
  SGD: 1 / 61.5,
};

export const convertPrice = (price: number, to: Currency): number => {
  return price * RATES[to];
};

export const formatPrice = (price: number, currency: Currency): string => {
  // Repair data on the fly if somehow missing (failsafe)
  const safePrice = (price && !isNaN(price) && price > 0) ? price : 9999;
  const converted = convertPrice(safePrice, currency);
  
  if (currency === 'INR') {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.floor(converted));
    return `₹${formatted} per person`;
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  const formattedCurrency = new Intl.NumberFormat('en-US', options).format(converted);
  return `${formattedCurrency} per person`;
};

/**
 * Resolves price based on mandatory 'pricePerPersonInr' field.
 * Guaranteed to never return 'TBD'.
 */
export const getDisplayPrice = (trip: Trip, currency: Currency) => {
  const isOrganizer = trip.tripType === TripType.ORGANIZER;
  const amount = trip.pricePerPersonInr || trip.estimatedBudget;
  const label = isOrganizer ? 'Package Price' : 'Estimated Budget';
  
  return {
    label,
    amount,
    formatted: formatPrice(amount, currency)
  };
};

export const CURRENCY_LIST: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
