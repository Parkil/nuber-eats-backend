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
  NEW_PENDING_ORDER,
  PUB_SUB,
  NEW_ORDER_UPDATE,
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
    filter: (payload, _, user) => {
      console.log('payload : ', payload);
      console.log('user : ', user);
      //return ownerId === user.id;
      return true;
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
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User }
    ) => {
      console.log('payload : ', order);
      console.log('user : ', user);
      console.log('variables : ', input);
      // orderUpdates : publish method 에서 실어보낸 데이터
      // user : auth guard 에서 가져온 사용자 정보
      // input : Subscription 에서 사용한 파라메터

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
    // filter 에서 조건을 거는 방법도 있지만 pubSub.asyncIterator 자체를 반환하지 못하게 하는 방법도 있다
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }

  @Role(['Delivery'])
  @Mutation(() => TakeOrderOutput)
  async takeOrder(
    @Args('input') takeOrderInput: TakeOrderInput,
    @AuthUser() driver: User
  ): Promise<TakeOrderOutput> {
    return this.orderService.takeOrder(takeOrderInput, driver);
  }
}
