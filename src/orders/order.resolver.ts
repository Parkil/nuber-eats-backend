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

const pubSub = new PubSub();

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

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

  @Subscription(() => String)
  @Role(['Any'])
  eventAAABBB() {
    console.log('testEvent called');
    return pubSub.asyncIterator('testEvent');
  }

  @Mutation(() => String)
  @Role(['Any'])
  async fireEvent(@AuthUser() user: User) {
    await pubSub.publish('testEvent', { eventAAABBB: '333' });
    return '333';
  }
}
