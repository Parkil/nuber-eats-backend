import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantsDto } from './dtos/create-restaurants.dto';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dtos/update-restaurants.dto';

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
    console.log('dto : ', dto);
    try {
      await this.restaurantService.createRestaurant(dto);
      return true;
    } catch (e) {
      return false;
    }
  }

  @Mutation(() => Boolean)
  async updateRestaurant(
    @Args('id') id: number,
    @Args('data') data: UpdateRestaurantDto
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaurant(id, data);
      return true;
    } catch (e) {
      return false;
    }
  }
}
