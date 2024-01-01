import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { VerifyOutput } from '../dtos/verify-owner.dto';
import { errorMsg, successMsg } from '../../common/msg/msg.util';

@Injectable()
export class RestaurantRepository extends Repository<Restaurant> {
  constructor(private readonly dataSource: DataSource) {
    super(Restaurant, dataSource.createEntityManager());
  }

  async findAndCountPagination(
    _where: FindOptionsWhere<Restaurant>,
    page: number,
    articlePerPage: number
  ): Promise<[Restaurant[], number]> {
    return await this.findAndCount({
      relations: ['category'],
      where: _where,
      take: articlePerPage, // 페이지당 보여지는 개수
      skip: (page - 1) * articlePerPage, // 시작점
      order: {
        isPromoted: 'DESC',
      },
    });
  }

  async verifyOwner(
    restaurantId: number,
    ownerId: number
  ): Promise<VerifyOutput> {
    const restaurant = await this.findOne({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      return errorMsg('Restaurant not found');
    }

    if (ownerId !== restaurant.ownerId) {
      return errorMsg('This restaurant doesnt belong to you');
    }

    return successMsg({ restaurant: restaurant });
  }
}
