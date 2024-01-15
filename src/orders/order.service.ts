import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entites/order.entity';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreateOrderInput,
  CreateOrderItemInput,
  CreateOrderOutput,
} from './dtos/create-order.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';
import { ViewOrderInput, ViewOrderOutput } from './dtos/view-order.dto';
import { ViewOrdersInput, ViewOrdersOutput } from './dtos/view-orders.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { errorMsg, successMsg } from '../common/msg/msg.util';

@Injectable()
export class OrderService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly restaurantRepository: RestaurantRepository,
    @Inject(PUB_SUB) private readonly pubSub: PubSub
  ) {}

  async createOrder(
    { restaurantId, items }: CreateOrderInput,
    customer: User
  ): Promise<CreateOrderOutput> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const restaurant = await this.restaurantRepository.findOne({
          where: { id: restaurantId },
        });

        if (!restaurant) {
          return errorMsg('Restaurant not found');
        }

        const dishIds: number[] = items.map((item) => item.dishId);

        const dishes: Dish[] = await this.dishes.find({
          where: { id: In(dishIds) },
        });

        if (dishes.length === 0 || dishes.length < items.length) {
          return errorMsg('Dish Not Found');
        }

        const orderPrice = this._calcPrice(dishes, items);
        const orderItems = await entityManager.save(
          OrderItem,
          this._makeOrderItems(dishes, items)
        );

        const newOrder = await entityManager.save(
          Order,
          this.orders.create({
            customer,
            restaurant,
            total: orderPrice,
            items: orderItems,
          })
        );

        await this.pubSub.publish(NEW_PENDING_ORDER, {
          pendingOrders: { newOrder, ownerId: restaurant.ownerId },
        });

        return successMsg({ orderId: newOrder.id });
      });
    } catch (e) {
      return errorMsg(e);
    }
  }

  private _calcPrice(dishes: Dish[], items: CreateOrderItemInput[]): number {
    let orderFinalPrice = 0;

    for (const item of items) {
      const dish = dishes.filter((row) => row.id === item.dishId)[0];

      let dishFinalPrice = dish.price;
      for (const itemOption of item.options) {
        const dishOption = dish.options.find(
          (dishOption) => dishOption.name === itemOption.name
        );

        if (!dishOption) {
          continue;
        }

        if (dishOption.extra) {
          // option 자체에 붙는 추가 요금
          dishFinalPrice += dishOption.extra;
        } else {
          // option 내부의 선택사항에 붙는 추가 요금
          const dishOptionChoice = dishOption.choices.find(
            (optionChoice) => optionChoice.name == itemOption.choice
          );

          if (dishOptionChoice?.extra) {
            dishFinalPrice += dishOptionChoice.extra;
          }
        }
      }

      orderFinalPrice += dishFinalPrice;
    }

    return orderFinalPrice;
  }

  private _makeOrderItems(
    dishes: Dish[],
    items: CreateOrderItemInput[]
  ): OrderItem[] {
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const dish = dishes.filter((row) => row.id === item.dishId)[0];
      const orderItem = this.orderItemRepository.create({
        dish,
        options: item.options,
      });

      orderItems.push(orderItem);
    }

    return orderItems;
  }

  async viewOrder(
    { orderId }: ViewOrderInput,
    user: User
  ): Promise<ViewOrderOutput> {
    try {
      const order = await this.orders.findOne({
        relations: ['items', 'restaurant'],
        where: { id: orderId },
      });

      if (!order) {
        return errorMsg('Order Info Not Found');
      }

      const checkApproachErrorMsg = this._checkApproach(user, order);

      if (checkApproachErrorMsg !== '') {
        return errorMsg(checkApproachErrorMsg);
      }

      return successMsg({ orderInfo: order });
    } catch (e) {
      return errorMsg(e);
    }
  }

  private _checkApproach(user: User, order: Order): string {
    if (
      (user.role === UserRole.Client && order.customerId !== user.id) ||
      (user.role === UserRole.Delivery && order.driverId !== user.id) ||
      (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id)
    ) {
      return 'Invalid Approach';
    } else {
      return '';
    }
  }

  async viewOrders(
    { status }: ViewOrdersInput,
    user: User
  ): Promise<ViewOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: {
              id: user.id,
            },
            ...(status && { status }), // 해당 파라메터가 있을때에만 입력
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: {
              id: user.id,
            },
            ...(status && { status }),
          },
        });
      } else {
        // Owner
        const restaurants = await this.restaurantRepository.find({
          where: {
            owner: {
              id: user.id,
            },
            orders: {
              ...(status && { status }),
            },
          },
          relations: ['orders'],
        });

        orders = restaurants.flatMap((restaurant) => restaurant.orders);
      }

      return successMsg({ orders: orders });
    } catch (e) {
      return errorMsg(e);
    }
  }

  async editOrder(
    { id, status }: EditOrderInput,
    user: User
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        relations: ['restaurant'],
        where: { id: id },
      });

      if (!order) {
        return errorMsg('Order Info Not Found');
      }

      const checkApproachErrorMsg = this._checkApproach(user, order);

      if (checkApproachErrorMsg !== '') {
        return errorMsg(checkApproachErrorMsg);
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          return errorMsg('Cant edit status');
        }
      }

      if (user.role == UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          return errorMsg('Cant edit status');
        }
      }

      await this.orders.save({
        id,
        status,
      });

      const newOrder = { ...order, status };
      if (user.role === UserRole.Owner && status === OrderStatus.Cooked) {
        await this.pubSub.publish(NEW_COOKED_ORDER, {
          cookedOrders: newOrder,
        });
      }

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: newOrder,
      });

      return successMsg();
    } catch (e) {
      return errorMsg(e);
    }
  }

  async takeOrder(
    { id: orderId }: TakeOrderInput,
    driver: User
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne({
        relations: ['restaurant'],
        where: { id: orderId },
      });

      if (!order) {
        return errorMsg('Order Info Not Found');
      }

      if (order.driver) {
        return errorMsg('This Order already has a driver');
      }

      await this.orders.save([
        {
          id: orderId,
          driver: driver,
        },
      ]);

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });

      return successMsg();
    } catch (e) {
      return errorMsg(e);
    }
  }
}
