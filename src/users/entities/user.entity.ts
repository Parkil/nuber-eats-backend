import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { Restaurant } from '../../restaurnats/entities/restaurant.entity';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @IsEmail()
  @Column({ unique: true })
  email: string;

  /*
  { select: false } 를 하게 되면 select 할 때 해당컬럼은 가져오지 않는다
   1개의 컬럼이라도 select : false를 반환하게 되면 findOne,All 을 할때 명시적으로
    정의하지 않으면 default 상태에서는 가져오지 않는 컬럼이 생기는 듯
   */
  @Field(() => String)
  @IsString()
  @Column({ select: false })
  password: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: false })
  @Field(() => Boolean)
  @IsBoolean()
  emailVerified: boolean;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  // BeforeInsert, BeforeUpdate 는 entity 를 이용한 insert, update 에서만 동작한다
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException(e);
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
