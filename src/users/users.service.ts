import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';

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
  }: CreateAccountInput): Promise<{ error?: string; ok: boolean }> {
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

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      const user = await this.users.findOne({
        where: {
          email: email,
        },
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
  ): Promise<User> {
    const user = await this.users.findOne({
      where: {
        id: userId,
      },
    });

    if (email) {
      user.email = email;
      user.emailVerified = false;

      await this.verification.save(
        this.verification.create({
          user,
        })
      );
    }

    if (password) {
      user.password = password;
    }

    return this.users.save(user);
  }
}
