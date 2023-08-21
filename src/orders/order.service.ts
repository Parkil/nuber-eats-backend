import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entites/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';
import { ViewOrderInput, ViewOrderOutput } from './dtos/view-order.dto';
import { ViewOrdersInput, ViewOrdersOutput } from './dtos/view-orders.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderitems: Repository<OrderItem>,
    private readonly restaurants: RestaurantRepository
  ) {}

  async createOrder(
    { restaurantId, items }: CreateOrderInput,
    customer: User
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw 'Restaurant not found';
      }

      // todo dish가 레스토랑과도 연결이 되는데 그러면 dishId를 받는게 아니라 restaurant relation으로 dish를 가져와서 검색을 해야 하지 않나?
      // todo 그런데 그렇게 되면 한 레스토랑에 dish가 많아지는 경우 전체 dish를 가져와서 검색을 해야 하기 때문에 문제가 발생할 소지가 있다
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });

        if (!dish) {
          throw 'Dish Not Found';
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name
          );

          if (dishOption) {
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
        }

        orderFinalPrice += dishFinalPrice;

        const orderItem = await this.orderitems.save(
          this.orderitems.create({
            dish,
            options: item.options,
          })
        );
        orderItems.push(orderItem);
      }

      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
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
        throw 'Order Info Not Found';
      }

      if (
        (user.role === UserRole.Client && order.customerId !== user.id) ||
        (user.role === UserRole.Delivery && order.driverId !== user.id) ||
        (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id)
      ) {
        throw 'Invalid Approach';
      }

      return {
        ok: true,
        orderInfo: order,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async viewOrders(
    { status }: ViewOrdersInput,
    user: User
  ): Promise<ViewOrdersOutput> {
    try {
      let orders: Order[] = [];
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
        const restaurants = await this.restaurants.find({
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

      return {
        ok: true,
        orders: orders,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async editOrder(
    { id, status }: EditOrderInput,
    user: User
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        relations: ['items', 'restaurant'],
        where: { id: id },
      });

      if (!order) {
        throw 'Order Info Not Found';
      }

      if (
        (user.role === UserRole.Client && order.customerId !== user.id) ||
        (user.role === UserRole.Delivery && order.driverId !== user.id) ||
        (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id)
      ) {
        throw 'Invalid Approach';
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          throw 'Cant edit status';
        }
      }

      if (user.role == UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          throw 'Cant edit status';
        }
      }

      await this.orders.save({
        id,
        status,
      });

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
