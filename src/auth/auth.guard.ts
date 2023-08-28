import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: AllowedRoles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler()
    );

    // 권한 설정이 없는 경우
    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = await this.findJwtUser({ gqlContext: gqlContext });
    gqlContext['user'] = user;

    // jwtToken 으로 검색한 사용자 정보가 존재하지 않을 경우
    if (!user) {
      return false;
    }

    if (roles.includes('Any')) {
      return true;
    }

    return roles.includes(user.role);
  }

  async findJwtUser({ gqlContext }: { gqlContext: any }) {
    const jwtToken = this.getJwtToken({ gqlContext: gqlContext });

    try {
      const decoded = this.jwtService.verify(jwtToken);

      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const output = await this.userService.findById(decoded['id']);
        return output['user'];
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  getJwtToken({ gqlContext }: { gqlContext: any }): string {
    if (gqlContext['x-jwt']) {
      return gqlContext['x-jwt'];
    } else {
      const jwtHeaderIndex = gqlContext.req.rawHeaders.indexOf('x-jwt');
      if (jwtHeaderIndex == -1) {
        return undefined;
      }

      return gqlContext.req.rawHeaders[jwtHeaderIndex + 1];
    }
  }
}
