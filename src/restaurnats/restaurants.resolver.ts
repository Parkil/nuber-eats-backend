import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantsDto } from './dtos/create-restaurants.dto';
import { RestaurantService } from './restaurant.service';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(() => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation(() => Boolean)
  async createRestaurant(
    @Args('input') dto: CreateRestaurantsDto
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(dto);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
