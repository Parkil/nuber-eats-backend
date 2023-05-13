import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // Query root type must be provided. -> resolver에 @Query가 1개도 없으면 오류 발생
  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  async userProfile(
    @Args() userProfileInput: UserProfileInput
  ): Promise<UserProfileOutput> {
    try {
      console.log('3333');
      const user = await this.usersService.findById(userProfileInput.userId);
      if (!user) {
        throw Error();
      }

      return {
        ok: true,
        user,
      };
    } catch (e) {
      return {
        error: 'User Not Found',
        ok: false,
      };
    }
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User): User {
    console.log(authUser);
    return authUser;
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput
  ): Promise<CreateAccountOutput> {
    try {
      return await this.usersService.createAccount(createAccountInput);
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return await this.usersService.login(loginInput);
    } catch (e) {
      return {
        ok: false,
        error: e,
        token: null,
      };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput
  ): Promise<EditProfileOutput> {
    try {
      await this.usersService.editProfile(authUser.id, editProfileInput);
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
}
