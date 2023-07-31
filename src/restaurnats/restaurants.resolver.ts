import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
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
import {
  DeleteRestaurantsInput,
  DeleteRestaurantsOutput,
} from './dtos/delete-restaurants.input';
import { Category } from './entities/category.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';

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

  @Role(['Owner'])
  @Mutation(() => DeleteRestaurantsOutput)
  async deleteRestaurant(
    @Args('input') deleteRestaurantsInput: DeleteRestaurantsInput,
    @AuthUser() authUser: User
  ): Promise<DeleteRestaurantsOutput> {
    return await this.restaurantService.deleteRestaurant(
      deleteRestaurantsInput,
      authUser
    );
  }
}

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 동적으로 계산되는 Field
  @ResolveField(() => Number)
  async restaurantCount(@Parent() category: Category): Promise<number> {
    // 이부분을 1개 row 마다 sql 을 호출하기 보다는 @RelationId 같은걸 이용해서 한번에 처리하게 하는게 맞지 않을까? 나중에 테스트 필요
    return await this.restaurantService.restaurantCount(category);
  }

  @Query(() => AllCategoriesOutput)
  allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }
}
