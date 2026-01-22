
export const CITY_CLUSTERS: Record<string, string[]> = {
  'North': ['Delhi', 'Rishikesh', 'Jaipur', 'Agra', 'Manali', 'Leh', 'Chandigarh', 'Indore', 'Bhopal', 'Varanasi', 'Lucknow'],
  'West': ['Mumbai', 'Lonavala', 'Alibaug', 'Goa', 'Pune', 'Ahmedabad', 'Surat', 'Nagpur', 'Udaipur'],
  'South': ['Bengaluru', 'Mysore', 'Coorg', 'Chennai', 'Pondicherry', 'Kochi', 'Munnar', 'Alleppey', 'Coimbatore', 'Ooty', 'Hampi', 'Hyderabad', 'Vizag', 'Mangalore', 'Trivandrum'],
  'East': ['Kolkata', 'Darjeeling', 'Shillong', 'Gangtok']
};

export const NEARBY_MAP: Record<string, string[]> = {
  'Goa': ['Gokarna', 'Udupi', 'Mumbai', 'Pune'],
  'Bengaluru': ['Mysore', 'Coorg', 'Hampi', 'Wayand', 'Ooty'],
  'Chennai': ['Pondicherry', 'Mahabalipuram', 'Bengaluru'],
  'Coimbatore': ['Ooty', 'Valparai', 'Munnar', 'Kochi'],
  'Delhi': ['Rishikesh', 'Jaipur', 'Agra', 'Chandigarh', 'Manali'],
  'Mumbai': ['Lonavala', 'Alibaug', 'Pune', 'Goa'],
  'Kochi': ['Munnar', 'Alleppey', 'Varkala', 'Trivandrum', 'Kanyakumari'],
  'Hyderabad': ['Hampi', 'Warangal', 'Visakhapatnam'],
  'Kolkata': ['Darjeeling', 'Shillong', 'Puri', 'Varanasi'],
};

export const getNearbyCities = (city: string): string[] => {
  return NEARBY_MAP[city] || [];
};

export const getRegionForCity = (city: string): string | null => {
  for (const [region, cities] of Object.entries(CITY_CLUSTERS)) {
    if (cities.includes(city)) return region;
  }
  return null;
};
