import { BusOption, TrainOption, HotelOption, TravelMode, FlightOption } from '../types';

const seededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
};

export const getTravelOptions = (tripId: string, from: string, to: string, mode: TravelMode): BusOption[] => {
  const options: BusOption[] = [];
  const operators = ["ZingBus", "IntrCity", "VRL Travels", "SRS Travels", "Orange Travels", "National Travels", "Prasanna Purple", "Neeta Tours", "Eagle Connect", "Lala Travels"];
  const seatTypes = ["AC Sleeper (2+1)", "Luxury Seater", "Volvo Multi-Axle", "Semi-Sleeper AC"];

  for (let i = 0; i < 10; i++) {
    const seed = `${tripId}-travel-v5-${i}`;
    const rand = seededRandom(seed);
    const operator = operators[i % operators.length];
    
    const price = 1100 + Math.floor(rand * 1400);
    const hour = (17 + Math.floor(rand * 6)) % 24; 
    const minute = Math.floor(rand * 4) * 15;
    const durationHour = 7 + Math.floor(rand * 5);
    
    options.push({
      id: `bus-${i}`,
      operator,
      departTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      arriveTime: `${((hour + durationHour) % 24).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      duration: `${durationHour}h ${Math.floor(rand * 59)}m`,
      seatType: seatTypes[i % seatTypes.length],
      price,
      // Added for VA recommendations
      bookingCount: Math.floor(rand * 500) + 100,
      rating: Number((3.5 + rand * 1.5).toFixed(1))
    } as any);
  }
  return options;
};

export const getFlightOptions = (tripId: string, from: string, to: string): FlightOption[] => {
  const options: FlightOption[] = [];
  const airlines = ["IndiGo", "Air India", "Vistara", "Akasa Air", "SpiceJet", "Air India Express"];
  
  for (let i = 0; i < 8; i++) {
    const seed = `${tripId}-flight-v1-${i}`;
    const rand = seededRandom(seed);
    const airline = airlines[i % airlines.length];
    const flightNo = `${airline.substring(0, 2).toUpperCase()}-${100 + Math.floor(rand * 899)}`;
    
    const price = 4500 + Math.floor(rand * 8000);
    const hour = (6 + Math.floor(rand * 14)) % 24; 
    const durationHour = 1 + Math.floor(rand * 4);
    const stops = rand > 0.6 ? "1 Stop" : "Non-stop";

    options.push({
      id: `flight-${i}`,
      airline,
      flightNumber: flightNo,
      departTime: `${hour.toString().padStart(2, '0')}:15`,
      arriveTime: `${((hour + durationHour) % 24).toString().padStart(2, '0')}:45`,
      duration: `${durationHour}h 30m`,
      stops,
      price
    });
  }
  return options;
};

export const getHotelOptions = (tripId: string, location: string): HotelOption[] => {
  const options: HotelOption[] = [];
  const prefixes = ["The Royal", "Grand", "Heritage", "Zostel", "Cloud 9", "Oceanic", "Mountain View", "The Taj", "Ginger", "Ibis"];
  const types = ["Resort", "Inn", "Hotel", "Boutique Stay", "Villa", "Homestay"];

  for (let i = 0; i < 10; i++) {
    const seed = `${tripId}-hotel-v5-${i}`;
    const rand = seededRandom(seed);
    const name = `${prefixes[i % prefixes.length]} ${types[i % types.length]}`;
    const pricePerNight = 1700 + Math.floor(rand * 4500);
    
    options.push({
      id: `hotel-${i}`,
      name,
      area: `${location} ${i % 2 === 0 ? 'City Center' : 'Hills'}`,
      rating: Number((3.2 + rand * 1.8).toFixed(1)),
      pricePerNight,
      totalPrice: pricePerNight * 3, 
      refundableBadge: rand > 0.4,
      // Added for VA recommendations
      bookingCount: Math.floor(rand * 300) + 50
    } as any);
  }
  return options;
};