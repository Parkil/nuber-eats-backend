import { UsersService } from './users.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';

// 나머지 서비스 Mocking 설정
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

// DataSource Mocking 설정 - 이부분도 MockRepository 처럼 간단하게 처리할수 있지 않나?
const qr = {
  manager: {},
} as QueryRunner;

class ConnectionMock {
  createQueryRunner(): QueryRunner {
    Object.assign(qr.manager, { save: jest.fn() });

    qr.startTransaction = jest.fn();
    qr.commitTransaction = jest.fn();
    qr.rollbackTransaction = jest.fn();
    qr.release = jest.fn();

    return qr;
  }
}

// Record: java 의 map 과 비슷하게 key-value 로 구성된 자료형, Partial: 파라메터로 들어온 객체의 모든값을 optional 로 변경한다
// Repository 의 모든 함수를 mocking 하기 위한 Type 설정
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeAll(async () => {
    // mock 객체를 DI 하기위한 설정
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DataSource,
          useClass: ConnectionMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository,
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should fail if user exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });

      const result = await service.createAccount({
        email: 'test@gmail,com',
        password: '111222',
        role: 0,
      });

      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });
  });

  it.todo('createAccount');
  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
  it.todo('verifyEmail');
  it.todo('userProfile');
});
