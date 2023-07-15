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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
            {
              userProfile(userId:${userId}) {
                ok
                error
                user {
                  id
                }
              }
            }
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
            {
              userProfile(userId:99999) {
                ok
                error
                user {
                  id
                }
              }
            }
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
            {
              me {
                email
              }
            }
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            {
              me {
                email
              }
            }
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `mutation{
            verifyEmail(input: {
              code: "${code}-222"
            }){
              ok
              error
            }
          }`,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `mutation{
            verifyEmail(input: {
              code: "${code}"
            }){
              ok
              error
            }
          }`,
        })
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
    it('should update email if email param input', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `mutation{
            editProfile(input: {
              email: "${UPDATE_EMAIL}",
            }){
              ok
              error
            }
          }`,
        })
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

      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `mutation{
            editProfile(input: {
              password: "${updatePassword}",
            }){
              ok
              error
            }
          }`,
        })
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
