import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { User } from './entities/user.entity';
import { GameSession } from './games/game-session.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'game.db',
      entities: [User, GameSession],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    GamesModule,
  ],
  controllers: [AppController], // Thêm controller này
})
export class AppModule { }