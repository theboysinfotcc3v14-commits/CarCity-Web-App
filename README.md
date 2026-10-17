# CarCity Web - Telemetria & Proteção Automotiva

Reconstrução corporativa full-stack do ecossistema CarCity com controle de acesso baseado em papéis (RBAC), telemetria veicular IoT, mapa colaborativo com manchas de risco em âmbar, modo pânico 5KM, gestão de oficinas credenciadas B2B, portal CMS editorial e assistente virtual automotivo 24h alimentado pelo Google Gemini.

---

## 1. Árvore de Diretórios

```text
├── .env.example                       # Variáveis de ambiente de produção
├── index.html                         # Entrypoint HTML com tokens e fontes Inter / JetBrains Mono
├── metadata.json                      # Metadados e capacidades da plataforma
├── package.json                       # Scripts e dependências
├── server.ts                          # Servidor full-stack Express & Vite middleware
├── server/
│   ├── db/
│   │   ├── schema.sql                 # DDL do MariaDB 10.11+ InnoDB utf8mb4
│   │   └── store.ts                   # Camada de banco de dados e simulações
│   ├── lib/
│   │   └── auth.ts                    # Validação de JWT (HS256) e RBAC autoritativo
│   └── routes/
│       ├── auth.ts                    # Login, 2FA, JWT inspector e temas
│       ├── vehicles.ts                # Telemetria, gráfico de viagens e comandos IoT
│       ├── riskReports.ts             # GPS colaborativo e mapa de calor
│       ├── workshops.ts               # Cadastro B2B, anti-fraude e descontos
│       ├── appointments.ts            # Central de agendamentos e orçamentos
│       ├── community.ts               # Fórum técnico e tutoriais DIY
│       ├── articles.ts                # CMS de notícias e categorias
│       ├── admin.ts                   # Moderação, equipe, auditoria e lixeira
│       └── ai.ts                      # Suporte VIP 24h via Google Gemini
├── src/
│   ├── App.tsx                        # Roteamento baseado em RBAC e sessões
│   ├── index.css                      # Tokens da paleta "Seguro Corporativo"
│   ├── main.tsx                       # Bootstrap React
│   ├── context/
│   │   └── AppContext.tsx             # Estado global, veículos e tema
│   ├── types/
│   │   └── index.ts                   # Modelos de domínio TypeScript
│   └── components/
│       ├── Header.tsx                 # Topbar corporativa, seletor de veículo e badge
│       ├── Navigation.tsx             # Navegação adaptativa Desktop e Mobile Bottom Bar
│       ├── JwtInspectorModal.tsx      # Inspetor em tempo real do JWT e permissões RBAC
│       ├── NotificationDrawer.tsx     # Gaveta de alertas com banner prioritário
│       ├── AiAssistantModal.tsx       # Suporte IA 24h com Gemini 3.8 Flash
│       ├── AccessDeniedView.tsx       # Tela de bloqueio por autorização
│       ├── auth/
│       │   └── AuthView.tsx           # Login por papel (CPF, CNPJ, 2FA TOTP/WebAuthn)
│       ├── driver/
│       │   ├── DriverDashboard.tsx    # Gráfico Recharts, HUD 3D e simulador IoT
│       │   ├── GpsRiskMap.tsx         # Mapa com manchas de calor e cerceamento 5KM
│       │   ├── CommandCenter.tsx      # Corte de motor remoto e Modo Pânico
│       │   ├── CommunityView.tsx      # Fórum e Tutoriais DIY com YouTube API
│       │   └── DriverAppointmentsView.tsx # Agendamentos e chat com oficina
│       ├── workshop/
│       │   └── WorkshopView.tsx       # Vitrine, Kanban de orçamentos e selo anti-fraude
│       ├── cms/
│       │   └── CmsAdminView.tsx       # Gestão de notícias, moderação e analytics
│       └── superadmin/
│           └── SuperAdminView.tsx     # Painel mestre, equipe, fila audit e lixeira
└── tests/
    └── rbac_and_telemetry.test.ts     # Suíte de testes automatizados
```

---

## 2. Perfis de Acesso & Matriz RBAC

| Papel | Credenciais de Login | Acesso Principal |
| :--- | :--- | :--- |
| **DRIVER** | CPF (`123.456.789-00`) ou e-mail + Senha | Painel IoT, Telemetria, GPS Riscos, Modo Pânico, Comunidade, Agendamentos e Suporte IA |
| **WORKSHOP_OWNER** | CNPJ (`12.345.678/0001-90`) + Senha | Vitrine da Oficina, Central de Orçamentos, Selo Anti-Fraude e Gestão de Ofertas |
| **ADMIN** | E-mail corporativo + Senha + 2FA TOTP (`123456`) | CMS Artigos, Moderação de Conteúdo e Analytics de Tráfego |
| **SUPER_ADMIN** | E-mail master + Senha + 2FA WebAuthn/TOTP (`123456`) | Painel Mestre, Trilha de Auditoria, Equipe Admin, Fila de Oficinas, Lixeira Central e Modo Auditor |

> **Senha padrão para todos os usuários de teste:** `password123`

---

## 3. Identidade Visual: "Seguro Corporativo"

- **Fundo Principal:** `#0B1A2E` (Escuro) / `#F3F6FA` (Claro)
- **Superfície de Cartão:** `#12273F` sólida (sem glassmorphism) / `#FFFFFF`
- **Primária (Ação):** `#3A76C2` / `#1F4E8C`
- **Protegido / Conectado / Verificado:** `#2FA67A` / `#17805A`
- **Pânico / Emergência:** `#E5484D` / `#B42318`
- **Risco Preventivo & Heatmap:** `#E09F3E` / `#B54708`
- **Telemetria & GPS:** `#5DA9E9` / `#2B6CB0`
- **Premium (Plano Advanced):** `#D4AF37` / `#B8860B`
- **Tipografia:** Inter na interface e JetBrains Mono em placas e telemetrias.

---

## 4. Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Executar suíte de testes unitários e de integração
npm test

# 3. Iniciar servidor em desenvolvimento (Porta 3000)
npm run dev
```

---

## 5. Como Fazer Deploy

### Deploy na Vercel (Repositório GitHub)
1. Vincule o repositório no dashboard da Vercel.
2. Defina as variáveis de ambiente baseadas em `.env.example`:
   - `DATABASE_URL`: URI de conexão TLS do MariaDB 10.11+.
   - `JWT_SECRET`: Chave secreta de 64 caracteres para tokens HS256.
   - `GEMINI_API_KEY`: Chave da API Google Gemini.
   - `APP_URL`: Domínio da aplicação na Vercel.
3. As migrações do banco de dados utilizam o script SQL versionado em `server/db/schema.sql`.
