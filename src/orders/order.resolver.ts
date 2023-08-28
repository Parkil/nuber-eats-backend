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
import { PUB_SUB } from '../common/common.constants';

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

  @Mutation(() => String)
  @Role(['Any'])
  async fireEvent(@Args('id') id: number) {
    await this.pubSub.publish('testEvent', {
      subscribeEvent: id,
    });
    return '333';
  }

  @Subscription(() => String, {
    filter: ({ subscribeEvent }, { id }) => {
      /*
      { subscribeEvent: 8 } { id: 1 } {
        'x-jwt': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjkyNjU2OTI3fQ.4aDdZYso1QHsfeOtafLaHuqNWpFsNF38mJz7Y-cgUo0',
        user: User {
          id: 1,
          createdAt: 2023-08-16T05:58:49.561Z,
          updatedAt: 2023-08-16T05:58:49.561Z,
          email: 'owner1@gmail.com',
          role: 'Owner',
          emailVerified: false
        }
      }
      */
      return subscribeEvent === id;
    },
  })
  @Role(['Any'])
  subscribeEvent(@Args('id') id: number) {
    console.log('subscribeEvent called');
    return this.pubSub.asyncIterator('testEvent');
  }
}
