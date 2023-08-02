import {
  Args,
  InputType,
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
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { SearchRestaurantsInput, SearchRestaurantsOutput } from './dtos/search-restaurants.dto';

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

  @Query(() => RestaurantsOutput)
  async allRestaurants(
    @Args('input') restaurantsInput: RestaurantsInput
  ): Promise<RestaurantsOutput> {
    return await this.restaurantService.allRestaurants(restaurantsInput);
  }

  @Query(() => RestaurantOutput)
  async findRestaurant(
    @Args('input') restaurantInput: RestaurantInput
  ): Promise<RestaurantOutput> {
    return await this.restaurantService.findRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantsOutput)
  async findRestaurantsByName(
    @Args('input') searchRestaurantsInput: SearchRestaurantsInput
  ): Promise<SearchRestaurantsOutput> {
    return await this.restaurantService.findRestaurantsByName(
      searchRestaurantsInput
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

  @Query(() => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput
  ): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}
