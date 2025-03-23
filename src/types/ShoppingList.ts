export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  checked: boolean;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: Item[];
  total?: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export type FilterOptions = {
  completed?: boolean;
  category?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}; 