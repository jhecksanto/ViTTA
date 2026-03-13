import { Appointment, HealthStat, Offer, Professional, Exam, Partner, Category } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Farmácias', count: 1, slug: 'farmacias' },
  { id: '2', name: 'Óticas', count: 1, slug: 'oticas' },
  { id: '3', name: 'Supermercados', count: 0, slug: 'supermercados' },
  { id: '4', name: 'Moda Masculina', count: 0, slug: 'moda_masculina' },
  { id: '5', name: 'Moda Feminina', count: 0, slug: 'moda_feminina' },
  { id: '6', name: 'Moda Infantil', count: 0, slug: 'moda_infantil' },
  { id: '7', name: 'Calçados', count: 0, slug: 'calcados' },
  { id: '8', name: 'Suplementos', count: 1, slug: 'suplementos' },
  { id: '9', name: 'Estética', count: 0, slug: 'estetica' },
  { id: '10', name: 'Eletrodomésticos', count: 0, slug: 'eletrodomesticos' },
  { id: '11', name: 'Móveis', count: 0, slug: 'moveis' },
  { id: '12', name: 'Salão de Beleza', count: 0, slug: 'salao_beleza' },
  { id: '13', name: 'Material de Construção', count: 0, slug: 'material_construcao' },
  { id: '14', name: 'Padaria', count: 0, slug: 'padaria' },
  { id: '15', name: 'Lanchonete', count: 0, slug: 'lanchonete' },
  { id: '16', name: 'Restaurante', count: 0, slug: 'restaurante' },
  { id: '17', name: 'Pizzaria', count: 0, slug: 'pizzaria' },
  { id: '18', name: 'Sorveteria', count: 0, slug: 'sorveteria' },
  { id: '19', name: 'Posto de Combustíveis', count: 0, slug: 'posto_combustivel' },
  { id: '20', name: 'Pet Shop', count: 0, slug: 'pet_shop' },
  { id: '21', name: 'Contador', count: 0, slug: 'contador' },
  { id: '22', name: 'Cabeleireiro', count: 0, slug: 'cabeleireiro' },
  { id: '23', name: 'Pintor', count: 0, slug: 'pintor' },
  { id: '24', name: 'Pedreiro', count: 0, slug: 'pedreiro' },
];

export const MOCK_PARTNERS: Partner[] = [
  {
    id: '1',
    name: 'Óticas Precisão',
    category: 'Óticas',
    discount: '20%',
    phone: '(28) 3542-3542',
    address: 'Praça 3 Irmãos - Centro - Castelo - ES',
    imageUrl: 'https://picsum.photos/seed/optics/100/100',
    status: 'active',
  },
  {
    id: '2',
    name: 'Farmácia Avenida',
    category: 'Farmácias',
    discount: '9%',
    phone: '(28) 3542-3542',
    address: 'Praça 3 Irmãos - Centro - Castelo - ES',
    description: 'Medicamentos e Perfumaria',
    imageUrl: 'https://picsum.photos/seed/pharmacy/100/100',
    status: 'active',
  },
  {
    id: '3',
    name: 'igreen',
    category: 'Suplementos',
    discount: '10%',
    phone: '(28) 99886-2116',
    address: 'Rua Maria Ortiz, 759, Castelo - ES',
    description: 'Desconto na conta de Energia!',
    imageUrl: 'https://picsum.photos/seed/green/100/100',
    status: 'active',
  },
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: '1',
    title: 'Hemograma Completo',
    date: '2026-03-01',
    location: 'Lab ViTTA Centro',
    status: 'ready',
    resultUrl: '#',
  },
  {
    id: '2',
    title: 'Raio-X Tórax',
    date: '2026-03-10',
    location: 'Hospital Santa Luzia',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Ecocardiograma',
    date: '2026-03-25',
    location: 'Clínica CardioLife',
    status: 'scheduled',
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    professionalName: 'Dra. Ana Silva',
    specialty: 'Cardiologista',
    date: '2026-03-15',
    time: '09:00',
    imageUrl: 'https://picsum.photos/seed/doc1/100/100',
    status: 'upcoming',
  },
  {
    id: '2',
    professionalName: 'Dr. Ricardo Santos',
    specialty: 'Nutricionista',
    date: '2026-03-18',
    time: '14:30',
    imageUrl: 'https://picsum.photos/seed/doc2/100/100',
    status: 'upcoming',
  },
];

export const MOCK_STATS: HealthStat[] = [
  {
    label: 'Passos',
    value: '8.432',
    unit: 'hoje',
    change: 12,
    icon: 'Footprints',
    color: 'emerald',
  },
  {
    label: 'Sono',
    value: '7h 20m',
    unit: 'última noite',
    change: -5,
    icon: 'Moon',
    color: 'indigo',
  },
  {
    label: 'Frequência Cardíaca',
    value: '72',
    unit: 'bpm',
    change: 2,
    icon: 'Heart',
    color: 'rose',
  },
  {
    label: 'Água',
    value: '1.8',
    unit: 'litros',
    change: 20,
    icon: 'Droplets',
    color: 'blue',
  },
];

export const MOCK_OFFERS: Offer[] = [
  {
    id: '1',
    partnerName: 'BioRitmo',
    description: 'Mensalidade com desconto exclusivo para membros ViTTA.',
    discount: '25% OFF',
    imageUrl: 'https://picsum.photos/seed/gym/400/200',
    category: 'Fitness',
  },
  {
    id: '2',
    partnerName: 'Droga Raia',
    description: 'Desconto em medicamentos genéricos e perfumaria.',
    discount: 'Até 40% OFF',
    imageUrl: 'https://picsum.photos/seed/pharmacy/400/200',
    category: 'Saúde',
  },
  {
    id: '3',
    partnerName: 'Green Salad',
    description: 'Alimentação saudável com entrega grátis.',
    discount: '15% OFF',
    imageUrl: 'https://picsum.photos/seed/food/400/200',
    category: 'Alimentação',
  },
];

export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'Dra. Beatriz Costa',
    specialty: 'Psicóloga',
    rating: 4.9,
    reviews: 124,
    imageUrl: 'https://picsum.photos/seed/doc3/100/100',
    availability: ['Seg', 'Ter', 'Qui'],
  },
  {
    id: '2',
    name: 'Dr. Marcos Oliveira',
    specialty: 'Clínico Geral',
    rating: 4.8,
    reviews: 89,
    imageUrl: 'https://picsum.photos/seed/doc4/100/100',
    availability: ['Qua', 'Sex'],
  },
];
