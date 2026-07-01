"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { stockBySymbol } from "@/data/markets";

/** SAR per 1 USD — used to settle US trades from the single SAR wallet. */
export const SAR_PER_USD = 3.75;

export type Position = { units: number; avgCost: number };
export type Order = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  units: number;
  price: number;
  ts: number;
};

type State = {
  hydrated: boolean;
  cash: number;
  positions: Record<string, Position>;
  watchlist: string[];
  orders: Order[];
};

const SEED: State = {
  hydrated: false,
  cash: 92650.75,
  positions: {
    "2222": { units: 1200, avgCost: 24.5 },
    "1120": { units: 280, avgCost: 73.2 },
    AAPL: { units: 25, avgCost: 190.4 },
    NVDA: { units: 40, avgCost: 96.1 },
  },
  watchlist: ["2010", "TSLA", "1211"],
  orders: [],
};

type Action =
  | { type: "HYDRATE"; payload: Partial<State> }
  | { type: "BUY"; symbol: string; units: number; price: number }
  | { type: "SELL"; symbol: string; units: number; price: number }
  | { type: "TOGGLE_WATCH"; symbol: string }
  | { type: "RESET" };

function sarCost(symbol: string, units: number, price: number) {
  const stock = stockBySymbol(symbol);
  const fx = stock?.market === "us" ? SAR_PER_USD : 1;
  return units * price * fx;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };
    case "BUY": {
      const cost = sarCost(action.symbol, action.units, action.price);
      if (cost > state.cash) return state;
      const prev = state.positions[action.symbol];
      const units = (prev?.units ?? 0) + action.units;
      const avgCost = prev
        ? (prev.avgCost * prev.units + action.price * action.units) / units
        : action.price;
      return {
        ...state,
        cash: state.cash - cost,
        positions: { ...state.positions, [action.symbol]: { units, avgCost } },
        orders: [
          { id: `o${Date.now()}`, symbol: action.symbol, side: "buy" as const, units: action.units, price: action.price, ts: Date.now() },
          ...state.orders,
        ].slice(0, 40),
      };
    }
    case "SELL": {
      const prev = state.positions[action.symbol];
      if (!prev || prev.units < action.units) return state;
      const proceeds = sarCost(action.symbol, action.units, action.price);
      const remaining = prev.units - action.units;
      const positions = { ...state.positions };
      if (remaining <= 0) delete positions[action.symbol];
      else positions[action.symbol] = { units: remaining, avgCost: prev.avgCost };
      return {
        ...state,
        cash: state.cash + proceeds,
        positions,
        orders: [
          { id: `o${Date.now()}`, symbol: action.symbol, side: "sell" as const, units: action.units, price: action.price, ts: Date.now() },
          ...state.orders,
        ].slice(0, 40),
      };
    }
    case "TOGGLE_WATCH": {
      const has = state.watchlist.includes(action.symbol);
      return {
        ...state,
        watchlist: has
          ? state.watchlist.filter((s) => s !== action.symbol)
          : [action.symbol, ...state.watchlist],
      };
    }
    case "RESET":
      return { ...SEED, hydrated: true };
    default:
      return state;
  }
}

const STORAGE_KEY = "naqd-market-v1";

type Ctx = State & {
  buy: (symbol: string, units: number, price: number) => void;
  sell: (symbol: string, units: number, price: number) => void;
  toggleWatch: (symbol: string) => void;
  reset: () => void;
};

const MarketContext = createContext<Ctx | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, SEED);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) });
      else dispatch({ type: "HYDRATE", payload: {} });
    } catch {
      dispatch({ type: "HYDRATE", payload: {} });
    }
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!state.hydrated) return;
    const { cash, positions, watchlist, orders } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cash, positions, watchlist, orders }));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  const value: Ctx = {
    ...state,
    buy: (symbol, units, price) => dispatch({ type: "BUY", symbol, units, price }),
    sell: (symbol, units, price) => dispatch({ type: "SELL", symbol, units, price }),
    toggleWatch: (symbol) => dispatch({ type: "TOGGLE_WATCH", symbol }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within <MarketProvider>");
  return ctx;
}
