import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import {
  CreateRestaurantsInput,
  CreateRestaurantsOutput,
} from './dtos/create-restaurants.input';
import { RestaurantService } from './restaurant.service';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/role.decorator';
import {
  EditRestaurantsInput,
  EditRestaurantsOutput,
} from './dtos/edit-restaurants.input';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Role(['Owner'])
  @Mutation(() => CreateRestaurantsOutput)
  async createRestaurant(
    @Args('input') createRestaurantsInput: CreateRestaurantsInput,
    @AuthUser() authUser: User
  ): Promise<CreateRestaurantsOutput> {
    return await this.restaurantService.createRestaurant(
      createRestaurantsInput,
      authUser
    );
  }

  @Role(['Owner'])
  @Mutation(() => EditRestaurantsOutput)
  async editRestaurant(
    @Args('input') editRestaurantsInput: EditRestaurantsInput,
    @AuthUser() authUser: User
  ): Promise<EditRestaurantsOutput> {
    return await this.restaurantService.editRestaurant(
      editRestaurantsInput,
      authUser
    );
  }
}
