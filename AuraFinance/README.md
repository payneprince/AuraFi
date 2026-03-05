# Aura Finance - Complete Financial Ecosystem

Aura Finance is a unified financial platform that connects multiple standalone applications: AuraBank, AuraVest, and AuraWallet, providing a seamless experience with shared authentication, data, and AI-powered insights.

## Architecture

```
aurafinance/
├── aurafinance/             # Main hub (SSO, dashboard, navigation)
├── aurabank/                # Standalone app (banking services)
├── auravest/                # Standalone app (investing platform)
├── aurawallet/              # Standalone app (digital payments)
├── shared/
│   ├── mock-data.js        # Centralized mock user & financial data
│   ├── auth-utils.js       # Session validation logic
│   └── auraai-core.js      # Reusable AI insight engine
└── README.md               # Demo instructions + design notes
```

## Features

- **Single Login**: Authenticate once in Aura Finance and access all products
- **Unified Dashboard**: Overview of all financial accounts and activities
- **Shared Data**: Consistent financial data across all applications
- **AuraAI Integration**: AI-powered insights in banking, investing, and payments
- **Simulated Transfers**: Transfer funds between products seamlessly

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aurafinance
```

2. Install dependencies for each application:

```bash
# Main hub
npm install

# AuraBank
cd ../AuraBank
npm install

# AuraVest
cd ../AuraVest
npm install

# AuraWallet
cd ../AuraWallet
npm install
```

3. Set up environment variables:
   - Copy `.env.local` in aurafinance and set NEXTAUTH_SECRET and NEXTAUTH_URL

### Running the Applications

Start each application in separate terminals:

```bash
# Aura Finance (port 3000)
npm run dev

# AuraBank (port 3001)
cd ../AuraBank
npm run dev -p 3001

# AuraVest (port 3002)
cd ../AuraVest
npm run dev -p 3002

# AuraWallet (port 3003)
cd ../AuraWallet
npm run dev -p 3003
```

### Usage

1. Visit http://localhost:3000
2. Click "Get Started Free" to login
3. Use demo credentials: email: user@example.com, password: password
4. Access the dashboard to view all products
5. Click on product links to navigate to individual apps

## Applications

### Aura Finance (Main Hub)
- Landing page with product overview
- Authentication system
- Unified dashboard
- Navigation to standalone apps

### AuraBank
- Account management
- Transaction history
- Transfer capabilities
- AI-powered banking insights

### AuraVest
- Investment portfolio
- Trading interface
- Market analytics
- Investment recommendations

### AuraWallet
- Digital payments
- P2P transfers
- QR code payments
- Multi-currency support

## Shared Resources

### Mock Data (`shared/mock-data.js`)
- User profiles
- Bank accounts and transactions
- Investment portfolios
- Wallet balances and transactions
- Transfer simulation functions

### Auth Utils (`shared/auth-utils.js`)
- User validation
- Session management
- Authentication helpers

### AuraAI Core (`shared/auraai-core.js`)
- Banking insights
- Investment analysis
- Wallet recommendations
- Overall financial advice

## Development

Each application is a separate Next.js project with:
- TypeScript
- Tailwind CSS
- ShadCN UI components
- Shared data integration

## Demo Instructions

1. Start all applications as described above
2. Login to Aura Finance
3. Explore the dashboard
4. Navigate to individual product dashboards
5. Test transfers between products
6. View AI insights in each app

## Design Notes

- Consistent UI/UX across all applications
- Dark theme with teal/magenta accent colors
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Accessible components

## Technologies Used

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- NextAuth.js
- ShadCN UI
- Framer Motion
- Lucide Icons
