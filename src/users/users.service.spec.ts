import { UsersService } from './users.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { DataSource, Repository } from 'typeorm';
import {
  dataSourceMockFactory,
  mockTransactionalEntityManager,
} from '../common/mock/mock.datasource';
import { MockType } from '../common/type/mock.type';

// 나머지 서비스 Mocking 설정
const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
});

const mockEmailService = () => ({
  sendVerificationEmail: jest.fn(),
});

// Record: java 의 map 과 비슷하게 key-value 로 구성된 자료형, Partial: 파라메터로 들어온 객체의 모든값을 optional 로 변경한다
// Repository 의 모든 함수를 mocking 하기 위한 Type 설정
// module.get 으로 가져올때에는 mocking 이 아닌 실 클래스를 가져오기 때문에 이를 mocking 함수로 변경
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let emailService: EmailService;
  let jwtService: JwtService;
  let dataSource: MockType<DataSource>;

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
          useValue: mockJwtService(),
        },
        {
          provide: EmailService,
          useValue: mockEmailService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@gmail,com',
      password: '111222',
      role: UserRole.Client,
    };

    const verificationResult = {
      code: 'testCode',
      user: createAccountArgs,
      createCode: jest.fn(),
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
      // 동일한 함수가 여러번 호출되는식으로 mocking 할때에는 ~ Once 를 사용
      mockTransactionalEntityManager.save
        .mockResolvedValueOnce(createAccountArgs)
        .mockResolvedValueOnce(verificationResult);
      const result = await service.createAccount(createAccountArgs);
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledTimes(2);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@gmail,com',
        'testCode'
      );

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
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ ok: true, token: 'signed-token-baby' });
    });
  });

  describe('findById', () => {
    const mockUser = {
      id: 1,
      email: 'test@gmail.com',
      role: 1,
      checkPassword: jest.fn(() => Promise.resolve(false)),
    };

    it('should find an existing user', async () => {
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: expect.any(Object) });
    });

    it('should fail if user not found', async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    const mockUser = {
      id: 1,
      email: 'test@gmail.com',
      password: 'old_password',
      emailVerified: true,
      role: 1,
      checkPassword: jest.fn(() => Promise.resolve(false)),
      hashPassword: jest.fn(() => Promise.resolve('new_password')),
    };

    it('should change email if email param input', async () => {
      // unit test 시에는 필요한 데이터만 만들어서 사용할것
      const editProfileArgs = {
        email: 'new_test@gmail.com',
      };

      const oldUser = {
        email: 'test@gmail.com',
        emailVerified: true,
      };

      const newUser = {
        email: 'new_test@gmail.com',
        emailVerified: false,
      };

      const newVerification = { code: 'code' };

      mockTransactionalEntityManager.findOne
        .mockResolvedValueOnce(oldUser)
        .mockResolvedValueOnce(undefined);
      verificationRepository.create.mockReturnValue(newVerification);
      mockTransactionalEntityManager.save
        .mockResolvedValueOnce(newVerification)
        .mockResolvedValueOnce(newUser);

      await service.editProfile(1, editProfileArgs);
      expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(
        User,
        {
          where: { id: 1 },
        }
      );

      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: { email: 'new_test@gmail.com', emailVerified: false },
      });

      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith(
        Verification,
        newVerification
      );
    });

    it('should update password if password param input', async () => {
      const editProfileArgs = {
        password: 'new password',
      };

      mockTransactionalEntityManager.findOne.mockResolvedValue(mockUser);
      await service.editProfile(1, editProfileArgs);
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledTimes(5);

      const updateMockUser = { ...mockUser, password: 'new password' };
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledTimes(5);
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith(
        User,
        updateMockUser
      );
    });

    it('should fail on exception', async () => {
      const editProfileArgs = {
        email: 'new_test@gmail.com',
      };
      dataSource.transaction.mockRejectedValue(new Error());
      const result = await service.editProfile(1, editProfileArgs);
      expect(result).toEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('verifyEmail', () => {
    const verificationResult = {
      id: 1,
      code: 'test_code',
      user: {
        id: 1,
        emailVerified: false,
      },
    };

    it('should verify email', async () => {
      mockTransactionalEntityManager.findOne.mockResolvedValue(
        verificationResult
      );
      const result = await service.verifyEmail('test_code');

      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith(
        User,
        verificationResult.user
      );
      expect(mockTransactionalEntityManager.delete).toHaveBeenCalledWith(
        Verification,
        { id: verificationResult.id }
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      dataSource.transaction.mockRejectedValue(new Error());
      const result = await service.verifyEmail('test_code');
      expect(result).toEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });
});
