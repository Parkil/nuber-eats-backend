import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateRestaurantsDto } from './dtos/create-restaurants.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurants.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  createRestaurant(
    createRestaurantDto: CreateRestaurantsDto
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurants.create(createRestaurantDto);
    return this.restaurants.save(newRestaurant);
  }

  updateRestaurant(
    id: number,
    data: UpdateRestaurantDto
  ): Promise<UpdateResult> {
    return this.restaurants.update(id, { ...data });
  }
}
