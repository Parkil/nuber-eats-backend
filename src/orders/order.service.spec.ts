import {
  dataSourceMockFactory,
  mockImplModifyReturnValue,
  mockRepository,
  mockTransactionalEntityManager,
} from '../common/mock/mock.datasource';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { errorMsg, successMsg } from '../common/msg/msg.util';
import { MockRepository, MockType } from '../common/type/mock.type';
import { Order, OrderStatus } from './entites/order.entity';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';
import { OrderService } from './order.service';
import { PUB_SUB } from '../common/common.constants';

const mockRestaurantRepository = () => ({
  verifyOwner: jest.fn(),
  findOne: jest.fn(),
});

const mockPubSub = () => ({
  publish: jest.fn(),
});

const createParam = {
  restaurantId: 1,
  items: [
    {
      dishId: 1,
      options: [{ name: '패티 추가' }, { name: '감자튀김 추가' }],
    },
  ],
};

const updateParam = {
  id: 6,
  status: OrderStatus.Cooking,
};

const viewParam = {
  orderId: 6,
};

const takeOrderParam = {
  id: 6,
};

const mockUser = {
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

const mockRestaurant = {
  id: 1,
};

const mockDishes = [
  {
    id: 1,
    createdAt: '2023-12-01T23:10:15.605Z',
    updatedAt: '2023-12-01T23:10:15.605Z',
    name: '베이컨 버거',
    price: 12,
    photo: null,
    description: '한정 특가!',
    options: [
      {
        name: '패티 추가',
        extra: 1,
      },
      {
        name: '감자튀김 추가',
        extra: 2,
      },
      {
        name: '베이컨 추가',
        extra: 6,
      },
    ],
    restaurantId: 1,
  },
];

const mockOrder = {
  id: 6,
  createdAt: '2024-01-12T07:02:25.147Z',
  updatedAt: '2024-01-15T11:41:06.116Z',
  total: 21,
  status: 'Cooking',
  restaurant: {
    id: 1,
    createdAt: '2023-10-15T00:00:02.227Z',
    updatedAt: '2023-10-15T00:00:02.227Z',
    name: '맥도날드',
    coverImg:
      'https://tb-static.uber.com/prod/image-proc/processed_images/54554a83f0a2de9ac27c7ddc7d2ab616/97ef7458dde62fa918635bc21265d9f5.jpeg',
    address: '맥도날드 주소',
    isPromoted: false,
    promotedUntil: null,
    ownerId: 2,
  },
  customer: {
    id: 1,
    createdAt: '2023-12-01T11:22:04.508Z',
    updatedAt: '2023-12-01T11:22:04.508Z',
    email: 'client1@gmail.com',
    role: 'Client',
    emailVerified: false,
  },
  driver: {
    id: 3,
    createdAt: '2023-12-01T23:45:43.999Z',
    updatedAt: '2023-12-01T23:45:43.999Z',
    email: 'driver1@gmail.com',
    role: 'Delivery',
    emailVerified: false,
  },
  items: [
    {
      id: 5,
      createdAt: '2024-01-12T07:02:24.905Z',
      updatedAt: '2024-01-12T07:02:24.905Z',
      options: [
        {
          name: '패티 추가',
        },
        {
          name: '감자튀김 추가',
        },
        {
          name: '베이컨 추가',
        },
      ],
    },
  ],
  customerId: 1,
  driverId: 3,
};

describe('OrderService', () => {
  let dishRepository: MockRepository<Dish>;
  let orderRepository: MockRepository<Order>;
  let restaurantRepository: MockType<RestaurantRepository>;
  let orderService: OrderService;
  let dataSource: MockType<DataSource>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DataSource,
          useFactory: dataSourceMockFactory,
        },
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockRepository(),
        },
        {
          provide: RestaurantRepository,
          useValue: mockRestaurantRepository(),
        },
        {
          provide: PUB_SUB,
          useValue: mockPubSub(),
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    dishRepository = module.get(getRepositoryToken(Dish));
    orderRepository = module.get(getRepositoryToken(Order));
    restaurantRepository = module.get(RestaurantRepository);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  describe('createOrder', () => {
    it('should fail if restaurant not found', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.findOne.mockResolvedValue(undefined);

      const result = await orderService.createOrder(createParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if dish not found', async () => {
      const errorObj = errorMsg('Dish Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.findOne.mockResolvedValue(mockRestaurant);
      dishRepository.find.mockResolvedValue([]);

      const result = await orderService.createOrder(createParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should create a new dish', async () => {
      const tempObj = successMsg();
      const successObj = { ...tempObj, orderId: 999 };
      mockImplModifyReturnValue(dataSource, successObj);
      restaurantRepository.findOne.mockResolvedValue(mockRestaurant);
      dishRepository.find.mockResolvedValue(mockDishes);
      mockTransactionalEntityManager.save.mockResolvedValue({ id: 999 });

      const result = await orderService.createOrder(createParam, mockUser);
      expect(result).toEqual(successObj);
    });
  });

  describe('editOrder', () => {
    it('should fail if order not found', async () => {
      const errorObj = errorMsg('Order Info Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(undefined);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (client)', async () => {
      mockUser.role = UserRole.Client;
      mockUser.id = 3;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (owner)', async () => {
      mockUser.role = UserRole.Owner;
      mockUser.id = 4;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (driver)', async () => {
      mockUser.role = UserRole.Delivery;
      mockUser.id = 5;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if not applicable status(owner)', async () => {
      mockUser.role = UserRole.Owner;
      mockUser.id = 2;

      updateParam.status = OrderStatus.Pending;

      const errorObj = errorMsg('Cant edit status');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if not applicable status(driver)', async () => {
      mockUser.role = UserRole.Delivery;
      mockUser.id = 3;

      updateParam.status = OrderStatus.Cooking;

      const errorObj = errorMsg('Cant edit status');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should create a update dish', async () => {
      mockUser.role = UserRole.Owner;
      mockUser.id = 2;

      updateParam.status = OrderStatus.Cooking;

      const suchMsg = successMsg();
      mockImplModifyReturnValue(dataSource, suchMsg);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.editOrder(updateParam, mockUser);
      expect(result).toEqual(suchMsg);
    });
  });

  describe('viewOrder', () => {
    it('should fail if order not found', async () => {
      const errorObj = errorMsg('Order Info Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(undefined);

      const result = await orderService.viewOrder(viewParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (client)', async () => {
      mockUser.role = UserRole.Client;
      mockUser.id = 3;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.viewOrder(viewParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (owner)', async () => {
      mockUser.role = UserRole.Owner;
      mockUser.id = 4;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.viewOrder(viewParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if invalid approach (driver)', async () => {
      mockUser.role = UserRole.Delivery;
      mockUser.id = 5;

      const errorObj = errorMsg('Invalid Approach');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.viewOrder(viewParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should return order data', async () => {
      mockUser.role = UserRole.Owner;
      mockUser.id = 2;

      let suchMsg = successMsg();
      suchMsg = { ...suchMsg, orderInfo: mockOrder };
      mockImplModifyReturnValue(dataSource, suchMsg);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.viewOrder(viewParam, mockUser);
      expect(result).toEqual(suchMsg);
    });
  });

  describe('takeOrder', () => {
    it('should fail if order not found', async () => {
      const errorObj = errorMsg('Order Info Not Found');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(undefined);

      const result = await orderService.takeOrder(takeOrderParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should fail if order already taken', async () => {
      const errorObj = errorMsg('This Order already has a driver');
      mockImplModifyReturnValue(dataSource, errorObj);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.takeOrder(takeOrderParam, mockUser);
      expect(result).toEqual(errorObj);
    });

    it('should return order data', async () => {
      mockUser.role = UserRole.Delivery;
      mockUser.id = 2;

      const suchMsg = successMsg();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { driver: omitted, ...takeOrder } = mockOrder;

      mockImplModifyReturnValue(dataSource, suchMsg);
      orderRepository.findOne.mockResolvedValue(takeOrder);

      const result = await orderService.takeOrder(takeOrderParam, mockUser);
      expect(result).toEqual(suchMsg);
    });
  });
});
