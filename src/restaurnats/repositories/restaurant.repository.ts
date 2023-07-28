import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';

@Injectable()
export class RestaurantRepository extends Repository<Restaurant> {
  constructor(private readonly dataSource: DataSource) {
    super(Restaurant, dataSource.createEntityManager());
  }

  async verifyOwner(
    restaurantId: number,
    ownerId: number
  ): Promise<Restaurant> {
    const restaurant = await this.findOne({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw 'Restaurant not found';
    }

    if (ownerId !== restaurant.ownerId) {
      throw 'This restaurant doesnt belong to you';
    }

    return restaurant;
  }
}
