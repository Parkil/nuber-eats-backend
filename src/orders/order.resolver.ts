import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Order } from './entites/order.entity';
import { OrderService } from './order.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { ViewOrderInput, ViewOrderOutput } from './dtos/view-order.dto';
import { ViewOrdersInput, ViewOrdersOutput } from './dtos/view-orders.dto';

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
    @Args('input') viewOrderInput: ViewOrderInput
  ): Promise<ViewOrderOutput> {
    return this.orderService.viewOrder(viewOrderInput);
  }

  @Role(['Any'])
  @Query(() => ViewOrdersOutput)
  async viewOrders(
    @Args('input') viewOrdersInput: ViewOrdersInput,
    @AuthUser() user: User
  ): Promise<ViewOrdersOutput> {
    return this.orderService.viewOrders(viewOrdersInput, user);
  }
}
