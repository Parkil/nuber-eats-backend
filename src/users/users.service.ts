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
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
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

      await this.dataSource.transaction(async (entityManager) => {
        const user: User = await entityManager.save(
          this.users.create({ email, password, role })
        );

        const verification: Verification = await entityManager.save(
          this.verification.create({
            user,
          })
        );

        await this.emailService.sendVerificationEmail(
          user.email,
          verification.code
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

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ where: { id: id } });

      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
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

          const verification: Verification = await entityManager.save(
            Verification,
            this.verification.create({
              user,
            })
          );

          await this.emailService.sendVerificationEmail(
            email,
            verification.code
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
      // async 블록 내부에서 throw new Error 를 하게 되면 try~catch가 잘 작동하지 않는듯하다 이부분은 확인 필요
      const result = await this.dataSource.transaction(
        async (entityManager) => {
          const verification = await entityManager.findOne(Verification, {
            where: { code: code },
            // loadRelationIds: true, // loadRelationIds 관련 releation 의 id만 가져온다 이런점은 JPA 보다 나은듯
            relations: ['user'], // releation 전체를 불러온다
          });

          let execResult: boolean;

          if (verification) {
            verification.user.emailVerified = true;
            await entityManager.save(User, verification.user);
            await entityManager.delete(Verification, { id: verification.id });
            execResult = true;
          } else {
            execResult = false;
          }

          return execResult;
        }
      );

      if (result) {
        return {
          ok: true,
        };
      } else {
        return {
          ok: false,
          error: 'Incorrect Code',
        };
      }
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
    return await this.findById(userProfileInput.userId);
  }
}
