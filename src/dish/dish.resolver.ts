import { Dish } from './entities/dish.entity';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { DishService } from './dish.service';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.input';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly dishService: DishService) {}

  @Role(['Owner'])
  @Mutation(() => CreateDishOutput)
  async createDish(
    @Args('input') createDishInput: CreateDishInput,
    @AuthUser() authUser: User
  ): Promise<CreateDishOutput> {
    return this.dishService.createDish(createDishInput, authUser);
  }
}
