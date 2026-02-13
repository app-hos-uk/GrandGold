import {
  comparePassword,
  hashPassword,
  generateId,
  NotFoundError,
  ValidationError,
  AuthenticationError,
} from '@grandgold/utils';
import {
  findUserById,
  updateUser,
  deleteUser,
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getOrdersByCustomerId,
  getReviewsByUserId,
} from '@grandgold/database';
import type { UserProfile, UpdateProfileRequest, UserPreferences, Address, Country } from '@grandgold/types';
import { SessionService } from './session.service';

export class UserService {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const addresses = await getUserAddresses(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone || undefined,
      avatar: user.avatar || undefined,
      role: user.role,
      country: user.country,
      kycStatus: user.kycStatus,
      kycTier: user.kycTier as 0 | 1 | 2,
      preferences: user.preferences as UserPreferences,
      addresses: addresses.map(this.mapAddress),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Update only allowed fields
    const updatedUser = await updateUser(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      avatar: data.avatar,
    });

    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    return this.getProfile(userId);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.passwordHash) {
      throw new ValidationError('Cannot change password for social login accounts');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash and save new password
    const newPasswordHash = await hashPassword(newPassword);
    await updateUser(userId, { passwordHash: newPasswordHash });

    // Invalidate all other sessions
    // (User needs to re-login with new password)
    await this.sessionService.invalidateAll(userId);
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId: string): Promise<Address[]> {
    const addresses = await getUserAddresses(userId);
    return addresses.map(this.mapAddress);
  }

  /**
   * Add new address
   */
  async addAddress(userId: string, data: Omit<Address, 'id' | 'isDefault'>): Promise<Address> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const address = await createUserAddress({
      id: generateId('addr'),
      userId,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode,
      country: data.country,
      latitude: data.location?.latitude.toString() || null,
      longitude: data.location?.longitude.toString() || null,
      isDefault: false,
      label: data.label || null,
    });

    return this.mapAddress(address);
  }

  /**
   * Update address
   */
  async updateAddress(userId: string, addressId: string, data: Partial<Address>): Promise<Address> {
    const address = await updateUserAddress(addressId, userId, {
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode,
      country: data.country,
      latitude: data.location?.latitude.toString(),
      longitude: data.location?.longitude.toString(),
      isDefault: data.isDefault,
      label: data.label || null,
    });

    if (!address) {
      throw new NotFoundError('Address');
    }

    return this.mapAddress(address);
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await deleteUserAddress(addressId, userId);
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    return user.preferences as UserPreferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const currentPreferences = (user.preferences || {}) as UserPreferences;
    const currentNotif = currentPreferences.notifications || {};
    const newPreferences = {
      ...currentPreferences,
      ...data,
      notifications: {
        ...currentNotif,
        ...(data.notifications || {}),
      },
    };

    await updateUser(userId, { preferences: newPreferences });

    return newPreferences;
  }

  /**
   * Update WhatsApp consent
   */
  async updateWhatsAppConsent(userId: string, consent: boolean): Promise<void> {
    await updateUser(userId, { whatsappConsent: consent });
  }

  /**
   * Export user data (GDPR)
   * Includes profile, addresses, orders, reviews, preferences, and consent records.
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Fetch all user-associated data in parallel
    const [addresses, userOrders, userReviews] = await Promise.all([
      getUserAddresses(userId),
      getOrdersByCustomerId(userId).catch(() => []),
      getReviewsByUserId(userId).catch(() => []),
    ]);

    // Compile all user data for GDPR-compliant export
    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
        createdAt: user.createdAt,
      },
      addresses: addresses.map(this.mapAddress),
      orders: userOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        subtotal: order.subtotal,
        currency: order.currency,
        country: order.country,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: order.items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      reviews: userReviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      preferences: user.preferences,
      consent: {
        marketing: user.marketingConsent,
        whatsapp: user.whatsappConsent,
      },
      exportedAt: new Date().toISOString(),
      dataScope: 'Complete GDPR export including profile, addresses, orders, reviews, preferences, and consent records.',
    };
  }

  /**
   * Delete user account (GDPR - Right to be forgotten)
   *
   * Implements a 30-day grace period. The account is immediately soft-deleted
   * and all sessions invalidated, but personal data is retained for 30 days
   * so the user can reactivate. After the grace period a scheduled job
   * should perform a hard purge (anonymise PII).
   */
  async deleteAccount(userId: string, password: string): Promise<{ scheduledPurgeAt: string }> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify password if user has one
    if (user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        throw new AuthenticationError('Password is incorrect');
      }
    }

    // Calculate the purge date (30 days from now)
    const GRACE_PERIOD_DAYS = 30;
    const scheduledPurgeAt = new Date();
    scheduledPurgeAt.setDate(scheduledPurgeAt.getDate() + GRACE_PERIOD_DAYS);

    // Soft delete user — marks isDeleted=true and sets deletedAt
    await deleteUser(userId);

    // Store the scheduled purge date so the cron job knows when to anonymise
    await updateUser(userId, {
      // We store the purge date in preferences as a lightweight mechanism.
      // In a full production system this would be a dedicated column.
      preferences: {
        ...(user.preferences as Record<string, unknown> || {}),
        _deletionScheduledPurgeAt: scheduledPurgeAt.toISOString(),
        _deletionGracePeriodDays: GRACE_PERIOD_DAYS,
      },
    });

    // Invalidate all sessions
    await this.sessionService.invalidateAll(userId);

    return { scheduledPurgeAt: scheduledPurgeAt.toISOString() };
  }

  /**
   * Reactivate a soft-deleted account within the grace period.
   * The user must provide their password to prove ownership.
   */
  async reactivateAccount(userId: string, password: string): Promise<void> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.isDeleted) {
      throw new ValidationError('Account is not in deletion state');
    }

    // Check grace period
    const prefs = (user.preferences || {}) as Record<string, unknown>;
    const purgeAt = prefs._deletionScheduledPurgeAt as string | undefined;
    if (purgeAt && new Date(purgeAt) < new Date()) {
      throw new ValidationError('Grace period has expired. Account data has been permanently deleted.');
    }

    // Verify password
    if (user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        throw new AuthenticationError('Password is incorrect');
      }
    }

    // Reactivate: un-delete and clear purge metadata
    const cleanPrefs = { ...prefs };
    delete cleanPrefs._deletionScheduledPurgeAt;
    delete cleanPrefs._deletionGracePeriodDays;

    await updateUser(userId, {
      isDeleted: false,
      deletedAt: null,
      preferences: cleanPrefs,
    } as Record<string, unknown>);
  }

  private mapAddress(address: Record<string, unknown>): Address {
    return {
      id: address.id as string,
      line1: address.line1 as string,
      line2: (address.line2 as string) || undefined,
      city: address.city as string,
      state: (address.state as string) || '',
      postalCode: address.postalCode as string,
      country: address.country as Country,
      location: address.latitude && address.longitude ? {
        latitude: parseFloat(address.latitude as string),
        longitude: parseFloat(address.longitude as string),
      } : undefined,
      isDefault: address.isDefault as boolean,
      label: address.label as 'home' | 'work' | 'other' | undefined,
    };
  }
}
