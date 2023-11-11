import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import * as process from 'process';
import { Verification } from './users/entities/verification.entity';
import { EmailModule } from './email/email.module';
import { Restaurant } from './restaurnats/entities/restaurant.entity';
import { Category } from './restaurnats/entities/category.entity';
import { RestaurantsModule } from './restaurnats/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { DishModule } from './dish/dish.module';
import { Dish } from './dish/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entites/order.entity';
import { OrderItem } from './orders/entites/order-item.entity';
import { CommonModule } from './common/common.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('dev', 'test', 'prod')
          .default('dev')
          .required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432).required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAIL_GUN_API_KEY: Joi.string().required(),
        MAIL_GUN_EMAIL_DOMAIN: Joi.string().required(),
        MAIL_GUN_FROM_EMAIL: Joi.string().required(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      /*
        Graphql subscription 을 설정하는 방법
        Apollo Server v2, v3 : installSubscriptionHandlers: true,
        Apollo Server v4 : subscriptions: { 'graphql-ws': true, },

        현재 의존성은 apollo-server-express 로 설정되어 있는데 이는 Apollo Server v3를 지원하도록 되어 있으며
        npm 사이트에서는 2024-10-22에 폐기된다고 설명하고 있음

        나중에 Apollo Server v4 를 지원하도록 설정 및 의존성 버전업을 할 필요가 있다
       */
      driver: ApolloDriver,
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      // graphql subscription 실행시 header 정보를 넘기기 위한 설정 v4에서는 설정이 변경될 수 있음
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams) => {
            return connectionParams;
          },
        },
      },
      context: ({ req, connection }) => {
        const TOKEN_KEY = 'x-jwt';
        return {
          token: req ? req.headers[TOKEN_KEY] : connection.context[TOKEN_KEY],
        };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      synchronize: process.env.NODE_ENV !== 'prod',
      entities: [
        User,
        Verification,
        Restaurant,
        Category,
        Dish,
        Order,
        OrderItem,
        Payment,
      ],
    }),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    EmailModule.forRoot({
      apiKey: process.env.MAIL_GUN_API_KEY,
      emailDomain: process.env.MAIL_GUN_EMAIL_DOMAIN,
      fromEmail: process.env.MAIL_GUN_FROM_EMAIL,
    }),
    DishModule,
    OrdersModule,
    CommonModule,
    PaymentsModule,
    ScheduleModule.forRoot(),
    UploadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
