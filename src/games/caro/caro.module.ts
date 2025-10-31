import { Module } from '@nestjs/common';
import { CaroGateway } from './caro.gateway';
import { CaroService } from './caro.service';

@Module({
    providers: [CaroGateway, CaroService],
    exports: [CaroService],
})
export class CaroModule { }