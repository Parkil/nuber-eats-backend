import { EmailService } from './email.service';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { Test } from '@nestjs/testing';

const emailOption = {
  apiKey: 'test_api_key',
  emailDomain: 'test_domain',
  fromEmail: 'from@gmail.com',
};

const TO_EMAIL = 'to@gmail.com';
const CODE = 'test_code';

jest.mock('superagent', () => {
  return {
    post: jest.fn(() => ({
      set: jest.fn(),
      field: jest.fn(),
    })),
    end: jest.fn(),
  };
});

jest.mock('superagent', () => {
  return {
    post: jest.fn(() => ({
      set: jest.fn(),
      field: jest.fn(() => ({
        field: jest.fn(() => ({
          field: jest.fn(() => ({
            field: jest.fn(() => ({
              field: jest.fn(),
            })),
          })),
        })),
      })),
    })),
    end: jest.fn(),
  };
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: emailOption,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      await service.sendVerificationEmail(TO_EMAIL, CODE);
      expect(service.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(service.sendVerificationEmail).toHaveBeenCalledWith(
        TO_EMAIL,
        CODE
      );
    });
  });
});
