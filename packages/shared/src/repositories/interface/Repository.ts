export interface Repository<TSelect, TInsert> {
  findAll(): Promise<TSelect[]>;
  findById(id: string): Promise<TSelect | null>;
  findWhere<K extends keyof TSelect>(field: K, operator: string, value: TSelect[K]): Promise<TSelect[]>;
  create(data: TInsert): Promise<TSelect>;
  update(id: string, data: Partial<TSelect>): Promise<void>;
  delete(id: string): Promise<void>;
}
