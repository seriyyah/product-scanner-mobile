# Product Scanner Mobile

React Native mobile app built with Expo and TypeScript.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Update the `.env` file with your API endpoint if needed (defaults to `http://localhost:8000`)

## Development

Start the development server:
```bash
npm start
```

Run on specific platforms:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator  
npm run web      # Web browser
```

## Scripts

```bash
npm test         # Run tests
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## Build

```bash
expo build:ios     # iOS build
expo build:android # Android build
```