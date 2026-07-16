"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { stockBySymbol, SAR_PER_USD } from "@/data/markets";

export { SAR_PER_USD };

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

const DEFAULT: State = {
  hydrated: false,
  cash: 92650.75,
  positions: {},
  watchlist: [],
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
          {
            id: `o${Date.now()}`,
            symbol: action.symbol,
            side: "buy" as const,
            units: action.units,
            price: action.price,
            ts: Date.now(),
          },
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
          {
            id: `o${Date.now()}`,
            symbol: action.symbol,
            side: "sell" as const,
            units: action.units,
            price: action.price,
            ts: Date.now(),
          },
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
      return { ...DEFAULT, hydrated: true };
    default:
      return state;
  }
}

type Ctx = State & {
  buy: (symbol: string, units: number, price: number) => void;
  sell: (symbol: string, units: number, price: number) => void;
  toggleWatch: (symbol: string) => void;
  reset: () => void;
  /** Re-pull the server-side portfolio (e.g. after an AI-executed trade). */
  refresh: () => Promise<void>;
};

const MarketContext = createContext<Ctx | null>(null);

async function persistPortfolio(state: State) {
  const { cash, positions, watchlist, orders } = state;
  await fetch("/api/markets/portfolio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cash, positions, watchlist, orders }),
  }).catch(() => undefined);
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT);
  // Skip persisting states that came FROM the server: hydrating must never PUT
  // back a snapshot (it would clobber server-side changes, e.g. AI trades).
  const skipPersist = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/markets/portfolio");
      if (!res.ok) {
        skipPersist.current = true;
        dispatch({ type: "HYDRATE", payload: {} });
        return;
      }
      const data = await res.json();
      skipPersist.current = true;
      dispatch({
        type: "HYDRATE",
        payload: {
          cash: data.cash,
          positions: data.positions ?? {},
          watchlist: data.watchlist ?? [],
          orders: data.orders ?? [],
        },
      });
    } catch {
      skipPersist.current = true;
      dispatch({ type: "HYDRATE", payload: {} });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    void persistPortfolio(state);
  }, [state]);

  const value: Ctx = {
    ...state,
    buy: (symbol, units, price) => dispatch({ type: "BUY", symbol, units, price }),
    sell: (symbol, units, price) => dispatch({ type: "SELL", symbol, units, price }),
    toggleWatch: (symbol) => dispatch({ type: "TOGGLE_WATCH", symbol }),
    reset: () => dispatch({ type: "RESET" }),
    refresh,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within <MarketProvider>");
  return ctx;
}
