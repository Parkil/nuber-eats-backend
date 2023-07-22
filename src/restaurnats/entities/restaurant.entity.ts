import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { User } from '../../users/entities/user.entity';

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
}
