import { JwtService } from './jwt.service';
import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from '../common/common.constants';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'testKey';
const TEST_TOKEN = 'testToken';
const USER_ID = 1;

// import 되는 외부 라이브러리를 mocking
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn().mockImplementation(() => TEST_TOKEN),
    verify: jest.fn().mockImplementation(() => ({ id: USER_ID })),
  };
});

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', async () => {
      const token = service.sign(USER_ID);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
      expect(token).toEqual(TEST_TOKEN);
    });
  });

  describe('verify', () => {
    it('should verify a token', async () => {
      const decodeToken = service.verify(TEST_TOKEN);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TEST_TOKEN, TEST_KEY);
      expect(decodeToken).toEqual({ id: USER_ID });
    });
  });
});
