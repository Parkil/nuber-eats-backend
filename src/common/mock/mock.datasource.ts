import { DataSource } from 'typeorm';

/*
  datasource.transaction 내부의 transactionalEntityManager mocking
  특이한게 이것만 mocking 해도 transaction 내부의 로직이 mocking이 된다
 */
export const mockTransactionalEntityManager = {
  save: jest.fn(),
};

export const dataSourceMockFactory: () => MockType<DataSource> = jest.fn(
  () => ({
    createQueryRunner: jest.fn(),
    getRepository: jest.fn(),
    transaction: jest.fn().mockImplementation((cb) => {
      cb(mockTransactionalEntityManager);
    }),
  })
);

export type MockType<T> = Partial<Record<keyof T, jest.Mock>>;
