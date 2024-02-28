import {
  dataSourceMockFactory,
  mockImplModifyReturnValue,
  mockRepository,
} from '../common/mock/mock.datasource';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { MockType } from '../common/type/mock.type';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { errorMsg, successMsg } from '../common/msg/msg.util';

const mockRestaurantRepository = () => ({
  verifyOwner: jest.fn(),
  findOne: jest.fn(),
});

const createParam = {
  transactionId: '111222333',
  restaurantId: 1,
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
  ownerId: 2,
};

describe('PaymentService', () => {
  let dataSource: MockType<DataSource>;
  let restaurantRepository: MockType<RestaurantRepository>;
  let paymentsService: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: DataSource,
          useFactory: dataSourceMockFactory,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository(),
        },
        {
          provide: RestaurantRepository,
          useValue: mockRestaurantRepository(),
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    restaurantRepository = module.get(RestaurantRepository);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(paymentsService).toBeDefined();
  });

  describe('createPayment', () => {
    it('should fail if restaurant not found', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.findOne.mockResolvedValue(undefined);

      const result = await paymentsService.createPayments(
        createParam,
        mockUser
      );
      expect(result).toEqual(errorObj);
    });

    it('should fail if not belongs owner', async () => {
      const errorObj = errorMsg('Restaurant not found');
      mockImplModifyReturnValue(dataSource, errorObj);
      restaurantRepository.findOne.mockResolvedValue(mockRestaurant);

      const result = await paymentsService.createPayments(
        createParam,
        mockUser
      );
      expect(result).toEqual(errorObj);
    });

    it('should create a new payment', async () => {
      const tempObj = successMsg();
      mockImplModifyReturnValue(dataSource, tempObj);
      restaurantRepository.findOne.mockResolvedValue(mockRestaurant);

      const result = await paymentsService.createPayments(
        createParam,
        mockUser
      );
      expect(result).toEqual(tempObj);
    });
  });
});

