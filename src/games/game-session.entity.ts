import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../entities/user.entity';

@Entity('game_sessions')
export class GameSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameType: string; // 'line98' or 'caro'

    @Column('text')
    gameState: string; // JSON stringified game state

    @ManyToOne(() => User)
    player1: User;

    @ManyToOne(() => User, { nullable: true })
    player2: User;

    @Column({ default: 'waiting' })
    status: string; // waiting, playing, finished

    @Column({ nullable: true })
    winnerId: string;

    @CreateDateColumn()
    createdAt: Date;
}