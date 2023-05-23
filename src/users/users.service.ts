import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({
        where: {
          email: email,
        },
      });

      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }

      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const user = await transactionalEntityManager.save(
          this.users.create({ email, password, role })
        );

        await transactionalEntityManager.save(
          this.verification.create({
            user,
          })
        );
      });

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'can not create account' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: {
          email: email,
        },
        select: ['password', 'id'], // password, id 컬럼을 가져오도록 명시적으로 정의
      });

      if (!user) {
        return { ok: false, error: 'User Not Found' };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: 'Wrong Password' };
      }

      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token: token,
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<User> {
    return await this.users.findOne({ where: { id: id } });
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput
  ): Promise<EditProfileOutput> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        const user = await entityManager.findOne(User, {
          where: { id: userId },
        });

        if (email) {
          user.email = email;
          user.emailVerified = false;

          await entityManager.save(
            Verification,
            this.verification.create({
              user,
            })
          );
        }

        if (password) {
          user.password = password;
        }

        await entityManager.save(User, user);
      });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        const verification = await entityManager.findOne(Verification, {
          where: { code: code },
          // loadRelationIds: true, // loadRelationIds 관련 releation 의 id만 가져온다 이런점은 JPA 보다 나은듯
          relations: ['user'], // releation 전체를 불러온다
        });

        if (verification) {
          verification.user.emailVerified = true;
          await entityManager.save(User, verification.user);
        }
      });

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async userProfile(
    userProfileInput: UserProfileInput
  ): Promise<UserProfileOutput> {
    const errorObj = {
      error: 'User Not Found',
      ok: false,
    };

    try {
      const user = await this.findById(userProfileInput.userId);
      if (!user) {
        return errorObj;
      }

      return {
        ok: true,
        user,
      };
    } catch (e) {
      return errorObj;
    }
  }
}
