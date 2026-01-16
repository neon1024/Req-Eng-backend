import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('moods')
@Unique(['userId', 'date'])
export class Mood {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'int' })
    rate!: number; // 1-10

    @Column({ type: 'date' })
    date!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
