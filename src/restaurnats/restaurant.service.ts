import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Repository } from 'typeorm';
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

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
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
      const restaurant = await this.restaurants.findOne({
        where: {
          id: editRestaurantsInput.restaurantId,
        },
      });

      if (!restaurant) {
        throw 'Restaurant not found';
      }

      if (owner.id !== restaurant.ownerId) {
        throw 'You can`t edit a restaurant that you dont own';
      }

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
}
