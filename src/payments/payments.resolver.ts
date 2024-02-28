import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentsInput,
  CreatePaymentsOutput,
} from './dtos/create-payments.dto';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { GetPaymentsOutput } from './dtos/get-payments.dto';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Role(['Owner'])
  @Mutation(() => CreatePaymentsOutput)
  async createPayments(
    @Args('input') createPaymentsInput: CreatePaymentsInput,
    @AuthUser() owner: User
  ): Promise<CreatePaymentsOutput> {
    return this.paymentsService.createPayments(createPaymentsInput, owner);
  }

  @Role(['Owner'])
  @Query(() => GetPaymentsOutput)
  async getPayments(@AuthUser() owner: User): Promise<GetPaymentsOutput> {
    return this.paymentsService.getPayments(owner);
  }
}
