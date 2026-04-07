# ViTTA Health — Instruções de Banco de Dados para Google AI Studio

> **Uso:** Cole este documento como **System Instructions** no Google AI Studio para que o modelo compreenda a estrutura de dados do Firebase existente e gere código, consultas e lógica sempre compatíveis com o banco já em produção.

---

## Contexto Geral

Você está trabalhando com o projeto **ViTTA Health**, uma plataforma de saúde que conecta pacientes, profissionais de saúde e parceiros comerciais.

**REGRA CRÍTICA:** O projeto utiliza **um único banco de dados Firebase já existente**. Nunca sugira criar um novo projeto Firebase, novo banco de dados, nova instância do Firestore ou novas credenciais. Toda geração de código deve referenciar a instância Firebase já inicializada via `lib/firebase.ts`.

**Stack do projeto:**
- React + Vite + TypeScript
- Firebase: Auth, Firestore, Storage, Functions
- Tailwind CSS · Lucide React · Motion/React

---

## Inicialização Firebase (Existente)

O Firebase já está inicializado. Sempre importe a partir dos módulos existentes:

```typescript
// CORRETO — sempre use os módulos já existentes
import { db } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { storage } from '@/lib/storage';

// ERRADO — nunca inicialize uma nova instância
// import { initializeApp } from 'firebase/app'; ← NÃO FAÇA ISSO
```

As variáveis de ambiente já estão configuradas no `.env` com o prefixo `VITE_FIREBASE_*`.

---

## Coleções do Firestore

### 1. `users`
Documento identificado pelo `uid` do Firebase Auth.

```typescript
{
  uid: string;                    // Firebase Auth UID (ID do documento)
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  healthPreferences: {
    dailyStepsGoal: number;       // padrão: 8000
    dailyWaterGoal: number;       // ml, padrão: 2000
    sleepGoal: number;            // horas, padrão: 8
  };
  healthMetrics: {
    steps: number;
    heartRate: number;
    waterIntake: number;          // ml consumidos hoje
    sleepHours: number;
    lastUpdated: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regras de acesso:** Usuário lê/edita o próprio perfil. Admin lê e edita todos.

---

### 2. `appointments`
Agendamentos de consultas.

```typescript
{
  id: string;                     // ID auto-gerado pelo Firestore
  userId: string;                 // ref: users.uid
  professionalId: string;         // ref: professionals.id
  professionalName: string;       // desnormalizado para exibição
  specialty: string;              // desnormalizado para exibição
  scheduledAt: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regras de acesso:** Usuário lê e edita os próprios. Admin lê e edita todos.

---

### 3. `professionals`
Diretório de profissionais de saúde.

```typescript
{
  id: string;
  name: string;
  specialty: string;
  categoryId: string;             // ref: categories.id
  registrationNumber: string;     // CRM / CRP
  city: string;
  state: string;
  consultationPrice: number;      // BRL
  rating: number;                 // 0–5
  reviewCount: number;
  bio?: string;
  avatarUrl?: string;
  whatsappNumber: string;         // para deep link de agendamento
  available: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

### 4. `partners`
Estabelecimentos parceiros com descontos para membros.

```typescript
{
  id: string;
  name: string;
  categoryId: string;             // ref: categories.id
  description: string;
  logoUrl?: string;
  discountDescription: string;    // ex: "15% em todos os produtos"
  whatsappNumber: string;         // para resgate do benefício
  website?: string;
  active: boolean;
  createdAt: Timestamp;
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

### 5. `categories`
Categorias compartilhadas entre profissionais e parceiros.

```typescript
{
  id: string;
  name: string;
  type: 'professional' | 'partner' | 'both';
  iconName: string;               // nome do ícone Lucide React
  order: number;                  // ordem de exibição
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

### 6. `exams`
Resultados e status de exames médicos dos usuários.

```typescript
{
  id: string;
  userId: string;                 // ref: users.uid
  name: string;                   // ex: "Hemograma Completo"
  type: string;                   // ex: "Sangue", "Imagem"
  status: 'pending' | 'ready' | 'scheduled';
  scheduledAt?: Timestamp;
  resultUrl?: string;             // URL do Firebase Storage
  resultFileName?: string;
  lab?: string;
  requestedBy?: string;           // nome do médico solicitante
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regras de acesso:** Usuário lê apenas os próprios. Criação, edição e exclusão somente por admin.

---

### 7. `offers`
Promoções vinculadas a parceiros.

```typescript
{
  id: string;
  partnerId: string;              // ref: partners.id
  title: string;
  description: string;
  imageUrl?: string;
  discount: number;               // percentual
  validUntil?: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

### 8. `pharmacies`
Farmácias com escala de plantão.

```typescript
{
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsappNumber?: string;
  onDutyDates: string[];          // datas ISO: ["2025-01-15", "2025-01-22"]
  openingHours: string;           // ex: "08:00–22:00"
  active: boolean;
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

### 9. `config` *(documento único)*
Configurações globais da aplicação.

```typescript
// Documento: /config/radio
{
  streamUrl: string;              // URL do stream de áudio do ViTTA Radio
}
```

**Regras de acesso:** Leitura pública. Escrita apenas por admin.

---

## Padrões de Consulta Firestore

Ao gerar consultas, siga sempre estes padrões:

```typescript
import { collection, query, where, onSnapshot, getDocs,
         addDoc, updateDoc, deleteDoc, doc, Timestamp,
         orderBy, limit, arrayContains } from 'firebase/firestore';
import { db } from '@/lib/firestore';

// Leitura em tempo real (preferencial para dashboard e listas)
const q = query(collection(db, 'appointments'), where('userId', '==', uid));
onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
});

// Farmácias de plantão hoje
const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
const q = query(collection(db, 'pharmacies'),
  where('onDutyDates', 'array-contains', today),
  where('active', '==', true));

// Criar documento
await addDoc(collection(db, 'appointments'), {
  ...data,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

// Atualizar documento
await updateDoc(doc(db, 'appointments', id), {
  status: 'confirmed',
  updatedAt: Timestamp.now(),
});
```

---

## Regras de Segurança do Firestore

As regras já estão publicadas no Firebase. Ao gerar lógica de frontend, respeite sempre:

| Coleção | Leitura | Escrita |
|---|---|---|
| `users/{userId}` | Próprio usuário ou admin | Próprio usuário ou admin |
| `appointments/{id}` | Dono do agendamento ou admin | Usuário autenticado (criar) / dono ou admin (editar) |
| `professionals` | Público | Somente admin |
| `partners` | Público | Somente admin |
| `categories` | Público | Somente admin |
| `pharmacies` | Público | Somente admin |
| `offers` | Público | Somente admin |
| `exams/{id}` | Dono do exame ou admin | Somente admin |

**Nunca gere código client-side que tente burlar estas regras.** As regras do Firestore são a fonte de verdade de segurança.

---

## Autenticação e Roles

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, loading, role, signIn, signOut, signUp } = useAuth();
// user   → Firebase User | null
// role   → 'user' | 'admin' | null  (vem do custom claim do Firebase Auth)
// loading → boolean
```

- **Role `user`:** acesso às rotas de usuário comum.
- **Role `admin`:** acesso total incluindo `/admin/*`.
- As roles são definidas via **custom claims** pelo Cloud Function `onUserCreate` (padrão: `user`) e `setAdminRole` (promoção a admin).
- **Nunca confie apenas no role do lado do cliente.** As Firestore Security Rules validam novamente no servidor.

---

## Firebase Storage

Arquivos de exames e avatares são armazenados no Firebase Storage existente.

```typescript
import { uploadBytes, getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/storage';

// Upload de resultado de exame
const fileRef = ref(storage, `exams/${userId}/${fileName}`);
await uploadBytes(fileRef, file);
const url = await getDownloadURL(fileRef);
// Salve `url` no campo `resultUrl` do documento em `exams/{id}`
```

---

## Cloud Functions Existentes

Não recrie estas funções. Elas já existem no projeto:

| Função | Gatilho | Ação |
|---|---|---|
| `onUserCreate` | Firebase Auth `onCreate` | Define role `user` e cria documento em `users` |
| `setAdminRole` | HTTPS callable | Promove usuário para admin (somente admins podem chamar) |
| `sendAppointmentNotification` | Firestore `onUpdate` em `appointments` | Envia push via FCM quando status muda para `confirmed` ou `cancelled` |

---

## Hooks Customizados Existentes

Reutilize sempre os hooks já criados:

```typescript
useAuth()              // Estado de autenticação e helpers
useFirestore<T>(col)   // CRUD genérico com onSnapshot
useAppointments()      // Agendamentos do usuário atual
useProfessionals()     // Lista com filterBySpecialty e search
usePartners()          // Lista de parceiros
useExams(userId)       // Exames do usuário, com getByStatus()
```

---

## Restrições e Boas Práticas

1. **Nunca inicialize um novo app Firebase.** Use sempre a instância de `lib/firebase.ts`.
2. **Nunca exponha credenciais Firebase no código.** Sempre use as variáveis `VITE_FIREBASE_*`.
3. **Prefira `onSnapshot` a `getDocs`** para dados exibidos em tela (mantém atualização em tempo real).
4. **Desnormalize com moderação.** Campos como `professionalName` e `specialty` em `appointments` são intencionais para evitar joins.
5. **Timestamps:** sempre use `Timestamp.now()` para `createdAt` e `updatedAt`. Nunca use `new Date()` diretamente no Firestore.
6. **Paginação:** Para listas longas (professionals, partners), use `limit()` e cursor-based pagination com `startAfter()`.
7. **Offline:** O app é uma PWA com service worker. Não force `getDocFromServer()` sem motivo explícito.
