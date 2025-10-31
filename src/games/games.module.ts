import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { Line98Service } from './line98/line98.service';
import { CaroService } from './caro/caro.service';
import { CaroGateway } from './caro/caro.gateway';
import { GameSession } from './game-session.entity';

@Module({
    imports: [TypeOrmModule.forFeature([GameSession])],
    providers: [GameGateway, Line98Service, CaroService, CaroGateway],
    exports: [Line98Service, CaroService],
})
export class GamesModule { }