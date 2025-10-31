import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async register(username: string, password: string): Promise<{ access_token: string }> {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({ where: { username } });
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = this.usersRepository.create({
            username,
            password: hashedPassword,
        });

        await this.usersRepository.save(user);

        // Generate JWT token
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async login(username: string, password: string): Promise<{ access_token: string }> {
        const user = await this.usersRepository.findOne({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validateUser(payload: any): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { id: payload.sub } });
    }
}