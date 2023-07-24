import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import {
  CreateRestaurantsInput,
  CreateRestaurantsOutput,
} from './dtos/create-restaurants.input';
import { RestaurantService } from './restaurant.service';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateRestaurantsOutput)
  @UseGuards(AuthGuard)
  async createRestaurant(
    @Args('input') createRestaurantsInput: CreateRestaurantsInput,
    @AuthUser() authUser: User
  ): Promise<CreateRestaurantsOutput> {
    return await this.restaurantService.createRestaurant(
      createRestaurantsInput,
      authUser
    );
  }
}
