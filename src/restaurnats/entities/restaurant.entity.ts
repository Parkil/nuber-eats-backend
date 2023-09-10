import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { User } from '../../users/entities/user.entity';
import { Dish } from '../../dish/entities/dish.entity';
import { Order } from '../../orders/entites/order.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { fileExistsAsync } from 'tsconfig-paths/lib/filesystem';
import { boolean } from 'joi';

// @InputType 의 이름을 지정하지 않을 경우 @InputType, @ObjectType 중 같은 이름의 변수가 존재할 경우 오류가 발생
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  @Length(5, 10)
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => String)
  @Column()
  @Length(5)
  address: string;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.restaurants)
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants)
  owner: User;

  @Field(() => [Dish])
  @OneToMany(() => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @Field(() => [Payment])
  @OneToMany(() => Payment, (payment) => payment.restaurant)
  payments: Payment[];

  // 연관관계 에 있는 entity 의 key 값을 가져온다 JPA 에도 있는지 확인 필요
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(() => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil?: Date;
}
