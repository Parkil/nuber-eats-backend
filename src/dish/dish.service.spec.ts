import {
  mockRepository,
  MockRepository,
  MockType,
} from '../common/mock/mock.datasource';
import { Dish } from './entities/dish.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Test } from '@nestjs/testing';
import { DishService } from './dish.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/user.entity';

const mockRestaurantRepository = () => ({
  verifyOwner: jest.fn(),
  test111: jest.fn(),
});

describe('DishService', () => {
  let dishRepository: MockRepository<Dish>;
  let restaurantRepository: MockType<RestaurantRepository>;
  let dishService: DishService;

  /*
    Type 을 MockType 으로 감싸지 않으면 console.log 로 로그를 출력했을때에는 mocking 이
    된것으로 나와도 실제 mocking 함수를 사용하려고 하면 오류가 발생한다
   */

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DishService,
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
  });

  it('should be defined', () => {
    expect(dishService).toBeDefined();
  });

  describe('createDish', () => {
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

    const mockOwnerUser = {
      id: 1,
      email: 'test@gmail.com',
      password: 'old_password',
      emailVerified: true,
      role: UserRole.Owner,
      checkPassword: jest.fn(() => Promise.resolve(false)),
      hashPassword: jest.fn(() => Promise.resolve()),
      restaurants: [],
      orders: [],
      rides: [],
      payments: [],
      createdAt: null,
      updatedAt: null,
    };

    it('should fail if restaurant not found', async () => {
      restaurantRepository.verifyOwner.mockRejectedValue(
        'Restaurant not found'
      );

      const result = await dishService.createDish(createParam, mockOwnerUser);
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found',
      });
    });
  });
});
