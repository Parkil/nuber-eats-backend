import { DataSource } from 'typeorm';
import { MockType } from '../type/mock.type';

/*
  datasource.transaction 내부의 transactionalEntityManager mocking
  특이한게 이것만 mocking 해도 transaction 내부의 로직이 mocking 이 된다
 */
export const mockTransactionalEntityManager = {
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

export const dataSourceMockFactory: () => MockType<DataSource> = jest.fn(
  () => ({
    createQueryRunner: jest.fn(),
    getRepository: jest.fn(),
    transaction: jest.fn().mockImplementation((cb) => {
      try {
        cb(mockTransactionalEntityManager);
      } catch (e) {
        throw new Error();
      }
    }),
  })
);

export const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

/*
  dataSourceMockFactory 에서 mocking 한 transaction 의 return value 를 mocking 해야 하는 경우가 있는데
  이를 dataSourceMockFactory 호출 당시에는 mocking 할 수 있는 방법이 없어서 return 값을 호출시마다 수동으로 변경하는 api 구현
*/
export const mockImplModifyReturnValue = (datasource : MockType<DataSource>, retValue: any) => {
  datasource.transaction.mockImplementationOnce((cb) => {
    try {
      cb(mockTransactionalEntityManager);
    } catch (e) {
      throw new Error();
    }

    return retValue;
  });
}
