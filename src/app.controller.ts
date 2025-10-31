import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {

    @Get()
    getHome(@Res() res: Response) {
        res.sendFile(join(process.cwd(), 'public', 'index.html'));
    }

    @Get('game-client.js')
    getGameClient(@Res() res: Response) {
        res.sendFile(join(process.cwd(), 'public', 'game-client.js'));
    }

}