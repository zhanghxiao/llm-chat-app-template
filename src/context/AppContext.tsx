import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ClassData } from '../types';
import { defaultData } from '../data/defaultData';

interface AppContextType {
  data: ClassData;
  setData: (d: ClassData) => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClassData>(defaultData);

  return (
    <AppContext.Provider value={{ data, setData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
