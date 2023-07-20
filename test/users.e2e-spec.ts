import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Verification } from '../src/users/entities/verification.entity';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let userId: number;

  const GRAPHQL_ENDPOINT = '/graphql';
  const EMAIL = 'test111@gmail.com';
  const UPDATE_EMAIL = 'test222@gmail.com';
  const PASSWORD = '333444';
  const UPDATE_PASSWORD = '444555';

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification)
    );
    await app.init();
  });

  afterAll(async () => {
    // 모든 테스트가 종료되면 DB 초기화
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  describe('createAccount', () => {
    it('should create account', () => {
      const query = `
        mutation {
          createAccount(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
            role: Owner
          }) {
            ok
            error
          }
        }
      `;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      const query = `
        mutation {
          createAccount(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
            role: Owner
          }) {
            ok
            error
          }
        }
      `;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe(
            'There is a user with that email already'
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      const query = `
        mutation {
          login(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
          })
          {
            ok
            error
            token
          }
        }
      `;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be able login with wrong credentials', () => {
      const query = `
        mutation {
          login(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}-1",
          })
          {
            ok
            error
            token
          }
        }
      `;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toEqual(expect.any(String));
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    beforeAll(async () => {
      const user = await userRepository.findOne({
        where: {
          email: EMAIL,
        },
      });
      userId = user.id;
    });

    it('should see a users profile', () => {
      const query = `
        {
          userProfile(userId:${userId}) {
            ok
            error
            user {
              id
            }
          }
        }
      `;

      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      const query = `
        {
          userProfile(userId:99999) {
            ok
            error
            user {
              id
            }
          }
        }
      `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });
  describe('me', () => {
    it('should see my profile', () => {
      const query = `
        {
          me {
            email
          }
        }
      `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;

          expect(email).toBe(EMAIL);
        });
    });

    it('should not allow logged out user', () => {
      const query = `
        {
          me {
            email
          }
        }
      `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: { data, errors },
          } = res;

          expect(data).toBe(null);
          expect(errors[0].message).toEqual('Forbidden resource');
        });
    });
  });

  describe('verifyEmail', () => {
    let code: string;
    beforeAll(async () => {
      const verification = await verificationRepository.findOne({
        relations: ['user'],
        where: {
          user: {
            id: userId,
          },
        },
      });
      code = verification.code;
    });

    it('should not verify if code is incorrect', () => {
      const query = `mutation{
        verifyEmail(input: {
          code: "${code}-222"
        }){
          ok
          error
        }
      }`;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('Incorrect Code');
        });
    });

    it('should verify if code is correct', () => {
      const query = `mutation{
        verifyEmail(input: {
          code: "${code}"
        }){
          ok
          error
        }
      }`;

      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok },
              },
            },
          } = res;

          expect(ok).toBe(true);
        });
    });
  });

  describe('editProfile', () => {
    it('should fail if email already exist', () => {
      const query = `mutation{
        editProfile(input: {
          email: "${EMAIL}",
        }){
          ok
          error
        }
      }`;

      return privateTest(query)
        .expect(200)
        .expect(async (res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('duplicate email');
        });
    });

    it('should update email if email param input', () => {
      const query = `mutation{
        editProfile(input: {
          email: "${UPDATE_EMAIL}",
        }){
          ok
          error
        }
      }`;

      return privateTest(query)
        .expect(200)
        .expect(async (res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;

          const updateUser = await userRepository.findOne({
            where: {
              email: UPDATE_EMAIL,
            },
          });

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(updateUser.email).toBe(UPDATE_EMAIL);
          expect(updateUser.emailVerified).toBe(false);
        });
    });

    it('should update password if password param input', () => {
      const updatePassword = '444555';
      const query = `mutation{
        editProfile(input: {
          password: "${updatePassword}",
        }){
          ok
          error
        }
      }`;

      return privateTest(query)
        .expect(200)
        .expect(async (res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;

          const updateUser = await userRepository.findOne({
            where: {
              email: UPDATE_EMAIL,
            },
            select: ['password'],
          });

          const pwdChkResult = await updateUser.checkPassword(UPDATE_PASSWORD);

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(pwdChkResult).toBe(true);
        });
    });
  });
});
