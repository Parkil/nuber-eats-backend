import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Order } from './entites/order.entity';
import { OrderService } from './order.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { ViewOrderInput, ViewOrderOutput } from './dtos/view-order.dto';
import { ViewOrdersInput, ViewOrdersOutput } from './dtos/view-orders.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub
  ) {}

  @Role(['Client'])
  @Mutation(() => CreateOrderOutput)
  async createOrder(
    @Args('input') createOrderInput: CreateOrderInput,
    @AuthUser() customer: User
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(createOrderInput, customer);
  }

  @Role(['Any'])
  @Query(() => ViewOrderOutput)
  async viewOrder(
    @Args('input') viewOrderInput: ViewOrderInput,
    @AuthUser() user: User
  ): Promise<ViewOrderOutput> {
    return this.orderService.viewOrder(viewOrderInput, user);
  }

  @Role(['Any'])
  @Query(() => ViewOrdersOutput)
  async viewOrders(
    @Args('input') viewOrdersInput: ViewOrdersInput,
    @AuthUser() user: User
  ): Promise<ViewOrdersOutput> {
    return this.orderService.viewOrders(viewOrdersInput, user);
  }

  @Role(['Owner', 'Delivery'])
  @Mutation(() => EditOrderOutput)
  async editOrder(
    @Args('input') editOrderInput: EditOrderInput,
    @AuthUser() user: User
  ): Promise<EditOrderOutput> {
    return this.orderService.editOrder(editOrderInput, user);
  }

  @Role(['Delivery'])
  @Mutation(() => TakeOrderOutput)
  async takeOrder(
    @Args('input') takeOrderInput: TakeOrderInput,
    @AuthUser() driver: User
  ): Promise<TakeOrderOutput> {
    return this.orderService.takeOrder(takeOrderInput, driver);
  }

  @Subscription(() => Order, {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter: (_payload, _, _user) => {
      return true; // 나중에 frontend 리팩토링 할때 조건확인 필요
    },
    resolve: ({ cookedOrders }) => {
      return cookedOrders;
    },
  })
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Subscription(() => Order, {
    // filter : subscription 이 작동하는 기준
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id;
    },
    // resolver : subscription 을 호출하는 쪽에서 보낸 데이터를 정제해서 표시
    resolve: ({ pendingOrders: { newOrder } }) => {
      return newOrder;
    },
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Subscription(() => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User }
    ) => {
      if (
        order.driverId !== user.id &&
        order.customerId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        return false;
      }

      return order.id === input.id;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    console.log('orderUpdatesInput : ', orderUpdatesInput);
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }
}
