import {
  dataSourceMockFactory,
  mockImplModifyReturnValue,
  mockRepository,
  mockTransactionalEntityManager,
} from '../common/mock/mock.datasource';
import { Dish } from './entities/dish.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Test } from '@nestjs/testing';
import { DishService } from './dish.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { errorMsg, successMsg } from '../common/msg/msg.util';
import { MockRepository, MockType } from '../common/type/mock.type';

const mockRestaurantRepository = () => ({
  verifyOwner: jest.fn(),
});

const createParam = {
  name: '메뉴 - 쫄면',
  price: 8,
  description: '두번째 메뉴',
  restaurantId: 1,
  options: [
    { name: '계란추가', extra: 1 },
    {
      name: '맵기',
      choices: [
        { name: '보통', extra: 1 },
        { name: '더 맵게', extra: 2 },
      ],
    },
    {
      name: '양',
      choices: [
        { name: '많이', extra: 1 },
        { name: '더 많이', extra: 2 },
      ],
    },
  ],
};

const updateParam = {
  name: 'aaabbbccc',
  price: 22,
  description: '333333->수정',
  dishId: 7,
  options: [
    { name: 'opt1-1', extra: 3 },
    {
      name: 'opt2-1',
      choices: [
        { name: 'subopt1-11', extra: 1 },
        { name: 'subopt2-11', extra: 2 },
      ],
    },
  ],
};

const deleteParam = {
  dishId: 5,
};

const mockOwnerUser = {
  id: 1,
  email: 'test@gmail.com',
  password: 'old_password',
  emailVerified: true,
  role: UserRole.Owner,
  checkPassword: jest.fn(() => Promise.resolve(true)),
  hashPassword: jest.fn(() => Promise.resolve()),
  restaurants: [],
  orders: [],
  rides: [],
  payments: [],
  createdAt: null,
  updatedAt: null,
};

describe('DishService', () => {
  let dishRepository: MockRepository<Dish>;
  let restaurantRepository: MockType<RestaurantRepository>;
  let dishService: DishService;
  let dataSource: MockType<DataSource>;

  /*
    Type 을 MockType 으로 감싸지 않으면 console.log 로 로그를 출력했을때에는 mocking 이
    된것으로 나와도 실제 mocking 함수를 사용하려고 하면 오류가 발생한다
   */
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DishService,
        {
          provide: DataSource,
          useFactory: dataSourceMockFactory,
        },
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
        {
          provide: RestaurantRepository,
          useValue: mockRestaurantRepository(),
        },
      ],
    }).compile();

    dishService = module.get<DishService>(DishService);
    dishRepository = module.get(getRepositoryToken(Dish));
    restaurantRepository = module.get(RestaurantRepository);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(dishService).toBeDefined();
  });

  describe('createDish', () => {
    it('should fail if restaurant not found', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.createDish(createParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found',
      });
    });

    it('should fail if restaurant is not mine', async () => {
      const errorObj = errorMsg('This restaurant doesnt belong to you');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.createDish(createParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'This restaurant doesnt belong to you',
      });
    });

    it('should create a new dish', async () => {
      const successObj = successMsg();
      mockImplModifyReturnValue(dataSource, successObj);
      restaurantRepository.verifyOwner.mockResolvedValue(successObj);
      mockTransactionalEntityManager.save.mockResolvedValue({});

      const result = await dishService.createDish(createParam, mockOwnerUser);
      expect(result).toEqual({
        ok: true,
        error: null,
      });
    });
  });

  describe('editDish', () => {
    it('should fail if dish not found', async () => {
      const errorObj = errorMsg('Dish Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue(undefined);

      const result = await dishService.editDish(updateParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Dish Not Found',
      });
    });

    it('should fail if restaurant not found', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.editDish(updateParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found',
      });
    });

    it('should fail if restaurant is not mine', async () => {
      const errorObj = errorMsg('This restaurant doesnt belong to you');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.editDish(updateParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'This restaurant doesnt belong to you',
      });
    });

    it('should update dish', async () => {
      const successObj = successMsg();
      mockImplModifyReturnValue(dataSource, successObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(successObj);
      mockTransactionalEntityManager.update.mockResolvedValue({});

      const result = await dishService.editDish(updateParam, mockOwnerUser);
      expect(result).toEqual({
        ok: true,
        error: null,
      });
    });
  });

  describe('deleteDish', () => {
    it('should fail if dish not found', async () => {
      const errorObj = errorMsg('Dish Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue(undefined);

      const result = await dishService.deleteDish(deleteParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Dish Not Found',
      });
    });

    it('should fail if restaurant not found', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.deleteDish(deleteParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found',
      });
    });

    it('should fail if restaurant is not mine', async () => {
      const errorObj = errorMsg('This restaurant doesnt belong to you');
      mockImplModifyReturnValue(dataSource, errorObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(errorObj);

      const result = await dishService.deleteDish(deleteParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'This restaurant doesnt belong to you',
      });
    });

    it('should delete dish', async () => {
      const successObj = successMsg();
      mockImplModifyReturnValue(dataSource, successObj);
      dishRepository.findOne.mockResolvedValue({ dishId: 1, restaurantId: 1 });
      restaurantRepository.verifyOwner.mockResolvedValue(successObj);
      dishRepository.delete.mockResolvedValue({});

      const result = await dishService.deleteDish(deleteParam, mockOwnerUser);
      expect(result).toEqual({
        ok: true,
        error: null,
      });
    });
  });
});
