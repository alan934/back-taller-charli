import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(user: User, title: string, message: string, type: NotificationType = NotificationType.INFO, bookingId?: number) {
    const notification = this.notificationRepository.create({
      user,
      title,
      message,
      type,
      bookingId,
    });
    return this.notificationRepository.save(notification);
  }

  async findAllByUser(userId: number) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    return this.notificationRepository.update(id, { read: true });
  }

  async markAllAsRead(userId: number) {
    return this.notificationRepository.update({ user: { id: userId }, read: false }, { read: true });
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({ where: { user: { id: userId }, read: false } });
  }

  // Helper method to notify admins
  async notifyAdmins(userRepo: Repository<User>, title: string, message: string, type: NotificationType = NotificationType.INFO, bookingId?: number) {
      // Assuming 'isAdmin' or role check. I will adjust this after checking User entity or Role enum
      // Based on context, there is a role enum.
      const admins = await userRepo.find({ where: { role: 'admin' as any } }); // I will refine this "any" cast
      for (const admin of admins) {
          await this.create(admin, title, message, type, bookingId);
      }
  }
}
