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
} from '@grandgold/database';
import type { UserProfile, UpdateProfileRequest, UserPreferences, Address } from '@grandgold/types';
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
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const addresses = await getUserAddresses(userId);

    // Compile all user data
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
      preferences: user.preferences,
      consent: {
        marketing: user.marketingConsent,
        whatsapp: user.whatsappConsent,
      },
      exportedAt: new Date().toISOString(),
      // TODO: Add orders, reviews, etc.
    };
  }

  /**
   * Delete user account (GDPR - Right to be forgotten)
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
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

    // Soft delete user
    await deleteUser(userId);

    // Invalidate all sessions
    await this.sessionService.invalidateAll(userId);

    // TODO: Schedule data deletion after grace period
  }

  private mapAddress(address: any): Address {
    return {
      id: address.id,
      line1: address.line1,
      line2: address.line2 || undefined,
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      location: address.latitude && address.longitude ? {
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
      } : undefined,
      isDefault: address.isDefault,
      label: address.label as 'home' | 'work' | 'other' | undefined,
    };
  }
}
