import { UsersService } from './users.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { DataSource, Repository } from 'typeorm';
import {
  dataSourceMockFactory,
  mockTransactionalEntityManager,
} from '../common/mock/mock.datasource';

// 나머지 서비스 Mocking 설정
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

// Record: java 의 map 과 비슷하게 key-value 로 구성된 자료형, Partial: 파라메터로 들어온 객체의 모든값을 optional 로 변경한다
// Repository 의 모든 함수를 mocking 하기 위한 Type 설정
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let dataSource: DataSource;
  let emailService: EmailService;

  beforeEach(async () => {
    // mock 객체를 DI 하기위한 설정
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DataSource,
          useFactory: dataSourceMockFactory,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@gmail,com',
      password: '111222',
      role: 0,
    };

    it('should fail if user exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });

      const result = await service.createAccount(createAccountArgs);

      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      // mockResolvedValue 는 mocking method 호출전에 정의 할것
      userRepository.findOne.mockResolvedValue(undefined);
      mockTransactionalEntityManager.save.mockResolvedValue(createAccountArgs);

      const result = await service.createAccount(createAccountArgs);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledTimes(2);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: 'can not create account' });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@gmail.com',
      password: '111222',
    };

    it('should fail if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(undefined);
      const result = await service.login(loginArgs);
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });

    it('should fail on exception', async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: expect.any(Error) });
    });

    it('should fail if password is wrong', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: 'Wrong Password' });
    });

    it('should return token if password is correct', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('gen token');
      const result = await service.login(loginArgs);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ ok: true, token: expect.any(String) });
    });
  });

  it.todo('findById');
  it.todo('editProfile');
  it.todo('verifyEmail');
  it.todo('userProfile');
});
