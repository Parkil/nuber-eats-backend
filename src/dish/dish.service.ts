import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Dish } from './entities/dish.entity';
import { User } from '../users/entities/user.entity';

export class DishService {
  constructor(
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    private readonly restaurants: RestaurantRepository
  ) {}

  async createDish(
    { restaurantId, name, description, price, options }: CreateDishInput,
    owner: User
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.verifyOwner(
        restaurantId,
        owner.id
      );

      await this.dishes.save(
        this.dishes.create({
          name,
          description,
          price,
          restaurant,
          options,
        })
      );

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
}
