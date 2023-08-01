import { Injectable } from '@nestjs/common';
import {
  CreateRestaurantsInput,
  CreateRestaurantsOutput,
} from './dtos/create-restaurants.input';
import { User } from '../users/entities/user.entity';
import {
  EditRestaurantsInput,
  EditRestaurantsOutput,
} from './dtos/edit-restaurants.input';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import {
  DeleteRestaurantsInput,
  DeleteRestaurantsOutput,
} from './dtos/delete-restaurants.input';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository
  ) {}

  async createRestaurant(
    createRestaurantsInput: CreateRestaurantsInput,
    owner: User
  ): Promise<CreateRestaurantsOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantsInput);
      newRestaurant.owner = owner;

      newRestaurant.category = await this.categories.getOrCreateCategory(
        createRestaurantsInput.categoryName
      );

      await this.restaurants.save(newRestaurant);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  async editRestaurant(
    editRestaurantsInput: EditRestaurantsInput,
    owner: User
  ): Promise<EditRestaurantsOutput> {
    try {
      await this.restaurants.verifyOwner(
        editRestaurantsInput.restaurantId,
        owner.id
      );

      let category: Category = null;
      if (editRestaurantsInput.categoryName) {
        category = await this.categories.getOrCreateCategory(
          editRestaurantsInput.categoryName
        );
      }

      // ...(category && { category }) : category 가 null 이 아닌경우 'category' key category 변수명을 value 로 가지는 객체를 삽입 (...은 {} 를 제거한다는 의미)
      await this.restaurants.save([
        {
          id: editRestaurantsInput.restaurantId,
          ...editRestaurantsInput,
          ...(category && { category }),
        },
      ]);

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

  async deleteRestaurant(
    { id }: DeleteRestaurantsInput,
    owner: User
  ): Promise<DeleteRestaurantsOutput> {
    try {
      await this.restaurants.verifyOwner(id, owner.id);
      await this.restaurants.delete(id);

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

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const restaurantCntPerPage = 25;
      const [restaurants, totalCount] = await this.restaurants.findAndCount({
        take: restaurantCntPerPage, // 페이지당 보여지는 개수
        skip: (page - 1) * restaurantCntPerPage, // 시작점
      });

      const totalPages = Math.ceil(totalCount / restaurantCntPerPage);

      return {
        ok: true,
        results: restaurants,
        totalPages: totalPages,
        totalItems: totalCount,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();

      return {
        ok: true,
        categories: categories,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug: slug },
      });

      if (!category) {
        return {
          ok: true,
          error: 'Category Not Found',
        };
      }

      const restaurantCntPerPage = 25;
      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: restaurantCntPerPage, // 페이지당 보여지는 개수
        skip: (page - 1) * restaurantCntPerPage, // 시작점
      });

      const totalPages = Math.ceil(
        (await this.restaurantCount(category)) / restaurantCntPerPage
      );

      return {
        ok: true,
        category: category,
        restaurants: restaurants,
        totalPages: totalPages,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async restaurantCount(category: Category): Promise<number> {
    return await this.restaurants.count({
      where: {
        category: {
          id: category.id,
        },
      },
    });
  }
}
