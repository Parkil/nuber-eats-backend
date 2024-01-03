import { Repository } from 'typeorm';

export type MockType<T> = Partial<Record<keyof T, jest.Mock>>;

export type MockRepository<T = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;
