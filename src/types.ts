export interface Category {
  id: string;
  name: string;
  count: number;
  slug: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  discount: string;
  phone: string;
  address: string;
  description?: string;
  imageUrl: string;
  status: 'active' | 'inactive';
}

export interface Exam {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'ready' | 'pending' | 'scheduled';
  resultUrl?: string;
}

export interface Appointment {
  id: string;
  professionalName: string;
  specialty: string;
  date: string;
  time: string;
  imageUrl: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface HealthStat {
  label: string;
  value: string;
  unit: string;
  change: number;
  icon: string;
  color: string;
}

export interface Offer {
  id: string;
  partnerName: string;
  description: string;
  discount: string;
  imageUrl: string;
  category: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  availability: string[];
}
