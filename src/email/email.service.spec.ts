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

// superagent mocking
jest.mock('superagent', () => {
  let mockDelay;
  let mockError;
  let mockResponse = {
    status: jest.fn().mockReturnValue(200),
    ok: true,
    get: jest.fn(),
    toError: jest.fn(),
    body: {},
  };

  return {
    post: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    field: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    accept: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    end: jest.fn().mockImplementation(function (callback) {
      if (mockDelay) {
        this.delayTimer = setTimeout(callback, 0, mockError, mockResponse);
        return;
      }
      callback(mockError, mockResponse);
    }),

    __setMockDelay: function (boolValue) {
      mockDelay = boolValue;
    },
    __setMockResponse: function (mockRes) {
      mockResponse = mockRes;
    },
    __setMockError: function (mockErr) {
      mockError = mockErr;
    },
    __setMockResponseBody: function (body) {
      mockResponse.body = body;
    },
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
      // DI 단계에서 mocking 을 하지 않고 함수를 mocking 하는 방법
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {
        console.log('spyOn test');
      });

      await service.sendVerificationEmail(TO_EMAIL, CODE);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'confirm',
        TO_EMAIL,
        [
          { key: 'v:user_name', value: 'pu-haha' },
          { key: 'v:code', value: CODE },
        ]
      );
    });
  });
});
